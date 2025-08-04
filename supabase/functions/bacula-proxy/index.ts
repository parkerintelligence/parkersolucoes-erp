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

// Core API endpoints to try (in order of preference)
const API_ENDPOINTS = [
  '/api/v2',
  '/api/v1',
  '/api',
  ''
];

// Timeout configurations
const CONNECTION_TIMEOUT = 5000; // 5 seconds for initial connection
const REQUEST_TIMEOUT = 15000; // 15 seconds for data requests

// Cache for successful endpoints and responses
const endpointCache = new Map<string, { endpoint: string; timestamp: number }>();
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RESPONSE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for response cache

// Circuit breaker for failing endpoints
const circuitBreaker = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>();
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

function isCircuitOpen(endpoint: string): boolean {
  const circuit = circuitBreaker.get(endpoint);
  if (!circuit || !circuit.isOpen) return false;
  
  // Reset circuit breaker after timeout
  if (Date.now() - circuit.lastFailure > CIRCUIT_BREAKER_TIMEOUT) {
    circuit.isOpen = false;
    circuit.failures = 0;
    return false;
  }
  
  return true;
}

function recordFailure(endpoint: string) {
  const circuit = circuitBreaker.get(endpoint) || { failures: 0, lastFailure: 0, isOpen: false };
  circuit.failures++;
  circuit.lastFailure = Date.now();
  
  if (circuit.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuit.isOpen = true;
    console.log(`🔴 Circuit breaker OPEN for endpoint: ${endpoint}`);
  }
  
  circuitBreaker.set(endpoint, circuit);
}

