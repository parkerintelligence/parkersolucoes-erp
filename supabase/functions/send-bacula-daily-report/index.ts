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
function getBrasiliaTime(date?: Date): string {
  const dateToUse = date || new Date();
  return dateToUse.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Função auxiliar para formatBytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função para processar blocos condicionais
function processConditionalBlocks(message: string, data: any): string {
  // Processar blocos condicionais {{#if condition}}...{{/if}}
  const ifBlocks = message.match(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs);
  if (ifBlocks) {
    ifBlocks.forEach(block => {
      const match = block.match(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/s);
      if (match) {
        const [fullMatch, condition, content] = match;
        const conditionValue = data[condition];
        const shouldShow = conditionValue && (typeof conditionValue === 'number' ? conditionValue > 0 : !!conditionValue);
        message = message.replace(fullMatch, shouldShow ? content : '');
      }
    });
  }
  
  return message;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[${getBrasiliaTime()}] 🚀 [BACULA-DAILY] Iniciando relatório diário Bacula expandido`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse do body da requisição
    const body = await req.json().catch(() => ({}));
    const { test_mode = false, phone_number = null, report_id = null } = body;

    console.log('📋 [BACULA-DAILY] Parâmetros recebidos:', { test_mode, phone_number, report_id });

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

    console.log('📝 [BACULA-DAILY] Template encontrado:', template.name);

    // Determinar destinatários
    let recipients: string[] = [];
    if (test_mode && phone_number) {
      recipients = [phone_number];
    } else {
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
      console.log('⚠️ [BACULA-DAILY] Nenhum destinatário encontrado');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Nenhum destinatário configurado para o relatório' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`👥 [BACULA-DAILY] Destinatários encontrados: ${recipients.length}`);

    // Buscar integrações
    const { data: evolutionIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .single();

    if (!evolutionIntegration) {
      throw new Error('Integração Evolution API não encontrada');
    }

    const { data: baculaIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('is_active', true)
      .single();

    if (!baculaIntegration) {
      throw new Error('Integração Bacula não encontrada');
    }

    console.log('🔌 [BACULA-DAILY] Integrações encontradas - Evolution API e Bacula');

    // Definir período de análise (apenas dia anterior completo)
    const brasiliaTime = new Date();
    const brasiliaYesterday = new Date(brasiliaTime);
    brasiliaYesterday.setDate(brasiliaYesterday.getDate() - 1);
    
    const brasiliaStartTime = new Date(brasiliaYesterday);
    brasiliaStartTime.setHours(0, 0, 0, 0);
    
    const brasiliaEndTime = new Date(brasiliaYesterday);
    brasiliaEndTime.setHours(23, 59, 59, 999);
    
    const yesterdayFormatted = brasiliaYesterday.toLocaleDateString('pt-BR');
    console.log(`🕐 [BACULA-DAILY] Analisando dia anterior completo: ${yesterdayFormatted}`);
    console.log(`🕐 [BACULA-DAILY] Período: ${brasiliaStartTime.toISOString()} até ${brasiliaEndTime.toISOString()}`);
    
    const startTimeUTC = brasiliaStartTime.toISOString();
    const endTimeUTC = brasiliaEndTime.toISOString();

    // Buscar dados do Bacula
    let baculaData;
    const cacheKey = `bacula_jobs_${startTimeUTC}_${endTimeUTC}`;
    const cachedData = getCached(cacheKey);

    if (cachedData) {
      console.log('✅ [BACULA-DAILY] Usando dados do cache');
      baculaData = cachedData;
    } else {
      console.log('🔍 [BACULA-DAILY] Buscando dados do Bacula via API...');
      
      const searchStrategies = [
        {
          endpoint: 'jobs/last24h',
          params: { limit: 1000, order_by: 'starttime', order_direction: 'desc' },
          description: 'Jobs das últimas 24h'
        },
        {
          endpoint: 'jobs',
          params: { limit: 1000, age: 172800, order_by: 'starttime', order_direction: 'desc' },
          description: 'Jobs com filtro de 48h'
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
          console.log(`🔄 [BACULA-DAILY] Tentando estratégia: ${strategy.description}`);
          
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
            console.error(`❌ [BACULA-DAILY] Erro na estratégia ${strategy.description}:`, baculaResponse.error.message);
            lastError = baculaResponse.error;
            continue;
          }

          if (baculaResponse.data) {
            baculaData = baculaResponse.data;
            successfulStrategy = strategy.description;
            setCache(cacheKey, baculaData);
            console.log(`✅ [BACULA-DAILY] Dados obtidos via ${successfulStrategy}`);
            break;
          }
        } catch (error) {
          console.error(`❌ [BACULA-DAILY] Falha na estratégia ${strategy.description}:`, error);
          lastError = error;
          continue;
        }
      }

      // Se todas as estratégias falharam
      if (!baculaData && lastError) {
        console.error('🚨 [BACULA-DAILY] TODAS as estratégias falharam');
        
        const errorMessage = `🚨 *ERRO CRÍTICO - BACULA INDISPONÍVEL*\n\n` +
          `❌ **Sistema Bacula fora do ar**\n` +
          `⏰ **Data/Hora**: ${getBrasiliaTime()}\n` +
          `🔧 **Erro**: ${lastError.message || 'Conexão recusada'}\n\n` +
          `⚠️ **Ação necessária**: Verificar servidor Bacula`;

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
            console.error(`❌ [BACULA-DAILY] Erro ao enviar alerta para ${recipient}:`, msgError);
          }
        }

        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Sistema Bacula indisponível'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Processar dados do Bacula
    let jobs = [];
    let dataSource = 'unknown';
    
    if (baculaData && typeof baculaData === 'object') {
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
      } else {
        for (const [key, value] of Object.entries(baculaData)) {
          if (Array.isArray(value) && value.length > 0) {
            jobs = value;
            dataSource = `fallback_${key}`;
            break;
          }
        }
      }
    }

    console.log(`📊 [BACULA-DAILY] Dados processados: ${jobs.length} jobs encontrados (fonte: ${dataSource})`);

    // Filtrar jobs do dia anterior
    const filteredJobs = jobs.filter(job => {
      const possibleDates = [
        job.starttime,
        job.schedtime, 
        job.endtime,
        job.realendtime,
        job.created_at,
        job.timestamp
      ].filter(Boolean);

      if (possibleDates.length === 0) return false;

      for (const dateStr of possibleDates) {
        try {
          const jobTime = new Date(dateStr);
          if (!isNaN(jobTime.getTime()) && jobTime >= brasiliaStartTime && jobTime <= brasiliaEndTime) {
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      
      return false;
    });

    console.log(`🎯 [BACULA-DAILY] Jobs filtrados do dia anterior (${yesterdayFormatted}): ${filteredJobs.length} de ${jobs.length} total`);

    if (filteredJobs.length === 0) {
      console.log('⚠️ [BACULA-DAILY] Nenhum job encontrado no dia anterior');
      const errorMessage = `⚠️ *ALERTA BACULA - SEM JOBS*\n\n` +
        `📅 **Dia analisado**: ${yesterdayFormatted}\n` +
        `❌ **Nenhum job encontrado no período**\n\n` +
        `🔍 **Ação necessária**: Verificar configuração dos jobs`;

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
          console.error(`❌ [BACULA-DAILY] Erro ao enviar alerta para ${recipient}:`, msgError);
        }
      }

      return new Response(JSON.stringify({ 
        success: false, 
        message: `Nenhum job encontrado no dia anterior (${yesterdayFormatted})` 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mapear todos os status possíveis do Bacula
    const statusMap = {
      'T': 'Concluído com Sucesso',
      'E': 'Erro (com diferenças)',
      'f': 'Erro Fatal',
      'A': 'Cancelado pelo usuário',
      'R': 'Executando',
      'C': 'Criado (aguardando)',
      'c': 'Aguardando recurso',
      'B': 'Bloqueado',
      'D': 'Verificação com diferenças',
      'I': 'Incompleto',
      'F': 'Aguardando no File Daemon',
      'S': 'Aguardando no Storage Daemon',
      'M': 'Aguardando nova mídia',
      'Q': 'Na fila (aguardando dispositivo)',
      'W': 'Aguardando'
    };

    // Categorizar jobs por status
    const jobsByStatus = {
      success: [],     // T
      errors: [],      // E, f
      cancelled: [],   // A
      running: [],     // R, C, c
      blocked: [],     // B, Q, W, F, S, M
      other: []        // D, I, outros
    };

    let totalBytes = 0;
    let totalFiles = 0;

    filteredJobs.forEach(job => {
      const jobStatus = job.jobstatus || job.status || 'U';
      
      // Calcular estatísticas
      if (job.jobbytes) totalBytes += parseInt(job.jobbytes) || 0;
      if (job.jobfiles) totalFiles += parseInt(job.jobfiles) || 0;
      
      // Categorizar por status
      if (jobStatus === 'T') {
        jobsByStatus.success.push(job);
      } else if (jobStatus === 'f' || jobStatus === 'E') {
        jobsByStatus.errors.push(job);
      } else if (jobStatus === 'A') {
        jobsByStatus.cancelled.push(job);
      } else if (jobStatus === 'R' || jobStatus === 'C' || jobStatus === 'c') {
        jobsByStatus.running.push(job);
      } else if (['B', 'Q', 'W', 'F', 'S', 'M'].includes(jobStatus)) {
        jobsByStatus.blocked.push(job);
      } else {
        jobsByStatus.other.push(job);
      }
    });

    // Função para formatar detalhes do job
    const formatJobDetails = (job) => ({
      name: job.job || job.jobname || job.name || 'Job desconhecido',
      client: job.client || job.clientname || 'Cliente desconhecido',
      level: job.level || 'N/A',
      starttime: job.starttime ? getBrasiliaTime(new Date(job.starttime)) : 'N/A',
      endtime: job.endtime ? getBrasiliaTime(new Date(job.endtime)) : 'N/A',
      duration: job.starttime && job.endtime ? 
        Math.round((new Date(job.endtime) - new Date(job.starttime)) / 60000) + ' min' : 'N/A',
      jobbytes: job.jobbytes ? formatBytes(parseInt(job.jobbytes)) : '0',
      jobfiles: job.jobfiles ? parseInt(job.jobfiles).toLocaleString('pt-BR') : '0',
      jobstatus: job.jobstatus || 'N/A',
      jobstatus_desc: statusMap[job.jobstatus] || `Status ${job.jobstatus}`,
      jobstatus_emoji: getStatusEmoji(job.jobstatus)
    });

    // Função para obter emoji do status
    function getStatusEmoji(status) {
      switch (status) {
        case 'T': return '✅';
        case 'f': return '❌';
        case 'E': return '⚠️';
        case 'A': return '🚫';
        case 'R': return '🔄';
        case 'C': case 'c': return '⏳';
        case 'B': case 'Q': case 'W': case 'F': case 'S': case 'M': return '⏸️';
        default: return '❓';
      }
    }

    // Estatísticas gerais
    const totalJobs = filteredJobs.length;
    const successJobs = jobsByStatus.success.length;
    const errorJobs = jobsByStatus.errors.length;
    const cancelledJobs = jobsByStatus.cancelled.length;
    const runningJobs = jobsByStatus.running.length;
    const blockedJobs = jobsByStatus.blocked.length;
    const otherJobs = jobsByStatus.other.length;
    const criticalJobs = errorJobs + cancelledJobs;

    console.log(`📈 [BACULA-DAILY] Estatísticas completas:`);
    console.log(`   Total: ${totalJobs} jobs do dia ${yesterdayFormatted}`);
    console.log(`   Sucessos: ${successJobs}`);
    console.log(`   Erros: ${errorJobs}`);
    console.log(`   Cancelados: ${cancelledJobs}`);
    console.log(`   Executando: ${runningJobs}`);
    console.log(`   Bloqueados: ${blockedJobs}`);
    console.log(`   Outros: ${otherJobs}`);

    // Preparar dados para o template
    const templateData = {
      analysis_date: yesterdayFormatted,
      report_time: getBrasiliaTime(),
      
      // Estatísticas gerais
      total_jobs: totalJobs,
      success_jobs: successJobs,
      error_jobs: errorJobs,
      cancelled_jobs: cancelledJobs,
      running_jobs: runningJobs,
      blocked_jobs: blockedJobs,
      other_jobs: otherJobs,
      critical_jobs: criticalJobs,
      success_rate: totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 0,
      
      // Dados processados
      total_bytes: formatBytes(totalBytes),
      total_files: totalFiles.toLocaleString('pt-BR'),
      
      // Detalhes dos jobs por categoria
      success_details: jobsByStatus.success.map(formatJobDetails),
      error_details: jobsByStatus.errors.map(formatJobDetails),
      cancelled_details: jobsByStatus.cancelled.map(formatJobDetails),
      running_details: jobsByStatus.running.map(formatJobDetails),
      blocked_details: jobsByStatus.blocked.map(formatJobDetails),
      other_details: jobsByStatus.other.map(formatJobDetails),
      
      // Manter compatibilidade com template antigo
      fatal_jobs: errorJobs,
      fatal_details: jobsByStatus.errors.map(formatJobDetails)
    };

    console.log('📋 [BACULA-DAILY] Dados estruturados para template:', {
      analysis_date: templateData.analysis_date,
      total_jobs: templateData.total_jobs,
      success_jobs: templateData.success_jobs,
      error_jobs: templateData.error_jobs,
      cancelled_jobs: templateData.cancelled_jobs,
      critical_jobs: templateData.critical_jobs,
      success_rate: templateData.success_rate
    });

    // Processar template da mensagem
    let finalMessage = template.body;

    // Substituir variáveis básicas
    Object.entries(templateData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (typeof value === 'string' || typeof value === 'number') {
        finalMessage = finalMessage.replace(new RegExp(placeholder, 'g'), value);
      }
    });

    // Função para formatar lista de jobs
    const formatJobsList = (jobs, showDuration = false) => {
      if (!jobs || jobs.length === 0) return '• Nenhum job encontrado';
      
      return jobs.map(job => {
        let jobText = `${job.jobstatus_emoji} *${job.name}*\n  🏢 ${job.client} • 📊 ${job.level} • 🕐 ${job.starttime}`;
        if (showDuration && job.duration !== 'N/A') {
          jobText += ` • ⏱️ ${job.duration}`;
        }
        jobText += `\n  💾 ${job.jobbytes} • 📁 ${job.jobfiles} arquivos • Status: ${job.jobstatus_desc}`;
        return jobText;
      }).join('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    };

    // Processar listas de jobs por categoria
    finalMessage = finalMessage.replace(/\{\{success_jobs_details\}\}/g, formatJobsList(templateData.success_details, true));
    finalMessage = finalMessage.replace(/\{\{error_jobs_details\}\}/g, formatJobsList(templateData.error_details, true));
    finalMessage = finalMessage.replace(/\{\{cancelled_jobs_details\}\}/g, formatJobsList(templateData.cancelled_details, true));
    finalMessage = finalMessage.replace(/\{\{running_jobs_details\}\}/g, formatJobsList(templateData.running_details));
    finalMessage = finalMessage.replace(/\{\{blocked_jobs_details\}\}/g, formatJobsList(templateData.blocked_details));
    finalMessage = finalMessage.replace(/\{\{other_jobs_details\}\}/g, formatJobsList(templateData.other_details, true));

    // Manter compatibilidade com template antigo
    finalMessage = finalMessage.replace(/\{\{fatal_jobs_details\}\}/g, formatJobsList(templateData.error_details, true));

    // Processar blocos condicionais
    finalMessage = processConditionalBlocks(finalMessage, templateData);

    console.log(`💬 [BACULA-DAILY] Mensagem final gerada (${finalMessage.length} caracteres)`);
    console.log(`📊 [BACULA-DAILY] Resumo: ${totalJobs} jobs do dia ${yesterdayFormatted}`);
    console.log(`   ✅ ${successJobs} sucessos (${templateData.success_rate}%)`);
    console.log(`   ❌ ${errorJobs} erros`);
    console.log(`   🚫 ${cancelledJobs} cancelados`);
    console.log(`   🔄 ${runningJobs} executando`);

    // Enviar mensagem para cada destinatário
    const results = [];
    for (const recipient of recipients) {
      try {
        console.log(`📤 [BACULA-DAILY] Enviando relatório para: ${recipient}`);
        
        const whatsappResponse = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            instanceName: evolutionIntegration.instance_name,
            phoneNumber: recipient,
            message: finalMessage
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

        console.log(`✅ [BACULA-DAILY] Relatório enviado com sucesso para ${recipient}`);
      } catch (error) {
        console.error(`❌ [BACULA-DAILY] Erro ao enviar relatório para ${recipient}:`, error);
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
    
    console.log(`[${getBrasiliaTime()}] 📊 [BACULA-DAILY] Relatório concluído:`, {
      execution_time_ms: executionTime,
      recipients_total: recipients.length,
      recipients_success: successfulSends,
      jobs_analyzed: filteredJobs.length,
      jobs_with_errors: templateData.error_jobs
    });

    // Salvar log do relatório
    try {
      await supabase.from('scheduled_reports_logs').insert({
        report_id: template.id,
        user_id: template.user_id,
        phone_number: recipients[0],
        status: successfulSends > 0 ? 'success' : 'failed',
        message_sent: successfulSends > 0,
        message_content: finalMessage,
        execution_time_ms: executionTime,
        whatsapp_response: { results },
        error_details: successfulSends === 0 ? 'Falha no envio para todos os destinatários' : null
      });
    } catch (logError) {
      console.error('❌ [BACULA-DAILY] Erro ao salvar log:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Relatório enviado com sucesso',
      details: {
        recipients_total: recipients.length,
        recipients_success: successfulSends,
        execution_time_ms: executionTime,
        analysis_date: yesterdayFormatted,
        total_jobs: totalJobs,
        success_rate: templateData.success_rate
      },
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[${getBrasiliaTime()}] ❌ [BACULA-DAILY] Erro na execução:`, error);

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