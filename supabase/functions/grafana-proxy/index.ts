
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const grafanaUrl = url.searchParams.get('url')
    const authHeader = url.searchParams.get('auth')
    
    if (!grafanaUrl || !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing url or auth parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Proxying request to:', grafanaUrl)

    const grafanaResponse = await fetch(grafanaUrl, {
      method: req.method,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: req.method !== 'GET' ? await req.text() : undefined,
    })

    const responseText = await grafanaResponse.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    console.log('Grafana response status:', grafanaResponse.status)

    return new Response(
      JSON.stringify(responseData),
      {
        status: grafanaResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Grafana proxy error:', error)
    return new Response(
      JSON.stringify({ error: 'Proxy request failed', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
