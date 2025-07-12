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

    // Buscar dados do Bacula
    let baculaData;
    const cacheKey = `bacula_jobs_${startTimeUTC}_${endTimeUTC}`;
    const cachedData = getCached(cacheKey);

    if (cachedData) {
      console.log('Usando dados do cache');
      baculaData = cachedData;
    } else {
      console.log('Buscando dados do Bacula...');
      
      try {
        const baculaResponse = await retryWithBackoff(async () => {
          return await supabase.functions.invoke('bacula-proxy', {
            body: {
              endpoint: 'jobs/last24h',
              params: {
                limit: 1000,
                order_by: 'starttime',
                order_direction: 'desc'
              }
            },
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            }
          });
        }, RETRY_CONFIG.maxRetries);

        if (baculaResponse.error) {
          throw new Error(`Erro na API Bacula: ${baculaResponse.error.message}`);
        }

        baculaData = baculaResponse.data;
        setCache(cacheKey, baculaData);
        console.log('✅ Dados do Bacula obtidos com sucesso:', {
          endpoint: baculaData.endpoint,
          totalJobs: baculaData.jobs?.length || 0,
          stats: baculaData.stats
        });
      } catch (error) {
        console.error('Erro crítico ao acessar Bacula:', error);
        
        // Enviar notificação de erro crítico
        const errorMessage = `🚨 *ERRO CRÍTICO - BACULA INDISPONÍVEL*\n\n` +
          `❌ **Falha na conexão com Bacula**\n` +
          `⏰ **Data/Hora**: ${getBrasiliaTime()}\n` +
          `🔧 **Erro**: ${error.message}\n\n` +
          `⚠️ O sistema Bacula não está respondendo. Verifique a conectividade e configuração.`;

        // Enviar para todos os destinatários
        for (const recipient of recipients) {
          try {
            await supabase.functions.invoke('send-whatsapp-message', {
              body: {
                instanceName: evolutionIntegration.instance_name,
                phoneNumber: recipient,
                message: errorMessage
              }
            });
          } catch (msgError) {
            console.error(`Erro ao enviar notificação de falha para ${recipient}:`, msgError);
          }
        }

        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Bacula indisponível',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Processar dados do Bacula
    let jobs = [];
    
    // Tentar diferentes estruturas de resposta da API Bacula
    if (baculaData && typeof baculaData === 'object') {
      if (Array.isArray(baculaData)) {
        jobs = baculaData;
      } else if (baculaData.jobs && Array.isArray(baculaData.jobs)) {
        jobs = baculaData.jobs;
      } else if (baculaData.data && Array.isArray(baculaData.data)) {
        jobs = baculaData.data;
      } else if (baculaData.result && Array.isArray(baculaData.result)) {
        jobs = baculaData.result;
      }
    }

    console.log(`Total de jobs encontrados: ${jobs.length}`);

    if (jobs.length === 0) {
      console.log('Nenhum job encontrado para o período');
    }

    // Filtrar apenas jobs do dia anterior (double-check)
    const filteredJobs = jobs.filter(job => {
      if (!job.starttime && !job.schedtime && !job.endtime) return false;
      
      const jobTime = new Date(job.starttime || job.schedtime || job.endtime);
      return jobTime >= startOfYesterday && jobTime <= endOfYesterday;
    });

    console.log(`Jobs filtrados para o dia anterior: ${filteredJobs.length}`);

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
        name: job.jobname || job.name || 'Job sem nome',
        client: job.client || job.clientname || 'Cliente desconhecido',
        status: getErrorLevel(job.jobstatus || job.status || 'U').label,
        time: job.starttime || job.schedtime || job.endtime || 'Hora desconhecida'
      })),
      client_analysis: Object.entries(clientAnalysis)
        .filter(([_, data]) => data.errors > 0)
        .slice(0, 5)
        .map(([client, data]) => ({
          name: client,
          total: data.total,
          errors: data.errors,
          error_rate: Math.round((data.errors / data.total) * 100)
        }))
    };

    console.log('Dados do relatório preparados:', {
      total_jobs: reportData.total_jobs,
      error_jobs: reportData.error_jobs,
      success_rate: reportData.success_rate
    });

    // Formatar mensagem usando o template
    let message = template.body;
    
    // Substituir variáveis básicas
    message = message.replace(/\{\{date\}\}/g, reportData.date);
    message = message.replace(/\{\{time\}\}/g, reportData.time);
    message = message.replace(/\{\{total_jobs\}\}/g, reportData.total_jobs.toString());
    message = message.replace(/\{\{error_jobs\}\}/g, reportData.error_jobs.toString());
    message = message.replace(/\{\{success_jobs\}\}/g, reportData.success_jobs.toString());
    message = message.replace(/\{\{warning_jobs\}\}/g, reportData.warning_jobs.toString());
    message = message.replace(/\{\{error_rate\}\}/g, reportData.error_rate.toString());
    message = message.replace(/\{\{success_rate\}\}/g, reportData.success_rate.toString());
    message = message.replace(/\{\{clients_with_errors\}\}/g, reportData.clients_with_errors.toString());
    message = message.replace(/\{\{total_clients\}\}/g, reportData.total_clients.toString());

    // Processar seções condicionais e loops
    // {{#if error_jobs}} ... {{/if}}
    message = message.replace(/\{\{#if error_jobs\}\}(.*?)\{\{\/if\}\}/gs, (match, content) => {
      return reportData.error_jobs > 0 ? content : '';
    });

    // {{#each error_details}} ... {{/each}}
    if (reportData.error_details.length > 0) {
      message = message.replace(/\{\{#each error_details\}\}(.*?)\{\{\/each\}\}/gs, (match, content) => {
        return reportData.error_details.map(error => {
          let errorContent = content;
          errorContent = errorContent.replace(/\{\{name\}\}/g, error.name);
          errorContent = errorContent.replace(/\{\{client\}\}/g, error.client);
          errorContent = errorContent.replace(/\{\{status\}\}/g, error.status);
          errorContent = errorContent.replace(/\{\{time\}\}/g, error.time);
          return errorContent;
        }).join('');
      });
    } else {
      message = message.replace(/\{\{#each error_details\}\}(.*?)\{\{\/each\}\}/gs, '');
    }

    // {{#each client_analysis}} ... {{/each}}
    if (reportData.client_analysis.length > 0) {
      message = message.replace(/\{\{#each client_analysis\}\}(.*?)\{\{\/each\}\}/gs, (match, content) => {
        return reportData.client_analysis.map(client => {
          let clientContent = content;
          clientContent = clientContent.replace(/\{\{name\}\}/g, client.name);
          clientContent = clientContent.replace(/\{\{total\}\}/g, client.total.toString());
          clientContent = clientContent.replace(/\{\{errors\}\}/g, client.errors.toString());
          clientContent = clientContent.replace(/\{\{error_rate\}\}/g, client.error_rate.toString());
          return clientContent;
        }).join('');
      });
    } else {
      message = message.replace(/\{\{#each client_analysis\}\}(.*?)\{\{\/each\}\}/gs, '');
    }

    console.log('Mensagem formatada, enviando para destinatários...');

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