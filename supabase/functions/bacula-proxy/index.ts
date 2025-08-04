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
  stats?: {
    total: number;
    success: number;
    error: number;
    running: number;
  };
  error?: string;
  message?: string;
}

interface BaculaClient {
  clientid: number;
  name: string;
  uname: string;
  autoprune: number;
  fileretention: number;
  jobretention: number;
}

interface BaculaVolume {
  mediaid: number;
  volumename: string;
  slot: number;
  poolid: number;
  mediatype: string;
  mediatypeid: number;
  labeltype: number;
  firstwritten: string;
  lastwritten: string;
  labeldate: string;
  voljobs: number;
  volfiles: number;
  volblocks: number;
  volmounts: number;
  volbytes: number;
  volparts: number;
  volstatus: string;
  enabled: number;
  recycle: number;
  actiononpurge: number;
  volretention: number;
  voluseduration: number;
  maxvoljobs: number;
  maxvolfiles: number;
  maxvolbytes: number;
  inchanger: number;
  storageid: number;
  deviceid: number;
  mediaaddressing: number;
  volreadtime: number;
  volwritetime: number;
  endfile: number;
  endblock: number;
  locationid: number;
  recyclecount: number;
  initialwrite: string;
  scratchpoolid: number;
  recyclepoolid: number;
  comment: string;
}

interface BaculaStorage {
  storageid: number;
  name: string;
  address: string;
  sdport: number;
  password: string;
  device: string;
  mediatype: string;
  autochanger: number;
  enabled: number;
  comment: string;
}

interface BaculaStatus {
  director?: {
    name: string;
    version: string;
    started: string;
    jobs: {
      running: number;
      total: number;
    };
  };
  storage?: Array<{
    name: string;
    status: string;
    device: string;
  }>;
  clients?: Array<{
    name: string;
    status: string;
    version: string;
  }>;
}

interface BaculaStatistics {
  jobs: {
    total: number;
    success: number;
    error: number;
    running: number;
    last24h: number;
  };
  clients: {
    total: number;
    active: number;
  };
  volumes: {
    total: number;
    available: number;
    full: number;
  };
  storage: {
    total_capacity: string;
    used_capacity: string;
    free_capacity: string;
  };
}

// Helper function to make HTTP requests to Bacula API
async function makeBaculaRequest(integration: any, endpoint: string, params: any = {}, requestId: string = '') {
  const baseUrl = integration.base_url?.replace(/\/$/, '') || '';
  
  console.log(`🔗 [${requestId}] Bacula base URL: ${baseUrl}`);
  console.log(`🔗 [${requestId}] Endpoint: ${endpoint}`);
  console.log(`🔗 [${requestId}] Params:`, JSON.stringify(params, null, 2));

  if (!baseUrl) {
    throw new Error('Base URL da integração Bacula não configurada');
  }

  // Build the full URL
  let url = `${baseUrl}/api/${endpoint}`;
  
  // Add query parameters if provided
  if (Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    url += `?${queryParams.toString()}`;
  }

  console.log(`🚀 [${requestId}] Making request to: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${integration.username}:${integration.password}`)}`,
        'User-Agent': 'Bacula-Proxy/1.0'
      },
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    });

    console.log(`📡 [${requestId}] Response status: ${response.status}`);
    console.log(`📡 [${requestId}] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${requestId}] HTTP error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ [${requestId}] Response received:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error(`❌ [${requestId}] Request failed:`, error);
    
    if (error.name === 'TimeoutError') {
      throw new Error('Timeout: Bacula API não respondeu em 30 segundos');
    }
    
    if (error.message?.includes('fetch')) {
      throw new Error(`Erro de conectividade: ${error.message}`);
    }
    
    throw error;
  }
}

