
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, method, data, credentials } = await req.json()
    
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

    // Configurar headers para a requisição
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'UniFi-Integration/1.0'
    }

    // Adicionar cookies se disponíveis
    if (cookies) {
      headers['Cookie'] = cookies
    }

    // Configurar o corpo da requisição se necessário
    let body: string | undefined
    if (data && (method === 'POST' || method === 'PUT')) {
      body = JSON.stringify(data)
    }

    // Fazer a requisição para a controladora UniFi
    const response = await fetch(url, {
      method,
      headers,
      body,
      // Ignorar certificados SSL inválidos (comum em controladoras UniFi)
      // @ts-ignore
      rejectUnauthorized: false
    })

    // Extrair cookies da resposta
    const setCookieHeader = response.headers.get('Set-Cookie')
    let responseCookies = ''
    if (setCookieHeader) {
      responseCookies = setCookieHeader
    }

    // Processar a resposta
    let responseData
    const contentType = response.headers.get('Content-Type') || ''
    
    if (contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }

    // Retornar a resposta com cookies
    return new Response(
      JSON.stringify({
        ...responseData,
        cookies: responseCookies,
        status: response.status,
        statusText: response.statusText
      }),
      {
        status: 200,
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
