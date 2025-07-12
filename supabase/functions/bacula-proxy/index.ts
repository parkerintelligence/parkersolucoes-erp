import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const corsOptions = {
  headers: {
    ...corsHeaders,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  },
}

interface BaculaJob {
  jobid: number;
  job: string;
  name: string;
  type: string;
  level: string;
  clientid: number;
  client: string;
  jobstatus: string;
  schedtime: string;
  starttime: string;
  endtime: string;
  realendtime: string;
  jobtdate: number;
  volsessionid: number;
  volsessiontime: number;
  jobfiles: number;
  jobbytes: number;
  readbytes: number;
  joberrors: number;
  jobmissingfiles: number;
  poolid: number;
  poolname: string;
  priorjobid: number;
  purgedfiles: number;
  hasbase: number;
  hascache: number;
  reviewed: number;
  comment: string;
  filetable: string;
  jobstatuslong?: string;
  duration?: string;
  size?: string;
  speed?: string;
  errors_detail?: string;
}

interface BaculaApiResponse {
  jobs?: BaculaJob[];
  result?: BaculaJob[];
  data?: BaculaJob[];
  output?: BaculaJob[];
  [key: string]: any;
}

// Função para transformar dados de jobs configurados em estrutura consistente
function transformConfiguredJobs(data: any): any {
  console.log('🔄 Transformando dados de jobs configurados:', typeof data, Object.keys(data || {}));
  
  if (!data) return { output: [], total: 0 };
  
  let jobs: any[] = [];
  
  // Se os dados vêm como objeto com jobs
  if (data.output && typeof data.output === 'object') {
    if (Array.isArray(data.output)) {
      jobs = data.output;
    } else {
      // Converter objeto para array
      jobs = Object.entries(data.output).map(([key, value]: [string, any]) => ({
        name: value.name || value.Name || key,
        jobname: value.name || value.Name || key,
        type: value.type || value.Type || value.JobType || 'B',
        client: value.client || value.Client || value.ClientName || 'Unknown',
        level: value.level || value.Level || 'Full',
        schedule: value.schedule || value.Schedule || '',
        pool: value.pool || value.Pool || '',
        storage: value.storage || value.Storage || '',
        fileset: value.fileset || value.FileSet || '',
        enabled: value.enabled !== false,
        ...value
      }));
    }
  } else if (data.result && Array.isArray(data.result)) {
    jobs = data.result;
  } else if (Array.isArray(data)) {
    jobs = data;
  } else if (typeof data === 'object') {
    // Se é um objeto, tentar extrair jobs de qualquer propriedade
    for (const key in data) {
      if (Array.isArray(data[key])) {
        jobs = data[key];
        break;
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        // Se é um objeto aninhado, converter para array
        jobs = Object.entries(data[key]).map(([jobKey, jobValue]: [string, any]) => ({
          name: jobValue.name || jobValue.Name || jobKey,
          jobname: jobValue.name || jobValue.Name || jobKey,
          type: jobValue.type || jobValue.Type || jobValue.JobType || 'B',
          client: jobValue.client || jobValue.Client || jobValue.ClientName || 'Unknown',
          level: jobValue.level || jobValue.Level || 'Full',
          schedule: jobValue.schedule || jobValue.Schedule || '',
          pool: jobValue.pool || jobValue.Pool || '',
          storage: jobValue.storage || jobValue.Storage || '',
          fileset: jobValue.fileset || jobValue.FileSet || '',
          enabled: jobValue.enabled !== false,
          ...jobValue
        }));
        break;
      }
    }
  }
  
  // Normalizar cada job
  const normalizedJobs = jobs.map((job: any) => ({
    name: job.name || job.jobname || job.Name || job.Job || 'Unknown',
    jobname: job.name || job.jobname || job.Name || job.Job || 'Unknown',
    type: job.type || job.Type || job.JobType || job.Level || 'B',
    client: job.client || job.Client || job.ClientName || 'Unknown',
    level: job.level || job.Level || 'Full',
    schedule: job.schedule || job.Schedule || '',
    pool: job.pool || job.Pool || '',
    storage: job.storage || job.Storage || '',
    fileset: job.fileset || job.FileSet || '',
    enabled: job.enabled !== false,
    ...job
  }));
  
  console.log('✅ Jobs transformados:', normalizedJobs.length);
  
  return {
    output: normalizedJobs,
    total: normalizedJobs.length
  };
}