// Enhanced endpoint handlers with better error handling and data validation
const endpointHandlers = {
  // Test connection
  'test': async (integration: any, params: any, requestId: string) => {
    console.log(`🧪 [${requestId}] Testing Bacula connection...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'status', {}, requestId);
      return {
        success: true,
        message: 'Conexão com Bacula OK',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Connection test failed:`, error);
      return {
        success: false,
        message: `Falha na conexão: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Get jobs from last 24 hours
  'jobs/last24h': async (integration: any, params: any, requestId: string) => {
    console.log(`📋 [${requestId}] Fetching jobs from last 24 hours...`);
    
    try {
      const limit = params.limit || 50;
      const hours = params.hours || 24;
      
      const result = await makeBaculaRequest(integration, 'jobs', {
        limit,
        hours,
        order: 'desc'
      }, requestId);

      // Validate and process the response
      let jobs = [];
      if (Array.isArray(result)) {
        jobs = result;
      } else if (result.jobs && Array.isArray(result.jobs)) {
        jobs = result.jobs;
      } else if (result.data && Array.isArray(result.data)) {
        jobs = result.data;
      }

      // Calculate basic statistics
      const stats = {
        total: jobs.length,
        success: jobs.filter(job => ['T', 'OK'].includes(job.jobstatus)).length,
        error: jobs.filter(job => ['E', 'f', 'F', 'A'].includes(job.jobstatus)).length,
        running: jobs.filter(job => ['R'].includes(job.jobstatus)).length
      };

      console.log(`📊 [${requestId}] Jobs statistics:`, stats);

      return {
        jobs: jobs,
        stats: stats,
        total: jobs.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch jobs:`, error);
      throw error;
    }
  },

  // Get all jobs
  'jobs': async (integration: any, params: any, requestId: string) => {
    console.log(`📋 [${requestId}] Fetching all jobs...`);
    
    try {
      const limit = params.limit || 100;
      const offset = params.offset || 0;
      
      const result = await makeBaculaRequest(integration, 'jobs', {
        limit,
        offset,
        order: 'desc'
      }, requestId);

      let jobs = [];
      if (Array.isArray(result)) {
        jobs = result;
      } else if (result.jobs && Array.isArray(result.jobs)) {
        jobs = result.jobs;
      }

      return {
        jobs: jobs,
        total: jobs.length,
        limit: limit,
        offset: offset,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch all jobs:`, error);
      throw error;
    }
  },

  // Get recent jobs (completed in last few hours)
  'jobs/recent': async (integration: any, params: any, requestId: string) => {
    console.log(`📋 [${requestId}] Fetching recent jobs...`);
    
    try {
      const hours = params.hours || 6;
      const limit = params.limit || 20;
      
      const result = await makeBaculaRequest(integration, 'jobs/recent', {
        hours,
        limit,
        status: 'completed'
      }, requestId);

      let jobs = [];
      if (Array.isArray(result)) {
        jobs = result;
      } else if (result.jobs && Array.isArray(result.jobs)) {
        jobs = result.jobs;
      }

      return {
        jobs: jobs,
        total: jobs.length,
        hours: hours,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch recent jobs:`, error);
      throw error;
    }
  },

  // Get running jobs
  'jobs/running': async (integration: any, params: any, requestId: string) => {
    console.log(`🏃 [${requestId}] Fetching running jobs...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'jobs/running', {}, requestId);

      let jobs = [];
      if (Array.isArray(result)) {
        jobs = result;
      } else if (result.jobs && Array.isArray(result.jobs)) {
        jobs = result.jobs;
      }

      return {
        jobs: jobs,
        total: jobs.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch running jobs:`, error);
      throw error;
    }
  },

  // Get clients
  'clients': async (integration: any, params: any, requestId: string) => {
    console.log(`👥 [${requestId}] Fetching clients...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'clients', params, requestId);

      let clients = [];
      if (Array.isArray(result)) {
        clients = result;
      } else if (result.clients && Array.isArray(result.clients)) {
        clients = result.clients;
      }

      return {
        clients: clients,
        total: clients.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch clients:`, error);
      throw error;
    }
  },

  // Get volumes
  'volumes': async (integration: any, params: any, requestId: string) => {
    console.log(`💿 [${requestId}] Fetching volumes...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'volumes', params, requestId);

      let volumes = [];
      if (Array.isArray(result)) {
        volumes = result;
      } else if (result.volumes && Array.isArray(result.volumes)) {
        volumes = result.volumes;
      }

      return {
        volumes: volumes,
        total: volumes.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch volumes:`, error);
      throw error;
    }
  },

  // Get storage devices
  'storage': async (integration: any, params: any, requestId: string) => {
    console.log(`🗄️ [${requestId}] Fetching storage devices...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'storage', params, requestId);

      let storage = [];
      if (Array.isArray(result)) {
        storage = result;
      } else if (result.storage && Array.isArray(result.storage)) {
        storage = result.storage;
      }

      return {
        storage: storage,
        total: storage.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch storage:`, error);
      throw error;
    }
  },

  // Get overall status
  'status': async (integration: any, params: any, requestId: string) => {
    console.log(`📊 [${requestId}] Fetching overall status...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'status', params, requestId);

      return {
        status: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch status:`, error);
      throw error;
    }
  },

  // Get director status
  'status/director': async (integration: any, params: any, requestId: string) => {
    console.log(`🎯 [${requestId}] Fetching director status...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'status/director', params, requestId);

      return {
        director: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch director status:`, error);
      throw error;
    }
  },

  // Get statistics
  'statistics': async (integration: any, params: any, requestId: string) => {
    console.log(`📈 [${requestId}] Fetching statistics...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'statistics', params, requestId);

      return {
        statistics: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch statistics:`, error);
      throw error;
    }
  },

  // Get jobs by period
  'jobs/period': async (integration: any, params: any, requestId: string) => {
    console.log(`📅 [${requestId}] Fetching jobs by period...`);
    
    try {
      const days = params.days || 7;
      const status = params.status;
      
      const queryParams: any = { days };
      if (status) {
        queryParams.status = status;
      }
      
      const result = await makeBaculaRequest(integration, 'jobs/period', queryParams, requestId);

      let jobs = [];
      if (Array.isArray(result)) {
        jobs = result;
      } else if (result.jobs && Array.isArray(result.jobs)) {
        jobs = result.jobs;
      }

      return {
        jobs: jobs,
        total: jobs.length,
        days: days,
        status: status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch jobs by period:`, error);
      throw error;
    }
  },

  // Get configured jobs
  'jobs/configured': async (integration: any, params: any, requestId: string) => {
    console.log(`⚙️ [${requestId}] Fetching configured jobs...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'jobs/configured', params, requestId);

      let jobs = [];
      if (Array.isArray(result)) {
        jobs = result;
      } else if (result.jobs && Array.isArray(result.jobs)) {
        jobs = result.jobs;
      }

      return {
        jobs: jobs,
        total: jobs.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch configured jobs:`, error);
      throw error;
    }
  },

  // Get configured clients
  'clients/configured': async (integration: any, params: any, requestId: string) => {
    console.log(`⚙️ [${requestId}] Fetching configured clients...`);
    
    try {
      const result = await makeBaculaRequest(integration, 'clients/configured', params, requestId);

      let clients = [];
      if (Array.isArray(result)) {
        clients = result;
      } else if (result.clients && Array.isArray(result.clients)) {
        clients = result.clients;
      }

      return {
        clients: clients,
        total: clients.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch configured clients:`, error);
      throw error;
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsOptions.headers })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    const { endpoint, params = {} } = body
    
    console.log('🔄 Request received:', { endpoint, params })

    // Verificar se é uma chamada interna
    const isInternalCall = req.headers.get('x-internal-call') === 'true'
    const userIdFromHeader = req.headers.get('x-user-id')
    const requestId = req.headers.get('x-request-id') || `req-${Date.now()}`
    
    console.log(`🔍 [${requestId}] Internal call: ${isInternalCall}, User ID: ${userIdFromHeader}`)

    let userId: string;

    if (isInternalCall && userIdFromHeader) {
      // Para chamadas internas, usar o user ID do header
      userId = userIdFromHeader;
      console.log(`🔧 [${requestId}] Using internal user ID: ${userId}`);
    } else {
      // Para chamadas externas, verificar token JWT
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error(`❌ [${requestId}] No authorization header provided`)
        return new Response('Unauthorized', { status: 401, headers: corsOptions.headers })
      }

      const token = authHeader.replace('Bearer ', '')

      // Verificar o token e obter informações do usuário
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
      
      if (authError || !user) {
        console.error(`❌ [${requestId}] Token verification failed:`, authError)
        return new Response('Invalid token', { status: 401, headers: corsOptions.headers })
      }

      userId = user.id;
      console.log(`✅ [${requestId}] User authenticated:`, userId);
    }

    // Buscar integração Bacula para este usuário
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      console.error(`❌ [${requestId}] No active Bacula integration found for user ${userId}:`, integrationError)
      return new Response('No Bacula integration configured', { 
        status: 404, 
        headers: corsOptions.headers 
      })
    }

    console.log(`🔌 [${requestId}] Found Bacula integration:`, integration.name)

    // Check if the requested endpoint exists
    if (!endpointHandlers[endpoint]) {
      console.error(`❌ [${requestId}] Unknown endpoint: ${endpoint}`)
      return new Response(JSON.stringify({
        error: 'Unknown endpoint',
        available_endpoints: Object.keys(endpointHandlers),
        requested: endpoint
      }), {
        status: 400,
        headers: { ...corsOptions.headers, 'Content-Type': 'application/json' }
      })
    }

    // Execute the endpoint handler
    try {
      console.log(`🚀 [${requestId}] Executing endpoint: ${endpoint}`)
      const result = await endpointHandlers[endpoint](integration, params, requestId)
      
      console.log(`✅ [${requestId}] Endpoint executed successfully`)
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsOptions.headers, 'Content-Type': 'application/json' }
      })
    } catch (endpointError) {
      console.error(`❌ [${requestId}] Endpoint execution failed:`, endpointError)
      
      return new Response(JSON.stringify({
        error: 'Endpoint execution failed',
        details: endpointError.message,
        endpoint: endpoint,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsOptions.headers, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    
    let status = 500
    let errorMessage = 'Internal server error'
    
    if (error.message?.includes('JSON')) {
      status = 400
      errorMessage = 'Invalid JSON in request body'
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      ...corsOptions,
      status
    })
  }
})