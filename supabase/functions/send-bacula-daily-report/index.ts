import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache temporário para evitar múltiplas consultas
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Configurações de retry
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  backoffMultiplier: 2
};

// Categorização de erros Bacula
const ERROR_LEVELS = {
  CRITICAL: { codes: ['F', 'f'], label: 'Falha Fatal', priority: 1 },
  ERROR: { codes: ['E', 'e'], label: 'Erro', priority: 2 },
  WARNING: { codes: ['W', 'w'], label: 'Aviso', priority: 3 },
  CANCELED: { codes: ['A', 'a'], label: 'Cancelado', priority: 4 },
  GENERAL: { codes: ['error', 'ERROR', 'failed', 'FAILED'], label: 'Falha', priority: 2 }
};

// Função utilitária para retry com backoff exponencial
async function retryWithBackoff(fn, retries = RETRY_CONFIG.maxRetries) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`⏳ Tentativa falhou, tentando novamente em ${RETRY_CONFIG.retryDelay}ms (${retries} tentativas restantes)`);
    await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryDelay));
    
    return retryWithBackoff(fn, retries - 1);
  }
}

// Função para cache com TTL
function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Função para calcular timezone de Brasília
function getBrasiliaTime() {
  return new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
}

// Função para determinar nível de erro
function getErrorLevel(status) {
  for (const [level, config] of Object.entries(ERROR_LEVELS)) {
    if (config.codes.includes(status)) {
      return { level, ...config };
    }
  }
  return { level: 'UNKNOWN', label: 'Desconhecido', priority: 5 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { test, phone_number, report_id } = await req.json().catch(() => ({}));

    console.log('🔄 Iniciando processamento do relatório diário do Bacula');

    // Buscar template do WhatsApp para relatórios Bacula
    let template = null;
    let templateError = null;

    // Primeiro tentar buscar por ID (se report_id for fornecido)
    if (report_id) {
      const { data: reportConfig } = await supabase
        .from('scheduled_reports')
        .select('report_type')
        .eq('id', report_id)
        .single();

      if (reportConfig?.report_type) {
        // Verificar se é UUID (novo formato) ou string (formato antigo)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportConfig.report_type);
        
        if (isUUID) {
          // Buscar por ID
          const result = await supabase
            .from('whatsapp_message_templates')
            .select('*')
            .eq('id', reportConfig.report_type)
            .eq('is_active', true)
            .single();
          template = result.data;
          templateError = result.error;
        }
      }
    }

    // Fallback: buscar por nome se não encontrou por ID
    if (!template) {
      const result = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('name', 'Relatório Diário de Erros Bacula')
        .eq('is_active', true)
        .single();
      template = result.data;
      templateError = result.error;
    }

    if (templateError) {
      console.error('❌ Erro ao buscar template:', templateError);
      throw new Error('Template de WhatsApp não encontrado');
    }

    // Se for teste, usar número específico
    let targetPhones = [];
    if (test && phone_number) {
      targetPhones = [phone_number];
    } else if (report_id) {
      // Buscar configuração específica do relatório
      const { data: reportConfig, error: reportError } = await supabase
        .from('scheduled_reports')
        .select('phone_number, user_id')
        .eq('id', report_id)
        .eq('is_active', true)
        .single();

      if (reportError || !reportConfig) {
        throw new Error('Configuração do relatório não encontrada');
      }

      targetPhones = [reportConfig.phone_number];
    } else {
      // Buscar usuários ativos para envio automático
      const { data: users, error: usersError } = await supabase
        .from('scheduled_reports')
        .select('phone_number, user_id')
        .eq('report_type', template.id)
        .eq('is_active', true);

      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError);
        throw new Error('Erro ao buscar usuários');
      }

      targetPhones = users?.map(u => u.phone_number) || [];
    }

    if (targetPhones.length === 0) {
      console.log('⚠️ Nenhum destinatário encontrado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhum destinatário configurado' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar integração ativa do Evolution API
    const { data: evolutionIntegration, error: evolutionError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .single();

    if (evolutionError || !evolutionIntegration) {
      console.error('❌ Integração Evolution API não encontrada:', evolutionError);
      throw new Error('Integração Evolution API não configurada');
    }

    // Buscar integração ativa do Bacula
    const { data: baculaIntegration, error: baculaError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('is_active', true)
      .single();

    if (baculaError || !baculaIntegration) {
      console.error('❌ Integração Bacula não encontrada:', baculaError);
      throw new Error('Integração Bacula não configurada');
    }

    // Cálculo inteligente de tempo baseado no timezone de Brasília
    const brasiliaTime = new Date(getBrasiliaTime());
    const twentyFourHoursAgo = new Date(brasiliaTime.getTime() - (24 * 60 * 60 * 1000));
    
    console.log(`📅 Buscando jobs das últimas 24h (desde ${twentyFourHoursAgo.toLocaleString('pt-BR')})`);

    // Verificar cache primeiro
    const cacheKey = `bacula_jobs_${twentyFourHoursAgo.getTime()}`;
    let allJobs = getCached(cacheKey);

    if (!allJobs) {
      console.log('🔄 Cache miss - buscando dados do Bacula...');
      
      try {
        // Primeiro, testar conectividade com a API Bacula
        console.log('🔍 Testando conectividade com API Bacula...');
        const connectionTest = await retryWithBackoff(() => 
          supabase.functions.invoke('bacula-proxy', { 
            body: { endpoint: 'test' } 
          })
        );

        if (connectionTest.error) {
          console.error('❌ Falha no teste de conectividade Bacula:', connectionTest.error);
          throw new Error(`Falha na conexão com Bacula: ${connectionTest.error.message}`);
        }

        console.log('✅ Conectividade Bacula OK:', connectionTest.data);

        // Fazer consulta específica para jobs das últimas 24h
        console.log('📊 Buscando jobs das últimas 24h...');
        const jobsResponse = await retryWithBackoff(() => 
          supabase.functions.invoke('bacula-proxy', { 
            body: { 
              endpoint: 'jobs/last24h',
              params: { age: 86400 } // 24 horas em segundos
            } 
          })
        );

        if (jobsResponse.error) {
          console.error('❌ Erro ao buscar jobs últimas 24h:', jobsResponse.error);
          throw new Error(`Erro ao buscar jobs: ${jobsResponse.error.message}`);
        }

        console.log('📦 Resposta bruta da API Bacula:', JSON.stringify(jobsResponse.data, null, 2));

        let jobs = [];
        const data = jobsResponse.data;

        // Processar dados do Bacula com parsing robusto
        if (data?.output && Array.isArray(data.output)) {
          jobs = data.output;
          console.log('✅ Dados extraídos de data.output');
        } else if (data?.result && Array.isArray(data.result)) {
          jobs = data.result;
          console.log('✅ Dados extraídos de data.result');
        } else if (data?.data && Array.isArray(data.data)) {
          jobs = data.data;
          console.log('✅ Dados extraídos de data.data');
        } else if (Array.isArray(data)) {
          jobs = data;
          console.log('✅ Dados extraídos diretamente (array)');
        } else if (typeof data === 'object' && data !== null) {
          // Buscar arrays dentro do objeto
          for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
              const firstItem = data[key][0];
              if (firstItem && (
                firstItem.jobid || firstItem.JobId || firstItem.id ||
                firstItem.name || firstItem.jobname || firstItem.Job || firstItem.JobName
              )) {
                jobs = data[key];
                console.log(`✅ Dados extraídos de data.${key}`);
                break;
              }
            }
          }
        }

        if (jobs.length === 0) {
          console.log('⚠️ Nenhum job encontrado nas últimas 24h');
          // Se não há jobs, não é erro - pode ser que realmente não houve jobs
          allJobs = [];
        } else {
          console.log(`📊 ${jobs.length} jobs encontrados nas últimas 24h`);
          allJobs = jobs;
        }

        // Armazenar no cache
        setCache(cacheKey, allJobs);
        
      } catch (error) {
        console.error('❌ ERRO CRÍTICO ao conectar com Bacula:', error);
        
        // Preparar mensagem de erro detalhada para o relatório
        const errorReport = {
          date: brasiliaTime.toISOString().split('T')[0],
          timestamp: new Date().toLocaleString('pt-BR'),
          errorType: 'CONECTIVIDADE',
          errorMessage: error.message,
          baculaUrl: baculaIntegration.base_url,
          suggestions: [
            'Verificar se o serviço Bacula/BaculaWeb está ativo',
            'Verificar conectividade de rede',
            'Verificar credenciais de autenticação',
            'Verificar se a porta 9097 está acessível'
          ]
        };

        // Enviar notificação de erro ao invés de relatório normal
        const errorMessage = `🚨 *ERRO DE CONECTIVIDADE BACULA*

📅 *Data:* ${errorReport.date}
⏰ *Horário:* ${errorReport.timestamp}
🔗 *URL:* ${errorReport.baculaUrl}

❌ *Erro:* ${errorReport.errorMessage}

🔧 *Ações Recomendadas:*
${errorReport.suggestions.map(s => `• ${s}`).join('\n')}

⚠️ O relatório diário de backups não pôde ser gerado devido à falha de conectividade com o sistema Bacula.`;

        console.log('📧 Enviando notificação de erro...');

        // Enviar mensagem de erro para os destinatários
        const promises = targetPhones.map(async (phoneNumber) => {
          try {
            const response = await fetch(`${evolutionIntegration.base_url}/message/sendText/${evolutionIntegration.instance_name}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionIntegration.api_token
              },
              body: JSON.stringify({
                number: phoneNumber,
                text: errorMessage
              })
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
          } catch (sendError) {
            console.error(`❌ Erro ao enviar para ${phoneNumber}:`, sendError);
            throw sendError;
          }
        });

        const results = await Promise.allSettled(promises);
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Bacula connectivity failed',
          details: errorReport,
          notifications_sent: results.filter(r => r.status === 'fulfilled').length,
          total_recipients: targetPhones.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    } else {
      console.log('✅ Cache hit - usando dados cached');
    }

    // Análise temporal aprimorada com timezone de Brasília - CORRIGIDO PARA DIA ANTERIOR
    const brasiliaYesterday = new Date(brasiliaTime);
    brasiliaYesterday.setDate(brasiliaYesterday.getDate() - 1);
    brasiliaYesterday.setHours(0, 0, 0, 0);
    
    const brasiliaYesterdayEnd = new Date(brasiliaYesterday);
    brasiliaYesterdayEnd.setHours(23, 59, 59, 999);

    console.log(`📅 Analisando jobs especificamente do dia ${brasiliaYesterday.toLocaleDateString('pt-BR')} (${brasiliaYesterday.toISOString()} até ${brasiliaYesterdayEnd.toISOString()})`);

    const failedJobs = allJobs.filter(job => {
        // Melhor extração de data - foco no dia anterior
        let jobDate = null;
        if (job.starttime) jobDate = new Date(job.starttime);
        else if (job.schedtime) jobDate = new Date(job.schedtime);
        else if (job.endtime) jobDate = new Date(job.endtime);
        else if (job.realendtime) jobDate = new Date(job.realendtime);
        
        if (!jobDate || isNaN(jobDate.getTime())) {
          console.log(`⚠️ Job sem data válida:`, job);
          return false;
        }
        
        // CORREÇÃO: Verificar se o job é do dia anterior específico
        const isFromYesterday = jobDate >= brasiliaYesterday && jobDate <= brasiliaYesterdayEnd;
        
        // Status de erro mais abrangente
        const status = job.jobstatus || job.JobStatus || job.status;
        const hasError = ['E', 'f', 'A', 'e', 'F', 'error', 'Error', 'ERROR', 'failed', 'Failed', 'FAILED'].includes(status);
        
        if (isFromYesterday && hasError) {
          console.log(`🔍 Job com erro do dia anterior encontrado: ${job.name || job.jobname} - Status: ${status} - Data: ${jobDate.toISOString()}`);
        }
        
        return isFromYesterday && hasError;
      });

    const successJobs = allJobs.filter(job => {
      let jobDate = null;
      if (job.starttime) jobDate = new Date(job.starttime);
      else if (job.schedtime) jobDate = new Date(job.schedtime);
      else if (job.endtime) jobDate = new Date(job.endtime);
      else if (job.realendtime) jobDate = new Date(job.realendtime);
      
      if (!jobDate || isNaN(jobDate.getTime())) return false;
      
      // CORREÇÃO: Verificar se o job é do dia anterior específico
      const isFromYesterday = jobDate >= brasiliaYesterday && jobDate <= brasiliaYesterdayEnd;
      const status = job.jobstatus || job.JobStatus || job.status;
      const isSuccess = ['T', 't', 'OK', 'ok', 'Ok', 'success', 'Success', 'SUCCESS', 'completed', 'Completed', 'COMPLETED'].includes(status);
      
      return isFromYesterday && isSuccess;
    });

    const totalRecentJobs = failedJobs.length + successJobs.length;

    // Análise avançada de padrões e performance
    const failedJobsAnalysis = {
      byClient: {},
      byType: {},
      byLevel: {},
      avgDuration: 0,
      totalBytes: 0,
      recurrentFailures: [],
    };

    // Agrupar erros por cliente, tipo e nível
    failedJobs.forEach(job => {
      const client = job.client || job.clientname || job.Client || 'N/A';
      const type = job.type || job.Type || job.name || job.jobname || 'N/A';
      const status = job.jobstatus || job.JobStatus || job.status;
      const errorLevel = getErrorLevel(status);
      
      // Por cliente
      failedJobsAnalysis.byClient[client] = (failedJobsAnalysis.byClient[client] || 0) + 1;
      
      // Por tipo
      failedJobsAnalysis.byType[type] = (failedJobsAnalysis.byType[type] || 0) + 1;
      
      // Por nível de erro
      failedJobsAnalysis.byLevel[errorLevel.level] = (failedJobsAnalysis.byLevel[errorLevel.level] || 0) + 1;
      
      // Acumular bytes e duração
      if (job.jobbytes) failedJobsAnalysis.totalBytes += parseInt(job.jobbytes) || 0;
    });

    // Detectar falhas recorrentes (jobs que falharam mais de uma vez)
    Object.entries(failedJobsAnalysis.byType).forEach(([jobType, count]) => {
      if (count > 1) {
        failedJobsAnalysis.recurrentFailures.push({
          type: jobType,
          count: count,
          severity: count >= 3 ? 'ALTA' : 'MÉDIA'
        });
      }
    });

    // Ordenar erros por prioridade (críticos primeiro)
    const sortedFailedJobs = failedJobs.sort((a, b) => {
      const statusA = a.jobstatus || a.JobStatus || a.status;
      const statusB = b.jobstatus || b.JobStatus || b.status;
      const levelA = getErrorLevel(statusA);
      const levelB = getErrorLevel(statusB);
      return levelA.priority - levelB.priority;
    });

    console.log(`📊 Análise: ${failedJobs.length} erros, ${Object.keys(failedJobsAnalysis.byClient).length} clientes afetados`);
    console.log(`🔄 Falhas recorrentes: ${failedJobsAnalysis.recurrentFailures.length}`);

    // Preparar dados detalhados para o template com análise inteligente - CORRIGIDO PARA DIA ANTERIOR
    const reportData = {
      date: brasiliaYesterday.toISOString().split('T')[0], // Data do dia anterior
      reportDate: brasiliaTime.toISOString().split('T')[0], // Data do relatório (hoje)
      totalJobs: totalRecentJobs,
      errorCount: failedJobs.length,
      successCount: successJobs.length,
      errorRate: totalRecentJobs > 0 ? Math.round((failedJobs.length / totalRecentJobs) * 100) : 0,
      hasErrors: failedJobs.length > 0,
      hasCriticalErrors: failedJobsAnalysis.byLevel['CRITICAL'] > 0,
      clientsAffected: Object.keys(failedJobsAnalysis.byClient).length,
      recurrentFailuresCount: failedJobsAnalysis.recurrentFailures.length,
      totalBytesProcessed: Math.round(failedJobsAnalysis.totalBytes / (1024 * 1024 * 1024)), // GB
      analysis: failedJobsAnalysis,
      alertLevel: failedJobs.length === 0 ? 'SUCCESS' : 
                  failedJobs.length < 3 ? 'LOW' : 
                  failedJobs.length < 10 ? 'MEDIUM' : 'HIGH',
      errorJobs: sortedFailedJobs.slice(0, 15).map(job => { // Limitar a 15 erros mais críticos
          // Extrair informações mais robustas
          const getFieldValue = (obj, fields, defaultValue = 'N/A') => {
            for (const field of fields) {
              if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
                return String(obj[field]);
              }
            }
            return defaultValue;
          };

          const status = job.jobstatus || job.JobStatus || job.status;
          let level = 'Erro';
          if (status === 'E' || status === 'e') level = 'Erro';
          else if (status === 'f' || status === 'F') level = 'Falha Fatal';
          else if (status === 'A') level = 'Cancelado';
          else if (status === 'error' || status === 'ERROR') level = 'Erro';
          else if (status === 'failed' || status === 'FAILED') level = 'Falha';

          return {
            name: getFieldValue(job, ['name', 'jobname', 'Job', 'JobName']),
            client: getFieldValue(job, ['client', 'clientname', 'Client', 'ClientName']),
            level: level,
            startTime: job.starttime ? new Date(job.starttime).toLocaleString('pt-BR') : 
                      job.schedtime ? new Date(job.schedtime).toLocaleString('pt-BR') : 'N/A',
            bytes: job.jobbytes ? `${(parseInt(job.jobbytes) / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
            files: getFieldValue(job, ['jobfiles', 'JobFiles', 'files'], '0'),
            duration: job.jobend && job.jobstart ? 
              Math.round((new Date(job.jobend) - new Date(job.jobstart)) / 60000) + ' min' : 'N/A',
            errorMsg: getFieldValue(job, ['joberrors', 'JobErrors', 'error_message', 'message'], '').substring(0, 200)
          };
        }),
        timestamp: new Date().toLocaleString('pt-BR'),
        // Dados para logging e métricas
        reportMetrics: {
          executionTime: Date.now(),
          dataSourcesUsed: ['bacula-proxy'],
          cacheHit: getCached(cacheKey) !== null,
          errorsByLevel: failedJobsAnalysis.byLevel,
          topFailedClients: Object.entries(failedJobsAnalysis.byClient)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
        }
      };

      // Processar template com dados
      let message = template.body;
      
      // Substituir variáveis simples
      message = message.replace(/\{\{date\}\}/g, reportData.date);
      message = message.replace(/\{\{totalJobs\}\}/g, reportData.totalJobs.toString());
      message = message.replace(/\{\{successCount\}\}/g, reportData.successCount.toString());
      message = message.replace(/\{\{errorCount\}\}/g, reportData.errorCount.toString());
      message = message.replace(/\{\{errorRate\}\}/g, reportData.errorRate.toString());
      message = message.replace(/\{\{clientsAffected\}\}/g, reportData.clientsAffected.toString());
      message = message.replace(/\{\{recurrentFailuresCount\}\}/g, reportData.recurrentFailuresCount.toString());
      message = message.replace(/\{\{timestamp\}\}/g, reportData.timestamp);

      // Processar condicionais avançados
      message = message.replace(/\{\{#if hasCriticalErrors\}\}([\s\S]*?)\{\{\/if\}\}/g, 
        reportData.hasCriticalErrors ? '$1' : '');
      message = message.replace(/\{\{#if recurrentFailuresCount\}\}([\s\S]*?)\{\{\/if\}\}/g, 
        reportData.recurrentFailuresCount > 0 ? '$1' : '');

      // Processar condicionais e loops
      if (reportData.hasErrors) {
        // Manter seção de erros
        message = message.replace(/\{\{#if hasErrors\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '$1');
        
        // Processar lista de jobs com erro
        const jobsSection = message.match(/\{\{#each errorJobs\}\}([\s\S]*?)\{\{\/each\}\}/);
        if (jobsSection) {
          const jobTemplate = jobsSection[1];
          const jobsText = reportData.errorJobs.map(job => {
            return jobTemplate
              .replace(/\{\{name\}\}/g, job.name)
              .replace(/\{\{client\}\}/g, job.client)
              .replace(/\{\{level\}\}/g, job.level)
              .replace(/\{\{startTime\}\}/g, job.startTime)
              .replace(/\{\{bytes\}\}/g, job.bytes)
              .replace(/\{\{files\}\}/g, job.files);
          }).join('\n');
          
          message = message.replace(/\{\{#each errorJobs\}\}[\s\S]*?\{\{\/each\}\}/, jobsText);
        }
      } else {
        // Mostrar seção de "sem erros"
        message = message.replace(/\{\{#if hasErrors\}\}[\s\S]*?\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      }

      // Enviar mensagem para cada destinatário
      const results = [];
      for (const phoneNumber of targetPhones) {
        console.log(`📱 Enviando para: ${phoneNumber}`);
        
        try {
          const response = await fetch(`${evolutionIntegration.base_url}/message/sendText/${evolutionIntegration.instance_name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionIntegration.api_token || ''
            },
            body: JSON.stringify({
              number: phoneNumber,
              text: message
            })
          });

          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }

          const responseData = await response.json();
          
          results.push({
            phone: phoneNumber,
            success: true,
            response: responseData
          });

          console.log(`✅ Mensagem enviada para ${phoneNumber}`);

          // Registrar métricas no sistema de monitoramento
          try {
            await supabase.functions.invoke('bacula-reports-monitor', {
              body: {
                action: 'log_execution',
                data: {
                  report_id: report_id || 'auto',
                  user_id: baculaIntegration.user_id,
                  execution_time: Date.now() - reportData.reportMetrics.executionTime,
                  total_jobs: reportData.totalJobs,
                  failed_jobs: reportData.errorCount,
                  success_rate: 100 - reportData.errorRate,
                  cache_hit: reportData.reportMetrics.cacheHit,
                  error_patterns: reportData.reportMetrics.errorsByLevel,
                  phone_number: phoneNumber
                }
              }
            });
          } catch (monitorError) {
            console.warn('⚠️ Erro ao registrar métricas:', monitorError);
          }

        } catch (error) {
          console.error(`❌ Erro ao enviar para ${phoneNumber}:`, error);
          results.push({
            phone: phoneNumber,
            success: false,
            error: error.message
          });
        }
      }

      console.log('✅ Processamento concluído');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Relatório processado com sucesso',
          results,
          totalJobs: totalRecentJobs,
          jobsWithError: failedJobs.length,
          recipients: targetPhones.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor', 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});