// Função para obter descrição detalhada do status do job
function getJobStatusDescription(status: string): string {
  const statusMap: Record<string, string> = {
    'T': 'Terminado com Sucesso',
    'R': 'Em Execução',
    'E': 'Erro Não Fatal',
    'e': 'Erro Fatal',
    'f': 'Falha Fatal',
    'A': 'Cancelado pelo Usuário',
    'W': 'Terminado com Avisos',
    'C': 'Criado (não executado)',
    'B': 'Bloqueado',
    'I': 'Incompleto',
    'F': 'Aguardando por FD',
    'S': 'Aguardando por SD',
    'M': 'Aguardando por nova mídia',
    'j': 'Aguardando por job',
    'c': 'Aguardando por cliente',
    'd': 'Aguardando por máxima capacidade de jobs',
    't': 'Aguardando por tempo de início',
    'p': 'Aguardando por prioridade mais alta',
    'a': 'Aguardando por recurso de armazenamento',
    'i': 'Fazendo incremento de dados',
    'D': 'Fazendo diferencial de dados',
    'l': 'Fazendo listagem de dados'
  };
  return statusMap[status] || `Status Desconhecido (${status})`;
}

// Função para formatar duração
function formatDuration(milliseconds: number): string {
  if (milliseconds <= 0) return 'N/A';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Função para formatar bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função para formatar velocidade
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  return formatBytes(bytesPerSecond) + '/s';
}

// Função para calcular horário de Brasília
function getBrasiliaTime(): Date {
  const now = new Date();
  const brasiliaOffset = -3; // UTC-3
  return new Date(now.getTime() + (brasiliaOffset * 60 * 60 * 1000));
}

// Função para obter últimas 24h em timezone de Brasília
function getLast24HoursRange(): { start: Date, end: Date } {
  const brasiliaTime = getBrasiliaTime();
  const end = new Date(brasiliaTime);
  const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
  
  return { start, end };
}

// Função para filtrar jobs das últimas 24h
function filterLast24Hours(jobs: BaculaJob[]): BaculaJob[] {
  const { start, end } = getLast24HoursRange();
  
  return jobs.filter(job => {
    // Usar múltiplos critérios de data
    const jobDate = job.starttime ? new Date(job.starttime) : 
                   job.schedtime ? new Date(job.schedtime) :
                   job.endtime ? new Date(job.endtime) : null;
    
    if (!jobDate) return false;
    
    return jobDate >= start && jobDate <= end;
  });
}

// Função para enriquecer dados dos jobs
function enrichJobData(jobs: BaculaJob[]): BaculaJob[] {
  return jobs.map(job => {
    const startTime = job.starttime ? new Date(job.starttime) : null;
    const endTime = job.endtime ? new Date(job.endtime) : null;
    const duration = startTime && endTime ? endTime.getTime() - startTime.getTime() : 0;
    
    // Calcular velocidade
    const speed = duration > 0 && job.jobbytes ? 
      (job.jobbytes / (duration / 1000)) : 0;
    
    return {
      ...job,
      jobstatuslong: getJobStatusDescription(job.jobstatus),
      duration: formatDuration(duration),
      size: formatBytes(job.jobbytes || 0),
      speed: formatSpeed(speed),
      errors_detail: job.joberrors > 0 ? `${job.joberrors} erro(s)` : 'Nenhum erro'
    };
  });
}

