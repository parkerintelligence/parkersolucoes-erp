import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache para dados do Bacula
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Configuração de retry
const RETRY_CONFIG = { maxRetries: 3, backoffMs: 1000 };

// Níveis de erro
const ERROR_LEVELS = {
  'E': { level: 'critical', label: 'Crítico', priority: 1 },
  'F': { level: 'critical', label: 'Falha', priority: 1 },
  'f': { level: 'critical', label: 'Falha Fatal', priority: 1 },
  'A': { level: 'warning', label: 'Cancelado', priority: 2 },
  'T': { level: 'info', label: 'Finalizado', priority: 3 },
  'R': { level: 'info', label: 'Executando', priority: 4 },
  'C': { level: 'info', label: 'Criado', priority: 4 },
  'c': { level: 'info', label: 'Aguardando', priority: 4 },
};

// Função de retry com backoff exponencial
async function retryWithBackoff(fn: Function, retries: number): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.backoffMs * (RETRY_CONFIG.maxRetries - retries + 1)));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}

// Funções de cache
function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Função para obter horário de Brasília
function getBrasiliaTime(): string {
  return new Date().toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Função para determinar nível de erro
function getErrorLevel(status: string): { level: string, label: string, priority: number } {
  return ERROR_LEVELS[status] || { level: 'unknown', label: 'Desconhecido', priority: 5 };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[${getBrasiliaTime()}] Iniciando execução do relatório diário Bacula`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse do body da requisição
    const body = await req.json().catch(() => ({}));
    const { test_mode = false, phone_number = null, report_id = null } = body;

    console.log('Parâmetros recebidos:', { test_mode, phone_number, report_id });

    // Buscar template de mensagem
    let template;
    if (report_id) {
      const { data: templateData } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('id', report_id)
        .eq('is_active', true)
        .single();
      template = templateData;
    } else {
      const { data: templateData } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('name', 'Relatório Diário de Erros Bacula')
        .eq('template_type', 'bacula_daily_report')
        .eq('is_active', true)
        .single();
      template = templateData;
    }

    if (!template) {
      throw new Error('Template de relatório diário não encontrado ou inativo');
    }

    console.log('Template encontrado:', template.name);

    // Determinar destinatários
    let recipients: string[] = [];
    if (test_mode && phone_number) {
      recipients = [phone_number];
    } else {
      // Buscar destinatários dos relatórios agendados
      const { data: scheduledReports } = await supabase
        .from('scheduled_reports')
        .select('phone_number')
        .eq('report_type', template.id)
        .eq('is_active', true);

      if (scheduledReports && scheduledReports.length > 0) {
        recipients = scheduledReports.map(r => r.phone_number);
      }
    }

    if (recipients.length === 0) {
      console.log('Nenhum destinatário encontrado para o relatório');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Nenhum destinatário configurado para o relatório' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Destinatários encontrados: ${recipients.length}`);

    // Buscar integração Evolution API
    const { data: evolutionIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .single();

    if (!evolutionIntegration) {
      throw new Error('Integração Evolution API não encontrada');
    }

    // Buscar integração Bacula
    const { data: baculaIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('is_active', true)
      .single();

    if (!baculaIntegration) {
      throw new Error('Integração Bacula não encontrada');
    }

    console.log('Integrações encontradas - Evolution API e Bacula');

    // Calcular período do dia anterior em Brasília
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Início e fim do dia anterior em Brasília
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    
    // Converter para UTC para a consulta
    const startTimeUTC = startOfYesterday.toISOString();
    const endTimeUTC = endOfYesterday.toISOString();
    
    console.log(`Período de análise: ${startOfYesterday.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} até ${endOfYesterday.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);

    // Buscar dados do Bacula com múltiplas tentativas e endpoints
    let baculaData;
    const cacheKey = `bacula_jobs_${startTimeUTC}_${endTimeUTC}`;
    const cachedData = getCached(cacheKey);

    if (cachedData) {
      console.log('✅ Usando dados do cache');
      baculaData = cachedData;
    } else {
      console.log('🔍 Buscando dados do Bacula via API...');
      
      // Configurar múltiplas estratégias de busca
      const searchStrategies = [
        {
          endpoint: 'jobs/last24h',
          params: { limit: 1000, order_by: 'starttime', order_direction: 'desc' },
          description: 'Jobs das últimas 24h'
        },
        {
          endpoint: 'jobs',
          params: { limit: 1000, age: 86400, order_by: 'starttime', order_direction: 'desc' },
          description: 'Jobs com filtro de idade'
        },
        {
          endpoint: 'jobs/all',
          params: { limit: 500 },
          description: 'Todos os jobs (limitado)'
        }
      ];

      let lastError = null;
      let successfulStrategy = null;

      for (const strategy of searchStrategies) {
        try {
          console.log(`🔄 Tentando estratégia: ${strategy.description}`);
          
          const baculaResponse = await retryWithBackoff(async () => {
            return await supabase.functions.invoke('bacula-proxy', {
              body: {
                endpoint: strategy.endpoint,
                params: strategy.params
              },
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              }
            });
          }, RETRY_CONFIG.maxRetries);

          if (baculaResponse.error) {
            console.error(`❌ Erro na estratégia ${strategy.description}:`, baculaResponse.error.message);
            lastError = baculaResponse.error;
            continue;
          }

          if (baculaResponse.data) {
            baculaData = baculaResponse.data;
            successfulStrategy = strategy.description;
            setCache(cacheKey, baculaData);
            console.log(`✅ Dados obtidos com sucesso via ${successfulStrategy}:`, {
              endpoint: strategy.endpoint,
              totalJobs: baculaData.jobs?.length || baculaData.output?.length || (Array.isArray(baculaData) ? baculaData.length : 0),
              stats: baculaData.stats,
              structure: Object.keys(baculaData || {})
            });
            break;
          }
        } catch (error) {
          console.error(`❌ Falha na estratégia ${strategy.description}:`, error);
          lastError = error;
          continue;
        }
      }

      // Se todas as estratégias falharam
      if (!baculaData && lastError) {
        console.error('🚨 TODAS as estratégias falharam. Erro crítico no Bacula:', lastError);
        
        // Enviar notificação de erro crítico
        const errorMessage = `🚨 *ERRO CRÍTICO - BACULA INDISPONÍVEL*\n\n` +
          `❌ **Sistema Bacula fora do ar**\n` +
          `⏰ **Data/Hora**: ${getBrasiliaTime()}\n` +
          `🔧 **Últimos erros**:\n${lastError.message || 'Conexão recusada'}\n\n` +
          `⚠️ **Ação necessária**: Verificar servidor Bacula (${baculaIntegration.base_url})\n\n` +
          `🔍 **Diagnóstico**:\n` +
          `• Conectividade de rede\n` +
          `• Status do serviço BaculaWeb\n` +
          `• Credenciais de autenticação\n` +
          `• Configuração de firewall`;

        // Enviar para todos os destinatários
        for (const recipient of recipients) {
          try {
            console.log(`📤 Enviando alerta crítico para: ${recipient}`);
            await supabase.functions.invoke('send-whatsapp-message', {
              body: {
                instanceName: evolutionIntegration.instance_name,
                phoneNumber: recipient,
                message: errorMessage
              }
            });
            console.log(`✅ Alerta enviado para ${recipient}`);
          } catch (msgError) {
            console.error(`❌ Erro ao enviar alerta para ${recipient}:`, msgError);
          }
        }

        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Sistema Bacula indisponível',
          details: lastError.message,
          tested_strategies: searchStrategies.map(s => s.description)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Processar dados do Bacula com múltiplas estruturas
    let jobs = [];
    let dataSource = 'unknown';
    
    // Analisar estrutura dos dados recebidos
    if (baculaData && typeof baculaData === 'object') {
      console.log('🔍 Analisando estrutura dos dados Bacula:', {
        isArray: Array.isArray(baculaData),
        keys: Object.keys(baculaData),
        type: typeof baculaData
      });

      // Tentar diferentes estruturas de resposta da API Bacula
      if (Array.isArray(baculaData)) {
        jobs = baculaData;
        dataSource = 'array_direct';
      } else if (baculaData.jobs && Array.isArray(baculaData.jobs)) {
        jobs = baculaData.jobs;
        dataSource = 'object_jobs';
      } else if (baculaData.output && Array.isArray(baculaData.output)) {
        jobs = baculaData.output;
        dataSource = 'object_output';
      } else if (baculaData.data && Array.isArray(baculaData.data)) {
        jobs = baculaData.data;
        dataSource = 'object_data';
      } else if (baculaData.result && Array.isArray(baculaData.result)) {
        jobs = baculaData.result;
        dataSource = 'object_result';
      } else {
        // Tentar extrair jobs de qualquer propriedade que seja array
        for (const [key, value] of Object.entries(baculaData)) {
          if (Array.isArray(value) && value.length > 0) {
            jobs = value;
            dataSource = `fallback_${key}`;
            console.log(`📋 Usando dados de propriedade: ${key}`);
            break;
          }
        }
      }
    }

    console.log(`📊 Dados processados: ${jobs.length} jobs encontrados (fonte: ${dataSource})`);

    // Validar se temos dados válidos
    if (jobs.length === 0) {
      console.log('⚠️ Nenhum job encontrado - verificando se é problema de dados ou período');
      
      // Log detalhado para diagnóstico
      console.log('🔍 Estrutura completa dos dados recebidos:', JSON.stringify(baculaData, null, 2).substring(0, 1000));
    }

    // Filtrar apenas jobs do período especificado (double-check com múltiplos campos de data)
    const filteredJobs = jobs.filter(job => {
      // Tentar múltiplos campos de data
      const possibleDates = [
        job.starttime,
        job.schedtime, 
        job.endtime,
        job.realendtime,
        job.created_at,
        job.timestamp
      ].filter(Boolean);

      if (possibleDates.length === 0) {
        console.log('⚠️ Job sem data válida:', job.jobid || job.id || job.name || 'unnamed');
        return false;
      }

      // Verificar se alguma data está no período
      for (const dateStr of possibleDates) {
        try {
          const jobTime = new Date(dateStr);
          if (!isNaN(jobTime.getTime()) && jobTime >= startOfYesterday && jobTime <= endOfYesterday) {
            return true;
          }
        } catch (error) {
          console.log('⚠️ Data inválida encontrada:', dateStr, error.message);
        }
      }
      
      return false;
    });

    console.log(`🎯 Jobs filtrados para o período: ${filteredJobs.length} de ${jobs.length} total`);

    // Log de amostra dos jobs filtrados
    if (filteredJobs.length > 0) {
      console.log('📋 Amostra de jobs válidos:', filteredJobs.slice(0, 3).map(job => ({
        id: job.jobid || job.id,
        name: job.job || job.name,
        client: job.client,
        status: job.jobstatus,
        starttime: job.starttime,
        bytes: job.jobbytes
      })));
    }

    // Análise dos jobs
    const errorJobs = filteredJobs.filter(job => {
      const status = job.jobstatus || job.status || 'U';
      const errorLevel = getErrorLevel(status);
      return errorLevel.level === 'critical';
    });

    const successJobs = filteredJobs.filter(job => {
      const status = job.jobstatus || job.status || 'U';
      return status === 'T'; // Terminated normally
    });

    const warningJobs = filteredJobs.filter(job => {
      const status = job.jobstatus || job.status || 'U';
      const errorLevel = getErrorLevel(status);
      return errorLevel.level === 'warning';
    });

    // Análise detalhada por cliente e tipo
    const clientAnalysis = {};
    const typeAnalysis = {};

    filteredJobs.forEach(job => {
      const client = job.client || job.clientname || 'Desconhecido';
      const type = job.type || job.level || 'Backup';
      const status = job.jobstatus || job.status || 'U';
      const errorLevel = getErrorLevel(status);

      // Análise por cliente
      if (!clientAnalysis[client]) {
        clientAnalysis[client] = { total: 0, errors: 0, success: 0, warnings: 0 };
      }
      clientAnalysis[client].total++;
      if (errorLevel.level === 'critical') clientAnalysis[client].errors++;
      else if (errorLevel.level === 'warning') clientAnalysis[client].warnings++;
      else if (status === 'T') clientAnalysis[client].success++;

      // Análise por tipo
      if (!typeAnalysis[type]) {
        typeAnalysis[type] = { total: 0, errors: 0, success: 0, warnings: 0 };
      }
      typeAnalysis[type].total++;
      if (errorLevel.level === 'critical') typeAnalysis[type].errors++;
      else if (errorLevel.level === 'warning') typeAnalysis[type].warnings++;
      else if (status === 'T') typeAnalysis[type].success++;
    });

    // Preparar dados para o template
    const reportData = {
      date: yesterday.toLocaleDateString('pt-BR'),
      time: getBrasiliaTime(),
      total_jobs: filteredJobs.length,
      error_jobs: errorJobs.length,
      success_jobs: successJobs.length,
      warning_jobs: warningJobs.length,
      error_rate: filteredJobs.length > 0 ? Math.round((errorJobs.length / filteredJobs.length) * 100) : 0,
      success_rate: filteredJobs.length > 0 ? Math.round((successJobs.length / filteredJobs.length) * 100) : 0,
      clients_with_errors: Object.keys(clientAnalysis).filter(client => clientAnalysis[client].errors > 0).length,
      total_clients: Object.keys(clientAnalysis).length,
      error_details: errorJobs.slice(0, 10).map(job => ({
        name: job.job || job.jobname || job.name || 'Job sem nome',
        client: job.client || job.clientname || 'Cliente desconhecido',
        status: getErrorLevel(job.jobstatus || job.status || 'U').label,
        time: job.starttime || job.schedtime || job.endtime || 'Hora desconhecida',
        level: job.level || 'Full',
        bytes: job.jobbytes ? formatBytes(job.jobbytes) : '0 B',
        files: job.jobfiles || 0,
        duration: job.duration || 'N/A',
        errors: job.joberrors || 0
      })),
      client_analysis: Object.entries(clientAnalysis)
        .filter(([_, data]) => data.errors > 0)
        .slice(0, 5)
        .map(([client, data]) => ({
          name: client,
          total: data.total,
          errors: data.errors,
          error_rate: Math.round((data.errors / data.total) * 100)
        })),
      // Dados adicionais para diagnóstico
      data_source: dataSource,
      successful_strategy: successfulStrategy || 'cache',
      raw_jobs_count: jobs.length,
      period_start: startOfYesterday.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      period_end: endOfYesterday.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };

    // Função auxiliar para formatBytes
    function formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    };

    console.log('Dados do relatório preparados:', {
      total_jobs: reportData.total_jobs,
      error_jobs: reportData.error_jobs,
      success_rate: reportData.success_rate
    });

    // Formatar mensagem usando o template melhorado
    let message = template.body;
    
    // Substituir variáveis básicas com dados reais
    message = message.replace(/\{\{date\}\}/g, reportData.date);
    message = message.replace(/\{\{time\}\}/g, reportData.time);
    message = message.replace(/\{\{totalJobs\}\}/g, reportData.total_jobs.toString());
    message = message.replace(/\{\{total_jobs\}\}/g, reportData.total_jobs.toString());
    message = message.replace(/\{\{errorJobs\}\}/g, reportData.error_jobs.toString());
    message = message.replace(/\{\{error_jobs\}\}/g, reportData.error_jobs.toString());
    message = message.replace(/\{\{successJobs\}\}/g, reportData.success_jobs.toString());
    message = message.replace(/\{\{success_jobs\}\}/g, reportData.success_jobs.toString());
    message = message.replace(/\{\{warningJobs\}\}/g, reportData.warning_jobs.toString());
    message = message.replace(/\{\{warning_jobs\}\}/g, reportData.warning_jobs.toString());
    message = message.replace(/\{\{errorRate\}\}/g, reportData.error_rate.toString());
    message = message.replace(/\{\{error_rate\}\}/g, reportData.error_rate.toString());
    message = message.replace(/\{\{successRate\}\}/g, reportData.success_rate.toString());
    message = message.replace(/\{\{success_rate\}\}/g, reportData.success_rate.toString());
    message = message.replace(/\{\{clientsWithErrors\}\}/g, reportData.clients_with_errors.toString());
    message = message.replace(/\{\{clients_with_errors\}\}/g, reportData.clients_with_errors.toString());
    message = message.replace(/\{\{totalClients\}\}/g, reportData.total_clients.toString());
    message = message.replace(/\{\{total_clients\}\}/g, reportData.total_clients.toString());

    // Adicionar informações de diagnóstico se necessário
    message = message.replace(/\{\{dataSource\}\}/g, dataSource);
    message = message.replace(/\{\{rawDataJobs\}\}/g, jobs.length.toString());
    message = message.replace(/\{\{successfulStrategy\}\}/g, successfulStrategy || 'cache');

    // Processar seções condicionais com múltiplas variações
    const conditionalPatterns = [
      { pattern: /\{\{#if error_jobs\}\}(.*?)\{\{\/if\}\}/gs, condition: reportData.error_jobs > 0 },
      { pattern: /\{\{#if errorJobs\}\}(.*?)\{\{\/if\}\}/gs, condition: reportData.error_jobs > 0 },
      { pattern: /\{\{#if hasErrors\}\}(.*?)\{\{\/if\}\}/gs, condition: reportData.error_jobs > 0 },
      { pattern: /\{\{#if hasCriticalErrors\}\}(.*?)\{\{\/if\}\}/gs, condition: reportData.error_jobs > 5 },
      { pattern: /\{\{#if total_jobs\}\}(.*?)\{\{\/if\}\}/gs, condition: reportData.total_jobs > 0 }
    ];

    conditionalPatterns.forEach(({ pattern, condition }) => {
      message = message.replace(pattern, (match, content) => {
        return condition ? content : '';
      });
    });

    // Processar loops de detalhes de erro com múltiplas variações
    const errorLoopPatterns = [
      /\{\{#each error_details\}\}(.*?)\{\{\/each\}\}/gs,
      /\{\{#each errorJobs\}\}(.*?)\{\{\/each\}\}/gs
    ];

    errorLoopPatterns.forEach(pattern => {
      if (reportData.error_details.length > 0) {
        message = message.replace(pattern, (match, content) => {
          return reportData.error_details.map(error => {
            let errorContent = content;
            // Múltiplas variações de variáveis
            errorContent = errorContent.replace(/\{\{name\}\}/g, error.name);
            errorContent = errorContent.replace(/\{\{jobname\}\}/g, error.name);
            errorContent = errorContent.replace(/\{\{client\}\}/g, error.client);
            errorContent = errorContent.replace(/\{\{status\}\}/g, error.status);
            errorContent = errorContent.replace(/\{\{time\}\}/g, error.time);
            errorContent = errorContent.replace(/\{\{startTime\}\}/g, error.time);
            errorContent = errorContent.replace(/\{\{level\}\}/g, error.level || 'Full');
            errorContent = errorContent.replace(/\{\{bytes\}\}/g, error.bytes || '0 B');
            errorContent = errorContent.replace(/\{\{files\}\}/g, error.files || '0');
            return errorContent;
          }).join('');
        });
      } else {
        message = message.replace(pattern, '');
      }
    });

    // Processar loops de análise de cliente
    const clientLoopPatterns = [
      /\{\{#each client_analysis\}\}(.*?)\{\{\/each\}\}/gs,
      /\{\{#each clientAnalysis\}\}(.*?)\{\{\/each\}\}/gs
    ];

    clientLoopPatterns.forEach(pattern => {
      if (reportData.client_analysis.length > 0) {
        message = message.replace(pattern, (match, content) => {
          return reportData.client_analysis.map(client => {
            let clientContent = content;
            clientContent = clientContent.replace(/\{\{name\}\}/g, client.name);
            clientContent = clientContent.replace(/\{\{total\}\}/g, client.total.toString());
            clientContent = clientContent.replace(/\{\{errors\}\}/g, client.errors.toString());
            clientContent = clientContent.replace(/\{\{error_rate\}\}/g, client.error_rate.toString());
            clientContent = clientContent.replace(/\{\{errorRate\}\}/g, client.error_rate.toString());
            return clientContent;
          }).join('');
        });
      } else {
        message = message.replace(pattern, '');
      }
    });

    // Limpar variáveis não substituídas (fallback)
    message = message.replace(/\{\{[^}]+\}\}/g, 'N/A');

    console.log('✅ Mensagem formatada com dados reais. Enviando para destinatários...');

    // Enviar mensagem para cada destinatário
    const results = [];
    for (const recipient of recipients) {
      try {
        console.log(`Enviando relatório para: ${recipient}`);
        
        const whatsappResponse = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            instanceName: evolutionIntegration.instance_name,
            phoneNumber: recipient,
            message: message
          }
        });

        if (whatsappResponse.error) {
          throw new Error(whatsappResponse.error.message);
        }

        results.push({
          phone_number: recipient,
          success: true,
          response: whatsappResponse.data
        });

        console.log(`✅ Relatório enviado com sucesso para ${recipient}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar relatório para ${recipient}:`, error);
        results.push({
          phone_number: recipient,
          success: false,
          error: error.message
        });
      }
    }

    // Log de métricas
    const executionTime = Date.now() - startTime;
    const successfulSends = results.filter(r => r.success).length;
    
    console.log(`[${getBrasiliaTime()}] Relatório concluído:`, {
      execution_time_ms: executionTime,
      recipients_total: recipients.length,
      recipients_success: successfulSends,
      jobs_analyzed: filteredJobs.length,
      jobs_with_errors: reportData.error_jobs
    });

    // Salvar log do relatório
    try {
      await supabase.from('scheduled_reports_logs').insert({
        report_id: template.id,
        user_id: template.user_id,
        phone_number: recipients[0], // Usar primeiro destinatário como referência
        status: successfulSends > 0 ? 'success' : 'failed',
        message_sent: successfulSends > 0,
        message_content: message,
        execution_time_ms: executionTime,
        whatsapp_response: { results },
        error_details: successfulSends === 0 ? 'Falha no envio para todos os destinatários' : null
      });
    } catch (logError) {
      console.error('Erro ao salvar log:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Relatório enviado com sucesso',
      details: {
        recipients_total: recipients.length,
        recipients_success: successfulSends,
        execution_time_ms: executionTime,
        report_data: reportData
      },
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[${getBrasiliaTime()}] Erro na execução do relatório:`, error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      execution_time_ms: executionTime,
      timestamp: getBrasiliaTime()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});