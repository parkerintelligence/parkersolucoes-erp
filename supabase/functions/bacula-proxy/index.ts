
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
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        ...corsOptions,
        status: 401
      })
    }

    // Get Bacula integration
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    if (integrationError || !integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ error: 'Bacula integration not found' }), {
        ...corsOptions,
        status: 404
      })
    }

    const integration = integrations[0]
    const { endpoint } = await req.json()

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

    console.log(`Making request to: ${baseUrl}${apiEndpoint}`)

    // Make request to BaculaWeb API
    const response = await fetch(`${baseUrl}${apiEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Parker Intelligence System'
      }
    })

    if (!response.ok) {
      console.error(`BaculaWeb API error: ${response.status} - ${response.statusText}`)
      
      // Try to get error details
      let errorDetail = 'Unknown error'
      try {
        const errorText = await response.text()
        errorDetail = errorText || response.statusText
      } catch (e) {
        errorDetail = response.statusText
      }

      return new Response(JSON.stringify({ 
        error: `BaculaWeb API error: ${response.status}`,
        details: errorDetail,
        endpoint: apiEndpoint
      }), {
        ...corsOptions,
        status: response.status
      })
    }

    let data
    try {
      data = await response.json()
    } catch (e) {
      // If JSON parsing fails, try to get as text
      const textData = await response.text()
      data = { raw: textData }
    }

    console.log(`BaculaWeb API response:`, data)

    return new Response(JSON.stringify(data), {
      ...corsOptions,
      headers: {
        ...corsOptions.headers,
        'Content-Type': 'application/json'
      }
    })

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
