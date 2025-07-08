
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface BaculaRequest {
  baseUrl: string;
  username: string;
  password: string;
  endpoint: string;
  method?: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { baseUrl, username, password, endpoint, method = 'GET', data }: BaculaRequest = await req.json()

    if (!baseUrl || !username || !password || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Remove trailing slash from baseUrl
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    
    // Construct the full URL
    const url = `${cleanBaseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`

    console.log(`Making request to BaculaWeb: ${method} ${url}`)

    // Create headers with basic authentication
    const headers: Record<string, string> = {
      'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Make the request to BaculaWeb
    const requestOptions: RequestInit = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data)
    }

    const response = await fetch(url, requestOptions)
    
    if (!response.ok) {
      console.error(`BaculaWeb API error: ${response.status} ${response.statusText}`)
      return new Response(
        JSON.stringify({ 
          error: `BaculaWeb API error: ${response.status} ${response.statusText}`,
          details: await response.text()
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await response.json()
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in bacula-proxy:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

serve(handler)