serve(async (req) => {
  console.log(`🔄 Bacula proxy request: ${req.method} ${req.url}`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, corsOptions)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Nenhum header de autorização fornecido')
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        ...corsOptions,
        status: 401
      })
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('❌ Token inválido:', userError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        ...corsOptions,
        status: 401
      })
    }

    console.log(`✅ Usuário autenticado: ${user.email}`)

    // Get Bacula integration
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    if (integrationError) {
      console.error('❌ Erro na consulta de integração:', integrationError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        ...corsOptions,
        status: 500
      })
    }

    if (!integrations || integrations.length === 0) {
      console.error('❌ Nenhuma integração Bacula ativa encontrada')
      return new Response(JSON.stringify({ error: 'Bacula integration not found' }), {
        ...corsOptions,
        status: 404
      })
    }

    const integration = integrations[0]
    console.log(`✅ Integração Bacula encontrada: ${integration.name}`)

    const { endpoint, params } = await req.json()
    console.log(`📝 Endpoint solicitado: ${endpoint}`)
    console.log(`📝 Parâmetros:`, params)

    // Create base64 auth header
    const auth = btoa(`${integration.username}:${integration.password}`)
    const baseUrl = integration.base_url.replace(/\/$/, '')

    console.log(`🔗 Conectando com Bacula em: ${baseUrl}`)
    console.log(`👤 Usuário: ${integration.username}`)

    // Múltiplas estratégias de endpoint para diferentes versões da API
    const endpointMap: Record<string, string[]> = {
      'test': [
        '/api/v2/config/api/info', 
        '/api/v1/config/api/info', 
        '/web/api/v2/config/api/info',
        '/api/v2/info',
        '/api/v1/info'
      ],
      'jobs': [
        '/api/v2/jobs?limit=1000&order_by=starttime&order_direction=desc', 
        '/api/v1/jobs?limit=1000', 
        '/web/api/v2/jobs?limit=1000',
        '/api/jobs?limit=1000',
        '/jobs?limit=1000'
      ],
      'jobs/recent': [
        '/api/v2/jobs?limit=100&order_by=jobid&order_direction=desc', 
        '/api/v1/jobs?limit=100',
        '/api/v2/jobs?limit=100',
        '/api/jobs?limit=100'
      ],
      'jobs/last24h': [
        '/api/v2/jobs?age=86400&limit=1000&order_by=starttime&order_direction=desc',
        '/api/v1/jobs?age=86400&limit=1000',
        '/api/v2/jobs?limit=1000',
        '/api/jobs?limit=1000'
      ],
      'jobs/configured': [
        '/api/v2/config/dir/job', 
        '/api/v1/config/dir/job',
        '/api/v2/config/job',
        '/api/v1/config/job'
      ],
      'clients': [
        '/api/v2/clients', 
        '/api/v1/clients',
        '/api/clients'
      ],
      'status': [
        '/api/v2/status', 
        '/api/v1/status',
        '/api/status'
      ]
    }

    let apiEndpoints = endpointMap[endpoint] || [endpoint]
    
    // Aplicar filtros específicos para jobs das últimas 24h
    if (endpoint === 'jobs' || endpoint === 'jobs/last24h') {
      const { start, end } = getLast24HoursRange();
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];
      
      // Adicionar endpoints com filtros de data específicos
      apiEndpoints.unshift(
        `/api/v2/jobs?start_date=${startDate}&end_date=${endDate}&limit=1000&order_by=starttime&order_direction=desc`,
        `/api/v1/jobs?start_date=${startDate}&end_date=${endDate}&limit=1000`,
        `/api/v2/jobs?age=86400&limit=1000&order_by=starttime&order_direction=desc`
      );
    }
    
    // Handle custom parameters for specific endpoints
    if (endpoint === 'jobs/period' && params) {
      const queryParams = new URLSearchParams()
      
      // Add age parameter if days is specified
      if (params.days && params.days > 0) {
        const ageInSeconds = params.days * 24 * 60 * 60
        queryParams.append('age', ageInSeconds.toString())
      }
      
      // Add limit and ordering
      queryParams.append('limit', '1000')
      queryParams.append('order_by', 'starttime')
      queryParams.append('order_direction', 'desc')
      
      // Add status filter if specified
      if (params.status && params.status !== 'all') {
        queryParams.append('jobstatus', params.status)
      }
      
      apiEndpoints[0] = `/api/v2/jobs?${queryParams.toString()}`
    }

    // Tentar múltiplos endpoints até encontrar um que funcione
    let lastError = null;
    let successfulEndpoint = '';
    let rawData = null;

    for (const apiEndpoint of apiEndpoints) {
      const fullUrl = `${baseUrl}${apiEndpoint}`
      console.log(`🔄 Tentando endpoint: ${fullUrl}`)

      try {
        // Make request to BaculaWeb API with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Parker Intelligence System'
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        console.log(`📊 Resposta ${fullUrl}: ${response.status} ${response.statusText}`)
        console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          console.error(`❌ Erro HTTP ${response.status} no endpoint ${apiEndpoint}`)
          
          // Try to get error details
          let errorDetail = 'Unknown error'
          try {
            const errorText = await response.text()
            errorDetail = errorText || response.statusText
            console.error(`❌ Detalhes do erro: ${errorDetail}`)
          } catch (e) {
            errorDetail = response.statusText
          }

          lastError = {
            error: `HTTP ${response.status}`,
            details: errorDetail,
            endpoint: apiEndpoint,
            url: fullUrl
          }
          continue; // Tentar próximo endpoint
        }

        let data
        const contentType = response.headers.get('content-type')
        console.log(`📝 Content-Type: ${contentType}`)

        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json()
            console.log(`✅ JSON parseado com sucesso, estrutura:`, Object.keys(data || {}))
            console.log(`📝 Primeira amostra dos dados:`, JSON.stringify(data, null, 2).substring(0, 500))
            
            // Para jobs configurados, estruturar os dados se necessário
            if (endpoint === 'jobs/configured' && data) {
              data = transformConfiguredJobs(data);
            }
            
            // Enriquecer dados de jobs se for endpoint de jobs
            if ((endpoint === 'jobs' || endpoint === 'jobs/last24h' || endpoint === 'jobs/recent') && data) {
              let jobs: BaculaJob[] = [];
              
              // Extrair jobs de diferentes estruturas
              if (Array.isArray(data)) {
                jobs = data;
              } else if (data.jobs && Array.isArray(data.jobs)) {
                jobs = data.jobs;
              } else if (data.data && Array.isArray(data.data)) {
                jobs = data.data;
              } else if (data.result && Array.isArray(data.result)) {
                jobs = data.result;
              } else if (data.output && Array.isArray(data.output)) {
                jobs = data.output;
              }
              
              console.log(`📊 Total de jobs encontrados: ${jobs.length}`);
              
              // Filtrar últimas 24h e enriquecer dados
              if (endpoint === 'jobs' || endpoint === 'jobs/last24h') {
                const filteredJobs = filterLast24Hours(jobs);
                console.log(`📊 Jobs das últimas 24h: ${filteredJobs.length}`);
                
                const enrichedJobs = enrichJobData(filteredJobs);
                
                // Calcular estatísticas
                const stats = {
                  total: enrichedJobs.length,
                  completed: enrichedJobs.filter(j => j.jobstatus === 'T').length,
                  running: enrichedJobs.filter(j => j.jobstatus === 'R').length,
                  error: enrichedJobs.filter(j => ['E', 'f', 'e'].includes(j.jobstatus)).length,
                  warning: enrichedJobs.filter(j => j.jobstatus === 'W').length,
                  cancelled: enrichedJobs.filter(j => j.jobstatus === 'A').length,
                  totalBytes: enrichedJobs.reduce((sum, j) => sum + (j.jobbytes || 0), 0),
                  totalFiles: enrichedJobs.reduce((sum, j) => sum + (j.jobfiles || 0), 0),
                  totalErrors: enrichedJobs.reduce((sum, j) => sum + (j.joberrors || 0), 0),
                  clients: [...new Set(enrichedJobs.map(j => j.client))],
                  avgDuration: enrichedJobs.length > 0 ? 
                    enrichedJobs.reduce((sum, j) => {
                      const start = j.starttime ? new Date(j.starttime) : null;
                      const end = j.endtime ? new Date(j.endtime) : null;
                      return sum + (start && end ? end.getTime() - start.getTime() : 0);
                    }, 0) / enrichedJobs.length / 1000 : 0
                };
                
                data = {
                  success: true,
                  endpoint: fullUrl,
                  jobs: enrichedJobs,
                  stats: {
                    ...stats,
                    totalBytesFormatted: formatBytes(stats.totalBytes),
                    avgDurationFormatted: formatDuration(stats.avgDuration * 1000),
                    clientCount: stats.clients.length,
                    successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
                    errorRate: stats.total > 0 ? Math.round((stats.error / stats.total) * 100) : 0
                  },
                  debug: {
                    timeRange: getLast24HoursRange(),
                    originalJobCount: jobs.length,
                    filteredJobCount: filteredJobs.length
                  }
                };
              } else {
                // Para outros endpoints de jobs, apenas enriquecer
                const enrichedJobs = enrichJobData(jobs);
                data = {
                  success: true,
                  endpoint: fullUrl,
                  jobs: enrichedJobs,
                  total: enrichedJobs.length
                };
              }
            }
            
            successfulEndpoint = fullUrl;
            rawData = data;
            break; // Sucesso, sair do loop
            
          } catch (jsonError) {
            console.error('❌ Erro no parse JSON:', jsonError)
            const textData = await response.text()
            console.error('❌ Resposta bruta:', textData.substring(0, 500))
            
            // Se recebeu HTML, provavelmente é uma página de login
            if (textData.includes('<html>') || textData.includes('<!DOCTYPE')) {
              return new Response(JSON.stringify({ 
                error: 'Received HTML instead of JSON - check authentication',
                details: 'O servidor retornou uma página HTML ao invés de dados JSON. Verifique a autenticação.',
                endpoint: apiEndpoint,
                url: fullUrl
              }), {
                ...corsOptions,
                status: 401
              })
            }
            
            lastError = {
              error: 'JSON parsing failed',
              details: jsonError.message,
              endpoint: apiEndpoint,
              rawData: textData.substring(0, 200)
            }
            continue;
          }
        } else {
          // If not JSON, try to get as text
          const textData = await response.text()
          console.log('❌ Resposta não-JSON:', textData.substring(0, 200))
          
          // Check if it's HTML (login page)
          if (textData.includes('<html>') || textData.includes('<!DOCTYPE')) {
            return new Response(JSON.stringify({ 
              error: 'Authentication required - received login page',
              details: 'O servidor retornou uma página de login. Verifique suas credenciais.',
              endpoint: apiEndpoint,
              url: fullUrl
            }), {
              ...corsOptions,
              status: 401
            })
          }
          
          lastError = {
            error: 'Non-JSON response',
            details: `Content-Type: ${contentType}`,
            endpoint: apiEndpoint,
            rawData: textData.substring(0, 200)
          }
          continue;
        }

      } catch (fetchError) {
        console.error(`❌ Erro de conexão para ${apiEndpoint}:`, fetchError)
        
        let errorMessage = 'Connection failed'
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout (30s)'
        } else if (fetchError.message) {
          errorMessage = fetchError.message
        }

        lastError = {
          error: errorMessage,
          details: `Falha ao conectar com ${fullUrl}`,
          endpoint: apiEndpoint
        }
        continue; // Tentar próximo endpoint
      }
    }

    // Se chegou aqui com dados, retornar sucesso
    if (rawData && successfulEndpoint) {
      console.log(`✅ Sucesso com endpoint: ${successfulEndpoint}`);
      
      return new Response(JSON.stringify(rawData), {
        ...corsOptions,
        headers: {
          ...corsOptions.headers,
          'Content-Type': 'application/json'
        }
      })
    }

    // Se chegou aqui, todos os endpoints falharam
    console.error('❌ Todos os endpoints falharam para:', endpoint)
    return new Response(JSON.stringify({ 
      error: 'All endpoints failed',
      details: 'Não foi possível conectar com nenhum endpoint da API Bacula',
      lastError: lastError,
      endpoints: apiEndpoints,
      baseUrl: baseUrl,
      testedEndpoints: apiEndpoints.length
    }), {
      ...corsOptions,
      status: 500
    })

  } catch (error) {
    console.error('❌ Erro geral no bacula-proxy:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      ...corsOptions,
      status: 500
    })
  }
})