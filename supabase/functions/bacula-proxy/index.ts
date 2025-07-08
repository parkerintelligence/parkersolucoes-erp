
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const corsOptions = {
  headers: {
    ...corsHeaders,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  },
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

    const { endpoint } = await req.json()
    console.log(`Requested endpoint: ${endpoint}`)

    // Create base64 auth header
    const auth = btoa(`${integration.username}:${integration.password}`)
    const baseUrl = integration.base_url.replace(/\/$/, '')

    // BaculaWeb API endpoints mapping
    const endpointMap: Record<string, string> = {
      'jobs': '/api/jobs',
      'jobs/recent': '/api/jobs/recent',
      'jobs/running': '/api/jobs/running',
      'jobs/last24h': '/api/jobs/last24h',
      'clients': '/api/clients',
      'volumes': '/api/volumes',
      'pools': '/api/pools',
      'storages': '/api/storages',
      'status': '/api/status',
      'director': '/api/director/status',
      'statistics': '/api/statistics',
      'catalog': '/api/catalog',
      'test': '/api/test',
      'version': '/api/version'
    }

    const apiEndpoint = endpointMap[endpoint] || endpoint
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
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError)
          const textData = await response.text()
          data = { raw: textData, error: 'JSON parsing failed' }
        }
      } else {
        // If not JSON, try to get as text
        const textData = await response.text()
        data = { raw: textData, contentType }
      }

      console.log(`BaculaWeb API response data:`, JSON.stringify(data, null, 2))

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
