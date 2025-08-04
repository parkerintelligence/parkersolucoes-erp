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

// Cache para endpoints bem-sucedidos
const endpointCache = new Map<string, { endpoint: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Healthcheck básico com timeout reduzido
async function performHealthcheck(baseUrl: string, auth: string): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const healthEndpoints = ['/api/v2/info', '/api/v1/info', '/api/info'];
  
  for (const testEndpoint of healthEndpoints) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout para healthcheck
      
      const response = await fetch(`${baseUrl}${testEndpoint}`, {
        method: 'HEAD', // Usa HEAD para ser mais rápido
        headers: { 'Authorization': `Basic ${auth}` },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        console.log(`✅ Healthcheck bem-sucedido em ${responseTime}ms: ${testEndpoint}`);
        return { success: true, responseTime };
      }
    } catch (error) {
      console.log(`⚠️ Healthcheck falhou: ${testEndpoint} - ${error.message}`);
    }
  }
  
  return { success: false, responseTime: 0, error: 'Nenhum endpoint de healthcheck respondeu' };
}

serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔄 [${requestId}] Bacula proxy request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, corsOptions);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log(`🔐 [${requestId}] Authorization header present:`, !!authHeader);
    
    if (!authHeader) {
      console.error(`❌ [${requestId}] Nenhum header de autorização fornecido`);
      return new Response(JSON.stringify({ 
        error: 'Header de autorização ausente.',
        requestId 
      }), {
        ...corsOptions,
        status: 401
      });
    }

    console.log(`👤 [${requestId}] Authenticating user...`);
    const token = authHeader.replace('Bearer ', '');
    console.log(`🔑 [${requestId}] Token extracted, length:`, token.length);
    
    // Create a client with the user's token
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();

    if (userError || !user) {
      console.error(`❌ [${requestId}] Token inválido:`, { 
        error: userError?.message,
        hasUser: !!user 
      });
      return new Response(JSON.stringify({ 
        error: 'Falha na autenticação. Verifique se você está logado.',
        requestId
      }), {
        ...corsOptions,
        status: 401
      });
    }

    console.log(`✅ [${requestId}] Usuário autenticado: ${user.email}`);

    // Get Bacula integration with error handling
    const { data: integrations, error: integrationError } = await userSupabaseClient
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (integrationError) {
      console.error(`❌ [${requestId}] Erro na consulta de integração:`, integrationError);
      return new Response(JSON.stringify({ 
        error: 'Erro na base de dados ao buscar integração',
        requestId,
        details: integrationError.message 
      }), {
        ...corsOptions,
        status: 500
      });
    }

    if (!integrations || integrations.length === 0) {
      console.error(`❌ [${requestId}] Nenhuma integração Bacula ativa encontrada`);
      return new Response(JSON.stringify({ 
        error: 'Integração Bacula não encontrada ou inativa',
        requestId
      }), {
        ...corsOptions,
        status: 404
      });
    }

    const integration = integrations[0];
    console.log(`✅ [${requestId}] Integração Bacula encontrada: ${integration.name}`);

    const { endpoint, params } = await req.json();
    console.log(`📝 [${requestId}] Endpoint solicitado: ${endpoint}`);
    console.log(`📝 [${requestId}] Parâmetros:`, params);

    // Validar credenciais
    if (!integration.username || !integration.password || !integration.base_url) {
      console.error(`❌ [${requestId}] Configuração incompleta da integração`);
      return new Response(JSON.stringify({ 
        error: 'Configuração incompleta da integração Bacula',
        requestId,
        missing: {
          username: !integration.username,
          password: !integration.password,
          base_url: !integration.base_url
        }
      }), {
        ...corsOptions,
        status: 400
      });
    }

    // Create auth header e normalize base URL
    const auth = btoa(`${integration.username}:${integration.password}`);
    const baseUrl = integration.base_url.replace(/\/$/, '');

    console.log(`🔗 [${requestId}] Conectando com Bacula em: ${baseUrl}`);
    console.log(`👤 [${requestId}] Usuário: ${integration.username}`);
    console.log(`🔑 [${requestId}] Autenticação: Basic ${auth.substring(0, 10)}...`);

    // Perform healthcheck primeiro para detectar problemas de conectividade
    if (endpoint !== 'test') {
      console.log(`🏥 [${requestId}] Executando healthcheck...`);
      const healthResult = await performHealthcheck(baseUrl, auth);
      
      if (!healthResult.success) {
        console.error(`❌ [${requestId}] Falha no healthcheck: ${healthResult.error}`);
        return new Response(JSON.stringify({ 
          error: 'Servidor Bacula não está acessível',
          requestId,
          details: healthResult.error,
          suggestion: 'Verifique se o servidor está funcionando e as credenciais estão corretas'
        }), {
          ...corsOptions,
          status: 503
        });
      }
      
      console.log(`✅ [${requestId}] Healthcheck passou em ${healthResult.responseTime}ms`);
    }

    // Verificar cache de endpoints bem-sucedidos
    const cacheKey = `${baseUrl}:${endpoint}`;
    const cachedEndpoint = endpointCache.get(cacheKey);
    
    if (cachedEndpoint && (Date.now() - cachedEndpoint.timestamp) < CACHE_DURATION) {
      console.log(`📋 [${requestId}] Usando endpoint em cache: ${cachedEndpoint.endpoint}`);
    }

    // Estratégias otimizadas de endpoint (priorizar versões mais estáveis)
    const endpointMap: Record<string, string[]> = {
      'test': [
        '/api/v2/info',
        '/api/v1/info', 
        '/api/v2/config/api/info',
        '/api/info'
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
      ],
      'jobs/recent': [
        '/api/v2/jobs?limit=100&order_by=jobid&order_direction=desc', 
        '/api/v1/jobs?limit=100',
        '/api/jobs?limit=100'
      ],
      'jobs/last24h': [
        '/api/v2/jobs?age=86400&limit=1000&order_by=starttime&order_direction=desc',
        '/api/v1/jobs?age=86400&limit=1000',
        '/api/v2/jobs?limit=1000'
      ],
      'jobs/running': [
        '/api/v2/jobs?jobstatus=R&limit=1000',
        '/api/v1/jobs?jobstatus=R&limit=1000',
        '/api/jobs?jobstatus=R'
      ],
      'director': [
        '/api/v2/directors',
        '/api/v1/directors',
        '/api/directors'
      ],
      'jobs/configured': [
        '/api/v2/config/dir/job', 
        '/api/v1/config/dir/job',
        '/api/v2/config/job'
      ],
      'clients': [
        '/api/v2/clients', 
        '/api/v1/clients'
      ],
      'clients/configured': [
        '/api/v2/config/dir/client',
        '/api/v1/config/dir/client',
        '/api/v2/config/client'
      ],
      'storages': [
        '/api/v2/storages',
        '/api/v1/storages'
      ],
      'volumes': [
        '/api/v2/volumes',
        '/api/v1/volumes'
      ],
      'status': [
        '/api/v2/status', 
        '/api/v1/status'
      ],
      'statistics': [
        '/api/v2/stats',
        '/api/v1/stats',
        '/api/v2/statistics'
      ]
    };

    let apiEndpoints = endpointMap[endpoint] || [endpoint.startsWith('/') ? endpoint : `/${endpoint}`];
    
    // Se temos endpoint em cache, colocar como primeiro da lista
    if (cachedEndpoint && !apiEndpoints.includes(cachedEndpoint.endpoint)) {
      apiEndpoints.unshift(cachedEndpoint.endpoint);
    }
    
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

    // Sistema de retry com backoff exponencial e circuit breaker
    let lastError = null;
    let successfulEndpoint = '';
    let rawData = null;
    let attemptsCount = 0;
    const maxAttempts = Math.min(apiEndpoints.length, 3); // Limitar tentativas
    
    console.log(`🎯 [${requestId}] Tentando ${maxAttempts} endpoints de ${apiEndpoints.length} disponíveis`);

    for (let i = 0; i < maxAttempts; i++) {
      const apiEndpoint = apiEndpoints[i];
      attemptsCount++;
      
      // Garantir que sempre tenha a barra entre baseUrl e endpoint
      const normalizedEndpoint = apiEndpoint.startsWith('/') ? apiEndpoint : `/${apiEndpoint}`;
      const fullUrl = `${baseUrl}${normalizedEndpoint}`;
      
      console.log(`🔄 [${requestId}] Tentativa ${attemptsCount}/${maxAttempts}: ${fullUrl}`);

      try {
        // Timeout mais agressivo para detectar problemas rapidamente
        const controller = new AbortController();
        const timeoutMs = i === 0 ? 10000 : 15000; // Primeiro endpoint: 10s, outros: 15s
        const timeoutId = setTimeout(() => {
          console.log(`⏰ [${requestId}] Timeout de ${timeoutMs/1000}s atingido para ${fullUrl}`);
          controller.abort();
        }, timeoutMs);

        const startRequest = Date.now();
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Parker Intelligence System v2.0',
            'Cache-Control': 'no-cache',
            'Connection': 'close' // Evitar keep-alive para reduzir problemas de conexão
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const requestTime = Date.now() - startRequest;

        console.log(`📊 [${requestId}] Resposta ${fullUrl}: ${response.status} ${response.statusText} (${requestTime}ms)`);

        if (!response.ok) {
          console.error(`❌ [${requestId}] Erro HTTP ${response.status} no endpoint ${apiEndpoint}`);
          
          // Tentar obter detalhes do erro com timeout
          let errorDetail = response.statusText;
          try {
            const textResponse = await Promise.race([
              response.text(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
            errorDetail = textResponse.toString().substring(0, 200) || response.statusText;
          } catch (e) {
            console.warn(`⚠️ [${requestId}] Não foi possível ler corpo da resposta de erro`);
          }

          lastError = {
            error: `HTTP ${response.status}`,
            details: errorDetail,
            endpoint: apiEndpoint,
            url: fullUrl,
            response_time: requestTime,
            timestamp: new Date().toISOString(),
            attempt: attemptsCount
          };
          
          // Tratamento inteligente de erros
          if (response.status === 404 || response.status === 405) {
            console.log(`🔄 [${requestId}] Erro ${response.status} - tentando próximo endpoint...`);
            continue; 
          } else if (response.status === 401 || response.status === 403) {
            console.error(`🚨 [${requestId}] Erro de autenticação - credenciais inválidas`);
            return new Response(JSON.stringify({ 
              error: 'Credenciais inválidas para Bacula',
              requestId,
              details: 'Verifique o usuário e senha da integração Bacula',
              httpStatus: response.status
            }), {
              ...corsOptions,
              status: 401
            });
          } else if (response.status >= 500) {
            console.error(`🚨 [${requestId}] Erro do servidor (${response.status}) - tentando próximo endpoint`);
            continue;
          } else {
            continue; // Tentar próximo endpoint para outros erros
          }
        }

        let data;
        const contentType = response.headers.get('content-type');
        console.log(`📝 [${requestId}] Content-Type: ${contentType}`);

        if (contentType && contentType.includes('application/json')) {
          try {
            // Parse JSON com timeout
            const jsonPromise = response.json();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('JSON parse timeout')), 5000)
            );
            
            data = await Promise.race([jsonPromise, timeoutPromise]);
            console.log(`✅ [${requestId}] JSON parseado com sucesso, estrutura:`, Object.keys(data || {}));
            
            // Cache do endpoint bem-sucedido
            endpointCache.set(cacheKey, { endpoint: normalizedEndpoint, timestamp: Date.now() });
            console.log(`💾 [${requestId}] Endpoint cacheado: ${normalizedEndpoint}`);
            
            // Para jobs configurados, estruturar os dados se necessário
            if (endpoint === 'jobs/configured' && data) {
              data = transformConfiguredJobs(data);
            }
            
            // Enriquecer dados de jobs se for endpoint de jobs
            if ((endpoint === 'jobs' || endpoint === 'jobs/last24h' || endpoint === 'jobs/recent') && data) {
              let jobs: BaculaJob[] = [];
              
              // Extrair jobs de diferentes estruturas de resposta
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
              
              console.log(`📊 [${requestId}] Total de jobs encontrados: ${jobs.length}`);
              
              // Filtrar últimas 24h e enriquecer dados
              if (endpoint === 'jobs' || endpoint === 'jobs/last24h') {
                const filteredJobs = filterLast24Hours(jobs);
                console.log(`📊 [${requestId}] Jobs das últimas 24h: ${filteredJobs.length}`);
                
                const enrichedJobs = enrichJobData(filteredJobs);
                
                // Calcular estatísticas detalhadas
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
                  requestId,
                  data: enrichedJobs, // Mudança: usar 'data' ao invés de 'jobs' para consistência
                  stats: {
                    ...stats,
                    totalBytesFormatted: formatBytes(stats.totalBytes),
                    avgDurationFormatted: formatDuration(stats.avgDuration * 1000),
                    clientCount: stats.clients.length,
                    successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
                    errorRate: stats.total > 0 ? Math.round((stats.error / stats.total) * 100) : 0
                  },
                  meta: {
                    timeRange: getLast24HoursRange(),
                    originalJobCount: jobs.length,
                    filteredJobCount: filteredJobs.length,
                    responseTime: requestTime,
                    attempt: attemptsCount
                  }
                };
              } else {
                // Para outros endpoints de jobs, apenas enriquecer
                const enrichedJobs = enrichJobData(jobs);
                data = {
                  success: true,
                  endpoint: fullUrl,
                  requestId,
                  data: enrichedJobs,
                  total: enrichedJobs.length,
                  meta: {
                    responseTime: requestTime,
                    attempt: attemptsCount
                  }
                };
              }
            } else {
              // Para endpoints que não são de jobs, retornar dados diretamente
              data = {
                success: true,
                endpoint: fullUrl,
                requestId,
                data: data,
                meta: {
                  responseTime: requestTime,
                  attempt: attemptsCount
                }
              };
            }
            
            successfulEndpoint = fullUrl;
            rawData = data;
            break; // Sucesso, sair do loop
            
          } catch (jsonError) {
            console.error(`❌ [${requestId}] Erro no parse JSON:`, jsonError);
            
            // Tentar ler como texto para diagnóstico
            let textData = '';
            try {
              textData = await response.text();
            } catch (textError) {
              console.error(`❌ [${requestId}] Erro ao ler texto da resposta:`, textError);
            }
            
            console.error(`❌ [${requestId}] Resposta bruta (primeiros 300 chars):`, textData.substring(0, 300));
            
            // Se recebeu HTML, provavelmente é uma página de login ou erro
            if (textData.includes('<html>') || textData.includes('<!DOCTYPE')) {
              console.error(`🚨 [${requestId}] Recebido HTML ao invés de JSON - possível erro de autenticação`);
              return new Response(JSON.stringify({ 
                error: 'Recebido HTML ao invés de JSON',
                requestId,
                details: 'O servidor retornou uma página HTML. Verifique a autenticação e configurações.',
                endpoint: apiEndpoint,
                url: fullUrl,
                suggestion: 'Verifique se as credenciais estão corretas e o servidor está configurado adequadamente'
              }), {
                ...corsOptions,
                status: 422
              });
            }
            
            lastError = {
              error: 'JSON parsing failed',
              details: jsonError.message,
              endpoint: apiEndpoint,
              url: fullUrl,
              rawDataSample: textData.substring(0, 200),
              attempt: attemptsCount
            };
            continue;
          }
        } else {
          // Se não é JSON, tentar obter como texto para diagnóstico
          let textData = '';
          try {
            textData = await response.text();
          } catch (textError) {
            console.error(`❌ [${requestId}] Erro ao ler resposta não-JSON:`, textError);
          }
          
          console.log(`❌ [${requestId}] Resposta não-JSON:`, textData.substring(0, 200));
          
          // Verificar se é HTML (página de login)
          if (textData.includes('<html>') || textData.includes('<!DOCTYPE')) {
            console.error(`🚨 [${requestId}] Recebida página de login - erro de autenticação`);
            return new Response(JSON.stringify({ 
              error: 'Página de login recebida',
              requestId,
              details: 'O servidor retornou uma página de login. Credenciais inválidas.',
              endpoint: apiEndpoint,
              url: fullUrl,
              suggestion: 'Verifique o usuário e senha da integração Bacula'
            }), {
              ...corsOptions,
              status: 401
            });
          }
          
          lastError = {
            error: 'Non-JSON response',
            details: `Content-Type: ${contentType}`,
            endpoint: apiEndpoint,
            url: fullUrl,
            rawDataSample: textData.substring(0, 200),
            attempt: attemptsCount
          };
          continue;
        }

      } catch (fetchError) {
        console.error(`❌ [${requestId}] Erro de conexão para ${apiEndpoint}:`, fetchError);
        
        let errorMessage = 'Connection failed';
        let errorCategory = 'network';
        
        if (fetchError.name === 'AbortError') {
          errorMessage = `Request timeout (${timeoutMs/1000}s)`;
          errorCategory = 'timeout';
        } else if (fetchError.message) {
          errorMessage = fetchError.message;
          if (fetchError.message.includes('ECONNREFUSED')) {
            errorCategory = 'connection_refused';
            errorMessage = 'Conexão recusada - servidor inacessível';
          } else if (fetchError.message.includes('ENOTFOUND')) {
            errorCategory = 'dns';
            errorMessage = 'Host não encontrado - verifique a URL';
          } else if (fetchError.message.includes('ETIMEDOUT')) {
            errorCategory = 'timeout';
            errorMessage = 'Timeout de conexão';
          }
        }

        lastError = {
          error: errorMessage,
          category: errorCategory,
          details: `Falha ao conectar com ${fullUrl}`,
          endpoint: apiEndpoint,
          url: fullUrl,
          attempt: attemptsCount,
          timestamp: new Date().toISOString()
        };
        
        // Para erros de conectividade graves, não tentar mais endpoints
        if (errorCategory === 'connection_refused' || errorCategory === 'dns') {
          console.error(`🚨 [${requestId}] Erro grave de conectividade (${errorCategory}) - interrompendo tentativas`);
          break;
        }
        
        continue; // Tentar próximo endpoint para outros erros
      }
    }

    // Se chegou aqui com dados, retornar sucesso
    if (rawData && successfulEndpoint) {
      console.log(`✅ [${requestId}] Sucesso com endpoint: ${successfulEndpoint}`);
      
      return new Response(JSON.stringify(rawData), {
        ...corsOptions,
        headers: {
          ...corsOptions.headers,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      });
    }

    // Se chegou aqui, todos os endpoints falharam
    console.error(`❌ [${requestId}] Todos os ${attemptsCount} endpoints testados falharam para: ${endpoint}`);
    
    // Classificar o tipo de erro para melhor diagnóstico
    let failureCategory = 'unknown';
    let recommendation = 'Verifique a conectividade com o servidor Bacula';
    
    if (lastError) {
      if (lastError.category === 'connection_refused' || lastError.category === 'dns') {
        failureCategory = 'connectivity';
        recommendation = 'Verifique se o servidor Bacula está funcionando e acessível';
      } else if (lastError.category === 'timeout') {
        failureCategory = 'performance';
        recommendation = 'O servidor está lento ou sobrecarregado. Tente novamente em alguns minutos';
      } else if (lastError.error?.includes('HTTP 401') || lastError.error?.includes('HTTP 403')) {
        failureCategory = 'authentication';
        recommendation = 'Verifique as credenciais da integração Bacula';
      } else if (lastError.error?.includes('HTTP 404')) {
        failureCategory = 'api_compatibility';
        recommendation = 'A versão da API Bacula pode ser incompatível. Verifique a documentação';
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'Todos os endpoints falharam',
      requestId,
      details: `Não foi possível conectar com nenhum endpoint da API Bacula após ${attemptsCount} tentativas`,
      failureCategory,
      recommendation,
      lastError,
      debug: {
        endpoints: apiEndpoints.slice(0, maxAttempts),
        baseUrl,
        attemptsCount,
        totalEndpoints: apiEndpoints.length,
        timestamp: new Date().toISOString()
      }
    }), {
      ...corsOptions,
      status: 503
    });

  } catch (error) {
    console.error('❌ Erro geral no bacula-proxy:', error)
    
    // Determine appropriate status code based on error type
    let status = 500;
    let errorMessage = 'Erro interno do servidor';
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Authentication failed')) {
        status = 401;
        errorMessage = 'Falha na autenticação. Verifique se você está logado.';
      } else if (error.message.includes('Bacula integration not found')) {
        status = 404;
        errorMessage = 'Integração Bacula não encontrada ou inativa.';
      } else if (error.message.includes('Authorization header')) {
        status = 401;
        errorMessage = 'Header de autorização ausente.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }), {
      ...corsOptions,
      status
    })
  }
})