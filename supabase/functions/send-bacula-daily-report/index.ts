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

    // Buscar template e contexto do relatório
    let template;
    let reportUserId: string | null = null;
    let scheduledReportPhone: string | null = null;

    if (report_id) {
      // report_id é o ID do scheduled_reports
      const { data: scheduledReport, error: scheduledReportError } = await supabase
        .from('scheduled_reports')
        .select('report_type, user_id, phone_number')
        .eq('id', report_id)
        .maybeSingle();

      if (scheduledReportError || !scheduledReport) {
        throw new Error(`Agendamento não encontrado para report_id ${report_id}`);
      }

      reportUserId = scheduledReport.user_id;
      scheduledReportPhone = scheduledReport.phone_number;

      console.log('🔍 [BACULA-DAILY] Contexto do agendamento:', {
        report_id,
        report_user_id: reportUserId,
        phone: scheduledReportPhone,
      });

      const { data: templateData } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('id', scheduledReport.report_type)
        .eq('is_active', true)
        .single();
      template = templateData;
    } else {
      const { data: templateData } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .or('template_type.eq.bacula_daily_report,template_type.eq.bacula_daily')
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
    } else if (scheduledReportPhone) {
      recipients = [scheduledReportPhone];
    } else {
      let recipientsQuery = supabase
        .from('scheduled_reports')
        .select('phone_number')
        .eq('report_type', template.id)
        .eq('is_active', true);

      if (reportUserId) {
        recipientsQuery = recipientsQuery.eq('user_id', reportUserId);
      }

      const { data: scheduledReports } = await recipientsQuery;

      if (scheduledReports && scheduledReports.length > 0) {
        recipients = [...new Set(scheduledReports.map(r => r.phone_number))];
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

    // Buscar integração Evolution API (prioriza integração do usuário do relatório)
    let evolutionIntegration: any = null;

    if (reportUserId) {
      const { data: userEvolutionIntegration } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'evolution_api')
        .eq('is_active', true)
        .eq('is_global', true)
        .eq('user_id', reportUserId)
        .maybeSingle();

      evolutionIntegration = userEvolutionIntegration;
    }

    if (!evolutionIntegration) {
      const { data: fallbackEvolutionIntegrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'evolution_api')
        .eq('is_active', true)
        .eq('is_global', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      evolutionIntegration = fallbackEvolutionIntegrations?.[0] || null;
    }

    if (!evolutionIntegration) {
      throw new Error('Integração Evolution API não encontrada');
    }

    // Buscar configuração de instância por tela (whatsapp_screen_config)
    let baculaInstanceName = '';
    let screenConfigSetting: { setting_value: string } | null = null;

    if (reportUserId) {
      const { data: userScreenConfigSetting } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_screen_config')
        .eq('user_id', reportUserId)
        .maybeSingle();

      screenConfigSetting = userScreenConfigSetting;
    }

    if (!screenConfigSetting) {
      const { data: fallbackScreenConfigSetting } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_screen_config')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      screenConfigSetting = fallbackScreenConfigSetting;

      if (screenConfigSetting && reportUserId) {
        console.warn(`⚠️ [BACULA-DAILY] Screen config do usuário ${reportUserId} não encontrada. Usando configuração global mais recente.`);
      }
    }

    if (screenConfigSetting) {
      try {
        const screenConfig = JSON.parse(screenConfigSetting.setting_value);
        baculaInstanceName = screenConfig['bacula'] || screenConfig['agendamentos'] || '';
        console.log(`📱 [BACULA-DAILY] Instância da screen config (bacula/agendamentos): ${baculaInstanceName || 'não definida'}`);
      } catch (e) {
        console.warn('⚠️ [BACULA-DAILY] Erro ao parsear screen config:', e);
      }
    }

    // Buscar integração Bacula (prioriza integração do usuário do relatório)
    let baculaIntegration: any = null;

    if (reportUserId) {
      const { data: userBaculaIntegration } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'bacula')
        .eq('is_active', true)
        .eq('user_id', reportUserId)
        .maybeSingle();

      baculaIntegration = userBaculaIntegration;
    }

    if (!baculaIntegration) {
      const { data: fallbackBaculaIntegrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'bacula')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      baculaIntegration = fallbackBaculaIntegrations?.[0] || null;
    }

    if (!baculaIntegration) {
      throw new Error('Integração Bacula não encontrada');
    }

    console.log('🔌 [BACULA-DAILY] Integrações encontradas - Evolution API e Bacula');

    // Definir período de análise baseado no modo
    const brasiliaTime = new Date();
    let brasiliaStartTime: Date;
    let brasiliaEndTime: Date;
    let periodDescription: string;
    
    if (test_mode) {
      // MODO TESTE: Analisar últimas 24 horas (dados recentes)
      brasiliaEndTime = new Date(brasiliaTime);
      brasiliaStartTime = new Date(brasiliaTime);
      brasiliaStartTime.setHours(brasiliaStartTime.getHours() - 24);
      periodDescription = 'últimas 24 horas';
      console.log(`🕐 [BACULA-DAILY] MODO TESTE - Analisando ${periodDescription}`);
    } else {
      // MODO AUTOMÁTICO: Analisar dia anterior completo (00:00 - 23:59)
      const brasiliaYesterday = new Date(brasiliaTime);
      brasiliaYesterday.setDate(brasiliaYesterday.getDate() - 1);
      
      brasiliaStartTime = new Date(brasiliaYesterday);
      brasiliaStartTime.setHours(0, 0, 0, 0);
      
      brasiliaEndTime = new Date(brasiliaYesterday);
      brasiliaEndTime.setHours(23, 59, 59, 999);
      
      periodDescription = brasiliaYesterday.toLocaleDateString('pt-BR');
      console.log(`🕐 [BACULA-DAILY] MODO AUTOMÁTICO - Analisando dia anterior completo: ${periodDescription}`);
    }
    
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

          const endpointCandidatesMap: Record<string, string[]> = {
            'jobs/last24h': [
              '/api/v2/jobs?age=86400&limit=1000&order_by=starttime&order_direction=desc',
              '/api/v1/jobs?age=86400&limit=1000',
              '/api/v2/jobs?limit=1000&order_by=starttime&order_direction=desc',
              '/api/v1/jobs?limit=1000',
              '/api/jobs?limit=1000'
            ],
            'jobs': [
              '/api/v2/jobs?limit=1000&order_by=starttime&order_direction=desc',
              '/api/v1/jobs?limit=1000',
              '/api/jobs?limit=1000'
            ],
            'jobs/all': [
              '/api/v2/jobs?limit=1000&order_by=starttime&order_direction=desc',
              '/api/v1/jobs?limit=1000',
              '/api/jobs?limit=1000'
            ]
          };

          const endpointCandidates = endpointCandidatesMap[strategy.endpoint] || [];
          const baseUrl = (baculaIntegration.base_url || '').replace(/\/$/, '');
          const auth = btoa(`${baculaIntegration.username || ''}:${baculaIntegration.password || ''}`);

          let strategyData: any = null;
          let strategyError: any = null;

          for (const endpointPath of endpointCandidates) {
            const endpointUrl = `${baseUrl}${endpointPath}`;

            try {
              const response = await retryWithBackoff(async () => {
                return await fetch(endpointUrl, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                });
              }, RETRY_CONFIG.maxRetries);

              const responseText = await response.text();

              if (!response.ok) {
                strategyError = new Error(`HTTP ${response.status} no endpoint ${endpointPath}`);
                console.warn(`⚠️ [BACULA-DAILY] Endpoint falhou ${endpointPath}: ${response.status}`);
                continue;
              }

              strategyData = responseText ? JSON.parse(responseText) : {};
              console.log(`✅ [BACULA-DAILY] Endpoint OK: ${endpointPath}`);
              break;
            } catch (endpointError: any) {
              strategyError = endpointError;
              console.warn(`⚠️ [BACULA-DAILY] Erro no endpoint ${endpointPath}:`, endpointError?.message || endpointError);
            }
          }

          if (!strategyData) {
            throw strategyError || new Error(`Nenhum endpoint respondeu para ${strategy.description}`);
          }

          baculaData = strategyData;
          successfulStrategy = strategy.description;
          setCache(cacheKey, baculaData);
          console.log(`✅ [BACULA-DAILY] Dados obtidos via ${successfulStrategy}`);
          break;
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
                integrationId: evolutionIntegration.id,
                instanceName: baculaInstanceName || undefined,
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

    // Filtrar jobs do período definido
    const getJobDate = (job: any): number => {
      const candidateDates = [
        job.starttime,
        job.schedtime,
        job.endtime,
        job.realendtime,
        job.created_at,
        job.timestamp
      ].filter(Boolean);

      for (const dateValue of candidateDates) {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.getTime();
        }
      }

      return 0;
    };

    const filteredJobs = jobs
      .filter((job: any) => {
        const possibleDates = [
          job.starttime,
          job.schedtime,
          job.endtime,
          job.realendtime,
          job.created_at,
          job.timestamp
        ].filter(Boolean);

        if (possibleDates.length === 0) return false;

        return possibleDates.some((dateStr: string) => {
          const jobTime = new Date(dateStr);
          return !isNaN(jobTime.getTime()) && jobTime >= brasiliaStartTime && jobTime <= brasiliaEndTime;
        });
      })
      .sort((a: any, b: any) => getJobDate(b) - getJobDate(a));

    console.log(`🎯 [BACULA-DAILY] Jobs filtrados do período (${periodDescription}): ${filteredJobs.length} de ${jobs.length} total`);

    if (filteredJobs.length === 0) {
      console.log('⚠️ [BACULA-DAILY] Nenhum job encontrado no período');
      const errorMessage = `⚠️ *ALERTA BACULA - SEM JOBS*\n\n` +
        `📅 *Período analisado:* ${periodDescription}\n` +
        `❌ Nenhum job encontrado no período\n\n` +
        `🔍 Ação necessária: Verificar configuração dos jobs`;

      for (const recipient of recipients) {
        try {
          await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              integrationId: evolutionIntegration.id,
              instanceName: baculaInstanceName || undefined,
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
        message: `Nenhum job encontrado no período (${periodDescription})`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const statusMap: Record<string, string> = {
      T: 'Concluído com Sucesso',
      E: 'Erro (com diferenças)',
      f: 'Erro Fatal',
      A: 'Cancelado pelo usuário',
      R: 'Executando',
      C: 'Criado (aguardando)',
      c: 'Aguardando recurso',
      B: 'Bloqueado',
      D: 'Verificação com diferenças',
      I: 'Incompleto',
      F: 'Aguardando no File Daemon',
      S: 'Aguardando no Storage Daemon',
      M: 'Aguardando nova mídia',
      Q: 'Na fila (aguardando dispositivo)',
      W: 'Aguardando',
      success: 'Concluído com Sucesso',
      ok: 'Concluído com Sucesso',
      error: 'Erro',
      fatal: 'Erro Fatal',
      running: 'Executando',
      cancelled: 'Cancelado'
    };

    const jobsByStatus: Record<string, any[]> = {
      success: [],
      errors: [],
      cancelled: [],
      running: [],
      blocked: [],
      other: []
    };

    const getNumericValue = (job: any, fieldNames: string[]): number => {
      for (const fieldName of fieldNames) {
        const rawValue = job[fieldName];
        if (rawValue === null || rawValue === undefined || rawValue === '') continue;
        const parsed = Number(rawValue);
        if (!Number.isNaN(parsed)) return parsed;
      }
      return 0;
    };

    const getRawStatus = (job: any): string => {
      return String(job.jobstatus ?? job.status ?? job.job_status ?? 'U').trim();
    };

    let totalBytes = 0;
    let totalFiles = 0;

    filteredJobs.forEach((job: any) => {
      const jobStatus = getRawStatus(job);
      const statusLower = jobStatus.toLowerCase();

      totalBytes += getNumericValue(job, ['jobbytes', 'job_bytes', 'bytes', 'byte_count']);
      totalFiles += getNumericValue(job, ['jobfiles', 'job_files', 'files', 'file_count']);

      if (jobStatus === 'T' || statusLower === 'success' || statusLower === 'ok' || statusLower === 'terminated') {
        jobsByStatus.success.push(job);
      } else if (jobStatus === 'f' || jobStatus === 'E' || statusLower.includes('error') || statusLower.includes('fatal')) {
        jobsByStatus.errors.push(job);
      } else if (jobStatus === 'A' || statusLower.includes('cancel')) {
        jobsByStatus.cancelled.push(job);
      } else if (jobStatus === 'R' || jobStatus === 'C' || jobStatus === 'c' || statusLower.includes('run') || statusLower.includes('wait')) {
        jobsByStatus.running.push(job);
      } else if (['B', 'Q', 'W', 'F', 'S', 'M'].includes(jobStatus) || statusLower.includes('block') || statusLower.includes('queue')) {
        jobsByStatus.blocked.push(job);
      } else {
        jobsByStatus.other.push(job);
      }
    });

    const cleanJobName = (jobName: string | undefined) => {
      if (!jobName) return 'Job desconhecido';
      return jobName.replace(/\.\d{4}-\d{2}-\d{2}_\d{2}\.\d{2}\.\d{2}_\d+$/, '');
    };

    const getStatusEmoji = (status: string) => {
      const normalizedStatus = (status || 'U').trim();
      const statusLower = normalizedStatus.toLowerCase();

      if (normalizedStatus === 'T' || statusLower === 'ok' || statusLower === 'success') return '✅';
      if (normalizedStatus === 'f' || normalizedStatus === 'E' || statusLower.includes('error') || statusLower.includes('fatal')) return '❌';
      if (normalizedStatus === 'A' || statusLower.includes('cancel')) return '🚫';
      if (normalizedStatus === 'R' || normalizedStatus === 'C' || normalizedStatus === 'c' || statusLower.includes('run')) return '🔄';
      if (['B', 'Q', 'W', 'F', 'S', 'M'].includes(normalizedStatus)) return '⏸️';
      return '❓';
    };

    const formatJobDetails = (job: any) => {
      const rawStatus = getRawStatus(job);
      const statusDescription = statusMap[rawStatus] || statusMap[rawStatus.toLowerCase()] || `Status ${rawStatus}`;
      const startDate = job.starttime || job.schedtime;
      const endDate = job.endtime || job.realendtime;
      const bytesValue = getNumericValue(job, ['jobbytes', 'job_bytes', 'bytes', 'byte_count']);
      const filesValue = getNumericValue(job, ['jobfiles', 'job_files', 'files', 'file_count']);

      let duration = 'N/A';
      if (startDate && endDate) {
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
          duration = `${Math.round((endMs - startMs) / 60000)} min`;
        }
      }

      return {
        name: cleanJobName(job.job || job.jobname || job.name),
        client: job.client || job.clientname || 'Cliente desconhecido',
        level: job.level || 'N/A',
        starttime: startDate ? getBrasiliaTime(new Date(startDate)) : 'N/A',
        endtime: endDate ? getBrasiliaTime(new Date(endDate)) : 'N/A',
        duration,
        jobbytes: formatBytes(bytesValue),
        jobfiles: filesValue.toLocaleString('pt-BR'),
        jobstatus: rawStatus,
        jobstatus_desc: statusDescription,
        jobstatus_emoji: getStatusEmoji(rawStatus)
      };
    };

    const totalJobs = filteredJobs.length;
    const successJobs = jobsByStatus.success.length;
    const errorJobs = jobsByStatus.errors.length;
    const cancelledJobs = jobsByStatus.cancelled.length;
    const runningJobs = jobsByStatus.running.length;
    const blockedJobs = jobsByStatus.blocked.length;
    const otherJobs = jobsByStatus.other.length;
    const criticalJobs = errorJobs + cancelledJobs;

    const averageDurationInMinutes = filteredJobs
      .map((job: any) => {
        const startDate = job.starttime || job.schedtime;
        const endDate = job.endtime || job.realendtime;
        if (!startDate || !endDate) return 0;
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 0;
        return Math.round((endMs - startMs) / 60000);
      })
      .filter((minutes: number) => minutes > 0);

    const avgDuration = averageDurationInMinutes.length > 0
      ? `${Math.round(averageDurationInMinutes.reduce((acc: number, value: number) => acc + value, 0) / averageDurationInMinutes.length)} min`
      : 'N/A';

    const uniqueClients = new Set(
      filteredJobs
        .map((job: any) => job.client || job.clientname)
        .filter(Boolean)
    );

    const affectedClients = new Set(
      [...jobsByStatus.errors, ...jobsByStatus.cancelled, ...jobsByStatus.blocked]
        .map((job: any) => job.client || job.clientname)
        .filter(Boolean)
    );

    console.log(`📈 [BACULA-DAILY] Estatísticas completas:`);
    console.log(`   Total: ${totalJobs} jobs do período ${periodDescription}`);
    console.log(`   Sucessos: ${successJobs}`);
    console.log(`   Erros: ${errorJobs}`);
    console.log(`   Cancelados: ${cancelledJobs}`);
    console.log(`   Executando: ${runningJobs}`);
    console.log(`   Bloqueados: ${blockedJobs}`);
    console.log(`   Outros: ${otherJobs}`);

    const templateData = {
      analysis_date: periodDescription,
      report_time: getBrasiliaTime(),
      total_jobs: totalJobs,
      success_jobs: successJobs,
      error_jobs: errorJobs,
      cancelled_jobs: cancelledJobs,
      running_jobs: runningJobs,
      blocked_jobs: blockedJobs,
      other_jobs: otherJobs,
      critical_jobs: criticalJobs,
      success_rate: totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 0,
      total_bytes: formatBytes(totalBytes),
      total_files: totalFiles.toLocaleString('pt-BR'),
      avg_duration: avgDuration,
      date: periodDescription,
      period: `${getBrasiliaTime(brasiliaStartTime)} até ${getBrasiliaTime(brasiliaEndTime)}`,
      current_time: getBrasiliaTime(),
      start_date: getBrasiliaTime(brasiliaStartTime),
      end_date: getBrasiliaTime(brasiliaEndTime),
      has_issues: criticalJobs + blockedJobs > 0,
      total_issues: criticalJobs + blockedJobs,
      affected_clients: affectedClients.size,
      total_clients: uniqueClients.size,
      success_details: jobsByStatus.success.map(formatJobDetails),
      error_details: jobsByStatus.errors.map(formatJobDetails),
      cancelled_details: jobsByStatus.cancelled.map(formatJobDetails),
      running_details: jobsByStatus.running.map(formatJobDetails),
      blocked_details: jobsByStatus.blocked.map(formatJobDetails),
      other_details: jobsByStatus.other.map(formatJobDetails),
      fatal_jobs: errorJobs,
      fatal_details: jobsByStatus.errors.map(formatJobDetails)
    };

    const formatJobsList = (jobsList: any[], maxItems = 8) => {
      if (!jobsList || jobsList.length === 0) return '• Nenhum job encontrado';

      const displayed = jobsList.slice(0, maxItems);
      const lines = displayed.map((job, index) => {
        return `${index + 1}) ${job.jobstatus_emoji} ${job.name}\n` +
          `   • Cliente: ${job.client}\n` +
          `   • Início: ${job.starttime}\n` +
          `   • Fim: ${job.endtime}\n` +
          `   • Status: ${job.jobstatus_desc}\n` +
          `   • Dados: ${job.jobbytes} | Arquivos: ${job.jobfiles}`;
      });

      if (jobsList.length > maxItems) {
        lines.push(`… +${jobsList.length - maxItems} job(s) adicionais`);
      }

      return lines.join('\n\n');
    };

    const successJobsDetails = formatJobsList(templateData.success_details);
    const errorJobsDetails = formatJobsList(templateData.error_details);
    const cancelledJobsDetails = formatJobsList(templateData.cancelled_details);
    const runningJobsDetails = formatJobsList(templateData.running_details);
    const blockedJobsDetails = formatJobsList(templateData.blocked_details);
    const otherJobsDetails = formatJobsList(templateData.other_details);

    console.log('📋 [BACULA-DAILY] Dados estruturados para envio:', {
      analysis_date: templateData.analysis_date,
      total_jobs: templateData.total_jobs,
      success_jobs: templateData.success_jobs,
      error_jobs: templateData.error_jobs,
      cancelled_jobs: templateData.cancelled_jobs,
      critical_jobs: templateData.critical_jobs,
      success_rate: templateData.success_rate
    });

    const sections: string[] = [];

    if (errorJobs > 0) {
      sections.push(`🔴 *JOBS COM ERRO (${errorJobs})*\n${errorJobsDetails}`);
    }

    if (cancelledJobs > 0) {
      sections.push(`⚠️ *JOBS CANCELADOS (${cancelledJobs})*\n${cancelledJobsDetails}`);
    }

    if (runningJobs > 0) {
      sections.push(`🔄 *JOBS EM EXECUÇÃO (${runningJobs})*\n${runningJobsDetails}`);
    }

    if (blockedJobs > 0) {
      sections.push(`⏸️ *JOBS BLOQUEADOS (${blockedJobs})*\n${blockedJobsDetails}`);
    }

    if (otherJobs > 0) {
      sections.push(`📋 *OUTROS STATUS (${otherJobs})*\n${otherJobsDetails}`);
    }

    if (successJobs > 0) {
      sections.push(`✅ *JOBS COM SUCESSO (${successJobs})*\n${successJobsDetails}`);
    }

    let finalMessage = [
      `📊 *RELATÓRIO DIÁRIO DE ERROS - BACULA*`,
      `📅 *Período:* ${templateData.period}`,
      `🕒 *Gerado em:* ${templateData.current_time}`,
      ``,
      `📌 *RESUMO EXECUTIVO*`,
      `• Total de Jobs: ${templateData.total_jobs}`,
      `• Jobs com Sucesso: ${templateData.success_jobs}`,
      `• Jobs com Erro: ${templateData.error_jobs}`,
      `• Jobs Cancelados: ${templateData.cancelled_jobs}`,
      `• Jobs em Execução: ${templateData.running_jobs}`,
      `• Jobs Bloqueados: ${templateData.blocked_jobs}`,
      `• Taxa de Sucesso: ${templateData.success_rate}%`,
      `• Dados Processados: ${templateData.total_bytes}`,
      `• Arquivos Processados: ${templateData.total_files}`,
      `• Duração Média: ${templateData.avg_duration}`,
      `• Clientes afetados: ${templateData.affected_clients}/${templateData.total_clients}`,
      `• Fonte dos dados: API Bacula (dados reais)`,
      ...sections
    ].join('\n\n');

    finalMessage = finalMessage.replace(/\n{3,}/g, '\n\n').trim();

    console.log(`💬 [BACULA-DAILY] Mensagem final gerada (${finalMessage.length} caracteres)`);
    console.log(`📊 [BACULA-DAILY] Resumo: ${totalJobs} jobs do período ${periodDescription}`);
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
            integrationId: evolutionIntegration.id,
            instanceName: baculaInstanceName || undefined,
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
    const reportLogId = report_id || null;
    if (reportLogId) {
      try {
        await supabase.from('scheduled_reports_logs').insert({
          report_id: reportLogId,
          user_id: reportUserId || template.user_id,
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
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Relatório enviado com sucesso',
      details: {
        recipients_total: recipients.length,
        recipients_success: successfulSends,
        execution_time_ms: executionTime,
        analysis_date: periodDescription,
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