function recordSuccess(endpoint: string) {
  circuitBreaker.delete(endpoint);
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
function enrichJobData(jobs: any): BaculaJob[] {
  // Ensure jobs is an array
  if (!jobs) {
    console.log('⚠️ No jobs data provided to enrichJobData');
    return [];
  }
  
  if (!Array.isArray(jobs)) {
    console.log('⚠️ Jobs data is not an array:', typeof jobs, jobs);
    // If it's an object with jobs array inside, try to extract it
    if (jobs.output && Array.isArray(jobs.output)) {
      jobs = jobs.output;
    } else if (jobs.jobs && Array.isArray(jobs.jobs)) {
      jobs = jobs.jobs;
    } else if (jobs.data && Array.isArray(jobs.data)) {
      jobs = jobs.data;
    } else {
      console.log('❌ Cannot extract jobs array from:', jobs);
      return [];
    }
  }
  
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

async function performHealthcheck(baseUrl: string, auth: string): Promise<{ success: boolean; responseTime: number; error?: string; apiVersion?: string }> {
  const startTime = Date.now();
  
  // Test basic connectivity first
  try {
    const basicResponse = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'text/html,application/json,*/*'
      },
      signal: AbortSignal.timeout(CONNECTION_TIMEOUT)
    });

    const responseTime = Date.now() - startTime;
    
    if (!basicResponse.ok) {
      return { 
        success: false, 
        responseTime, 
        error: `Basic connectivity failed: HTTP ${basicResponse.status}` 
      };
    }

    // Try to detect API version
    let apiVersion = 'unknown';
    for (const endpoint of API_ENDPOINTS) {
      if (isCircuitOpen(`${baseUrl}${endpoint}`)) continue;
      
      try {
        const testResponse = await fetch(`${baseUrl}${endpoint}/version`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(CONNECTION_TIMEOUT)
        });
        
        if (testResponse.ok) {
          const contentType = testResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            apiVersion = endpoint || 'root';
            recordSuccess(`${baseUrl}${endpoint}`);
            break;
          }
        }
      } catch (e) {
        recordFailure(`${baseUrl}${endpoint}`);
        continue;
      }
    }
    
    return { success: true, responseTime, apiVersion };
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return { 
      success: false, 
      responseTime, 
      error: error.message || 'Connection failed' 
    };
  }
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
      console.error(`❌ [${requestId}] No authorization header provided`);
      return new Response(JSON.stringify({ 
        error: 'Authorization header missing.',
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
      console.error(`❌ [${requestId}] Invalid token:`, { 
        error: userError?.message,
        hasUser: !!user 
      });
      return new Response(JSON.stringify({ 
        error: 'Authentication failed. Please verify you are logged in.',
        requestId
      }), {
        ...corsOptions,
        status: 401
      });
    }

    console.log(`✅ [${requestId}] User authenticated: ${user.email}`);

    // Get Bacula integration with error handling
    const { data: integrations, error: integrationError } = await userSupabaseClient
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (integrationError) {
      console.error(`❌ [${requestId}] Integration query error:`, integrationError);
      return new Response(JSON.stringify({ 
        error: 'Database error when fetching integration',
        requestId,
        details: integrationError.message 
      }), {
        ...corsOptions,
        status: 500
      });
    }

    if (!integrations || integrations.length === 0) {
      console.error(`❌ [${requestId}] No active Bacula integration found`);
      return new Response(JSON.stringify({ 
        error: 'Bacula integration not found or inactive',
        requestId
      }), {
        ...corsOptions,
        status: 404
      });
    }

    const integration = integrations[0];
    console.log(`✅ [${requestId}] Bacula integration found: ${integration.name}`);

    const { endpoint, params } = await req.json();
    console.log(`📝 [${requestId}] Requested endpoint: ${endpoint}`);
    console.log(`📝 [${requestId}] Parameters:`, params);

    // Validate credentials
    if (!integration.username || !integration.password || !integration.base_url) {
      console.error(`❌ [${requestId}] Incomplete integration configuration`);
      return new Response(JSON.stringify({ 
        error: 'Incomplete Bacula integration configuration',
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

    // Create auth header and normalize base URL
    const auth = btoa(`${integration.username}:${integration.password}`);
    const baseUrl = integration.base_url.replace(/\/$/, '');

    console.log(`🔗 [${requestId}] Connecting to Bacula at: ${baseUrl}`);
    console.log(`👤 [${requestId}] User: ${integration.username}`);
    console.log(`🔑 [${requestId}] Auth: Basic ${auth.substring(0, 10)}...`);

    // Perform healthcheck first to detect connectivity issues
    console.log('🔍 Performing healthcheck...');
    const healthcheck = await performHealthcheck(integration.base_url, auth);
    
    if (!healthcheck.success) {
      console.error('❌ Healthcheck failed:', healthcheck.error);
      
      // Try to return cached data if available
      const cacheKey = `${integration.id}-${endpoint}`;
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < RESPONSE_CACHE_DURATION * 3) {
        console.log('📦 Returning cached data due to connection failure');
        return new Response(
          JSON.stringify({
            ...cachedResponse.data,
            cached: true,
            message: 'Data from cache - server temporarily unavailable'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: 'Bacula server healthcheck failed',
          message: healthcheck.error,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Verify Bacula server is running and accessible',
            'Check network connectivity to Bacula server',
            'Ensure BaculaWeb is properly installed and configured',
            'Verify firewall settings allow access to Bacula port',
            'Check if credentials are correct and user has proper permissions'
          ]
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`✅ Healthcheck passed in ${healthcheck.responseTime}ms, API version: ${healthcheck.apiVersion}`);

    // Try each API endpoint until one works
    let lastError = '';
    let successfulEndpoint = '';
    let responseData = null;
    
    // Check response cache first
    const responseCacheKey = `${integration.id}-${endpoint}`;
    const cachedResponse = responseCache.get(responseCacheKey);
    
    if (cachedResponse && Date.now() - cachedResponse.timestamp < RESPONSE_CACHE_DURATION) {
      console.log('📦 Returning cached response');
      return new Response(
        JSON.stringify({
          ...cachedResponse.data,
          cached: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check endpoint cache
    const endpointCacheKey = `${integration.base_url}-${endpoint}`;
    const cachedEndpoint = endpointCache.get(endpointCacheKey);
    
    // If we have a cached successful endpoint, try it first
    if (cachedEndpoint && Date.now() - cachedEndpoint.timestamp < CACHE_DURATION) {
      const fullUrl = `${integration.base_url}${cachedEndpoint.endpoint}/${endpoint}`;
      
      if (!isCircuitOpen(fullUrl)) {
        console.log(`🎯 Trying cached endpoint: ${fullUrl}`);
        
        try {
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType?.includes('application/json')) {
              const data = await response.json();
              console.log(`✅ Cached endpoint success: ${fullUrl}`);
              successfulEndpoint = fullUrl;
              responseData = data;
              recordSuccess(fullUrl);
            } else {
              console.log(`❌ Cached endpoint returned non-JSON: ${contentType}`);
              endpointCache.delete(endpointCacheKey);
              recordFailure(fullUrl);
            }
          }
        } catch (error: any) {
          console.log(`❌ Cached endpoint failed: ${error.message}`);
          endpointCache.delete(endpointCacheKey);
          recordFailure(fullUrl);
        }
      }
    }

    // If cached endpoint didn't work, try all endpoints with exponential backoff
    if (!responseData) {
      for (const apiEndpoint of API_ENDPOINTS) {
        const fullUrl = `${integration.base_url}${apiEndpoint}/${endpoint}`;
        
        if (isCircuitOpen(fullUrl)) {
          console.log(`⏭️ Skipping endpoint (circuit open): ${fullUrl}`);
          continue;
        }
        
        console.log(`🔄 Trying endpoint: ${fullUrl}`);
        
        let attempt = 0;
        const maxRetries = 2;
        
        while (attempt < maxRetries && !responseData) {
          try {
            const response = await fetch(fullUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
              },
              signal: AbortSignal.timeout(REQUEST_TIMEOUT)
            });

            if (response.ok) {
              const contentType = response.headers.get('content-type');
              
              if (contentType?.includes('application/json')) {
                const data = await response.json();
                console.log(`✅ Bacula API success: ${fullUrl}`, { responseTime: Date.now() - Date.now(), attempt: attempt + 1 });
                
                // Cache successful endpoint and response
                endpointCache.set(endpointCacheKey, {
                  endpoint: apiEndpoint,
                  timestamp: Date.now()
                });
                
                successfulEndpoint = fullUrl;
                responseData = data;
                recordSuccess(fullUrl);
                break;
              } else {
                lastError = `Non-JSON response (${contentType})`;
                console.log(`❌ Endpoint returned non-JSON: ${contentType} for ${fullUrl}`);
                recordFailure(fullUrl);
                break;
              }
            } else {
              lastError = `HTTP ${response.status}: ${response.statusText}`;
              console.log(`❌ Endpoint failed with status ${response.status}: ${fullUrl}`);
              
              if (response.status >= 400 && response.status < 500) {
                recordFailure(fullUrl);
                break; // Don't retry client errors
              }
            }
          } catch (error: any) {
            lastError = error.message;
            console.log(`❌ Endpoint error (attempt ${attempt + 1}): ${lastError} for ${fullUrl}`);
            recordFailure(fullUrl);
            
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
          }
          
          attempt++;
        }
        
        if (responseData) break;
      }
    }

    if (!responseData) {
      console.error(`❌ All endpoints failed. Last error: ${lastError}`);
      
      // Try to return very old cached data as last resort
      const veryOldCache = responseCache.get(responseCacheKey);
      if (veryOldCache) {
        console.log('🆘 Returning very old cached data as last resort');
        return new Response(
          JSON.stringify({
            ...veryOldCache.data,
            cached: true,
            stale: true,
            message: 'Data from cache - all endpoints failed'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: 'All Bacula API endpoints failed',
          message: lastError,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Verify Bacula server is running and accessible',
            'Check username and password credentials',
            'Ensure BaculaWeb is properly configured and running',
            'Verify API endpoints are available (/api/v2, /api/v1, /api)',
            'Check network connectivity and firewall settings',
            'Verify Bacula service is running on the server',
            'Check if the API requires different authentication'
          ]
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📊 Processing ${endpoint} data...`);
    let processedData = responseData;

    // Apply data processing based on endpoint
    if (endpoint === 'jobs/all') {
      processedData = enrichJobData(responseData.output || []);
    } else if (endpoint === 'jobs/last24h') {
      const jobs = responseData.output || [];
      const last24hJobs = filterLast24Hours(jobs);
      processedData = enrichJobData(last24hJobs);
    } else if (endpoint === 'jobs/running') {
      processedData = enrichJobData(responseData.output || []);
    } else if (endpoint === 'jobs/recent') {
      processedData = enrichJobData(responseData.output || []);
    } else if (endpoint.startsWith('jobs/period')) {
      processedData = enrichJobData(responseData.output || []);
    } else if (endpoint === 'jobs/configured') {
      processedData = transformConfiguredJobs(responseData);
    }

    const result = {
      success: true,
      endpoint: successfulEndpoint,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: processedData
    };

    // Cache the response
    responseCache.set(responseCacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error(`❌ [${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        requestId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})