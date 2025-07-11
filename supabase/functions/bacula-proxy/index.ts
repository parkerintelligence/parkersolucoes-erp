import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const corsOptions = {
  headers: {
    ...corsHeaders,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  },
}

// Função para transformar dados de jobs configurados em estrutura consistente
function transformConfiguredJobs(data: any): any {
  console.log('Transforming configured jobs data:', data);
  
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
  
  console.log('Transformed jobs:', normalizedJobs);
  
  return {
    output: normalizedJobs,
    total: normalizedJobs.length
  };
}

serve(async (req) => {
  console.log(`Bacula proxy request: ${req.method} ${req.url}`)

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
      console.error('No authorization header provided')
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
      console.error('Invalid token:', userError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        ...corsOptions,
        status: 401
      })
    }

    console.log(`User authenticated: ${user.email}`)

    // Get Bacula integration
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    if (integrationError) {
      console.error('Integration query error:', integrationError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        ...corsOptions,
        status: 500
      })
    }

    if (!integrations || integrations.length === 0) {
      console.error('No active Bacula integration found')
      return new Response(JSON.stringify({ error: 'Bacula integration not found' }), {
        ...corsOptions,
        status: 404
      })
    }

    const integration = integrations[0]
    console.log(`Found Bacula integration: ${integration.name}`)

    const { endpoint, params } = await req.json()
    console.log(`Requested endpoint: ${endpoint}`)
    console.log(`Request params:`, params)

    // Create base64 auth header
    const auth = btoa(`${integration.username}:${integration.password}`)
    const baseUrl = integration.base_url.replace(/\/$/, '')

    // BaculaWeb/Baculum API endpoints mapping - usando endpoints corretos do Baculum
    const endpointMap: Record<string, string> = {
      'test': '/api/v2/config/api/info',
      'jobs': '/api/v2/jobs',
      'jobs/recent': '/api/v2/jobs?limit=50&order_by=jobid&order_direction=desc',
      'jobs/all': '/api/v2/jobs?limit=1000&order_by=jobid&order_direction=desc',
      'jobs/period': '/api/v2/jobs',
      'jobs/running': '/api/v2/jobs?jobstatus=R',
      'jobs/last24h': '/api/v2/jobs?age=86400',
      'jobs/last7days': '/api/v2/jobs?age=604800',
      'jobs/last30days': '/api/v2/jobs?age=2592000',
      'jobs/configured': '/api/v2/config/dir/job',
      'clients': '/api/v2/clients',
      'clients/configured': '/api/v2/config/dir/client',
      'volumes': '/api/v2/volumes',
      'pools': '/api/v2/pools',
      'storages': '/api/v2/storages',
      'status': '/api/v2/status',
      'director': '/api/v2/status/director',
      'statistics': '/api/v2/jobs/totals',
      'catalog': '/api/v2/catalog',
      'version': '/api/v2/config/api/info'
    }

    let apiEndpoint = endpointMap[endpoint] || endpoint
    
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
      queryParams.append('order_by', 'jobid')
      queryParams.append('order_direction', 'desc')
      
      // Add status filter if specified
      if (params.status && params.status !== 'all') {
        queryParams.append('jobstatus', params.status)
      }
      
      apiEndpoint = `/api/v2/jobs?${queryParams.toString()}`
    }
    
    const fullUrl = `${baseUrl}${apiEndpoint}`

    console.log(`Making request to: ${fullUrl}`)

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

      console.log(`Response status: ${response.status}`)
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.error(`BaculaWeb API error: ${response.status} - ${response.statusText}`)
        
        // Try to get error details
        let errorDetail = 'Unknown error'
        try {
          const errorText = await response.text()
          errorDetail = errorText || response.statusText
          console.error(`Error response body: ${errorDetail}`)
        } catch (e) {
          errorDetail = response.statusText
        }

        // Se for 404, tentar com endpoints v1
        if (response.status === 404) {
          console.log('Tentando com endpoints v1...')
          let v1Endpoint = apiEndpoint.replace('/api/v2/', '/api/v1/')
          
          // Para jobs configurados, tentar endpoint específico do v1
          if (endpoint === 'jobs/configured') {
            v1Endpoint = '/api/v1/config/job'
          }
          
          const v1Url = `${baseUrl}${v1Endpoint}`
          console.log(`Trying v1 endpoint: ${v1Url}`)
          
          try {
            const v1Response = await fetch(v1Url, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Parker Intelligence System'
              },
              signal: controller.signal
            })
            
            if (v1Response.ok) {
              const v1Data = await v1Response.json()
              console.log(`V1 API response successful:`, v1Data)
              
              // Para jobs configurados, estruturar os dados se necessário
              if (endpoint === 'jobs/configured' && v1Data && typeof v1Data === 'object') {
                const structuredData = transformConfiguredJobs(v1Data);
                return new Response(JSON.stringify(structuredData), {
                  ...corsOptions,
                  headers: {
                    ...corsOptions.headers,
                    'Content-Type': 'application/json'
                  }
                })
              }
              
              return new Response(JSON.stringify(v1Data), {
                ...corsOptions,
                headers: {
                  ...corsOptions.headers,
                  'Content-Type': 'application/json'
                }
              })
            } else {
              console.log(`V1 endpoint also failed: ${v1Response.status}`)
            }
          } catch (v1Error) {
            console.error('V1 endpoint error:', v1Error)
          }
        }

        return new Response(JSON.stringify({ 
          error: `BaculaWeb API error: ${response.status}`,
          details: errorDetail,
          endpoint: apiEndpoint,
          url: fullUrl
        }), {
          ...corsOptions,
          status: response.status
        })
      }

      let data
      const contentType = response.headers.get('content-type')
      console.log(`Response content type: ${contentType}`)

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
          console.log(`BaculaWeb API response data:`, JSON.stringify(data, null, 2))
          
          // Para jobs configurados, estruturar os dados se necessário
          if (endpoint === 'jobs/configured' && data) {
            data = transformConfiguredJobs(data);
          }
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError)
          const textData = await response.text()
          console.error('Raw response:', textData)
          
          // Se recebeu HTML, provavelmente é uma página de login
          if (textData.includes('<html>') || textData.includes('<!DOCTYPE')) {
            return new Response(JSON.stringify({ 
              error: 'Received HTML instead of JSON - check authentication or API endpoint',
              details: 'The server returned an HTML page instead of JSON data. This usually indicates authentication issues or incorrect API endpoint.',
              endpoint: apiEndpoint,
              url: fullUrl
            }), {
              ...corsOptions,
              status: 401
            })
          }
          
          data = { raw: textData, error: 'JSON parsing failed' }
        }
      } else {
        // If not JSON, try to get as text
        const textData = await response.text()
        console.log('Non-JSON response:', textData)
        
        // Check if it's HTML (login page)
        if (textData.includes('<html>') || textData.includes('<!DOCTYPE')) {
          return new Response(JSON.stringify({ 
            error: 'Authentication required - received login page',
            details: 'The server returned a login page instead of API data. Check your credentials and API configuration.',
            endpoint: apiEndpoint,
            url: fullUrl
          }), {
            ...corsOptions,
            status: 401
          })
        }
        
        data = { raw: textData, contentType }
      }

      return new Response(JSON.stringify(data), {
        ...corsOptions,
        headers: {
          ...corsOptions.headers,
          'Content-Type': 'application/json'
        }
      })

    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      
      let errorMessage = 'Connection failed'
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Request timeout'
      } else if (fetchError.message) {
        errorMessage = fetchError.message
      }

      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: `Failed to connect to ${fullUrl}`,
        endpoint: apiEndpoint
      }), {
        ...corsOptions,
        status: 500
      })
    }

  } catch (error) {
    console.error('Error in bacula-proxy:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      ...corsOptions,
      status: 500
    })
  }
})