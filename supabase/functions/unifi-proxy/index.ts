
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, method, data, credentials } = await req.json()
    
    console.log('UniFi Proxy Request:', { url, method, hasCredentials: !!credentials })
    
    if (!url || !credentials) {
      return new Response(
        JSON.stringify({ error: 'URL and credentials are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { username, password, cookies } = credentials

    // Configure headers for the request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'UniFi-Integration/1.0'
    }

    // Add cookies if available
    if (cookies) {
      headers['Cookie'] = cookies
    }

    // Configure request body if needed
    let body: string | undefined
    if (data && (method === 'POST' || method === 'PUT')) {
      body = JSON.stringify(data)
    }

    console.log('Making request to UniFi controller:', url)

    // Make request to UniFi controller
    const response = await fetch(url, {
      method,
      headers,
      body,
      // Ignore invalid SSL certificates (common in UniFi controllers)
      // @ts-ignore
      rejectUnauthorized: false
    })

    console.log('UniFi controller response status:', response.status)

    // Extract cookies from response
    const setCookieHeader = response.headers.get('Set-Cookie')
    let responseCookies = ''
    if (setCookieHeader) {
      responseCookies = setCookieHeader
    }

    // Process response
    let responseData
    const contentType = response.headers.get('Content-Type') || ''
    
    if (contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }

    console.log('UniFi controller response data:', responseData)

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          details: 'Invalid credentials or insufficient permissions',
          status: response.status,
          data: responseData
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return response with cookies and original status
    return new Response(
      JSON.stringify({
        ...responseData,
        cookies: responseCookies,
        status: response.status,
        statusText: response.statusText
      }),
      {
        status: response.ok ? 200 : response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('UniFi Proxy Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to proxy request to UniFi controller',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
