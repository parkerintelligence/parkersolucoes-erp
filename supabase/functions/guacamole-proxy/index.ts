
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { endpoint, method = 'GET', data, integrationId } = await req.json()
    
    console.log('=== Guacamole Proxy Function Start ===')
    console.log('Endpoint:', endpoint)
    console.log('Method:', method)
    console.log('Integration ID:', integrationId)

    if (!integrationId) {
      return new Response(
        JSON.stringify({ 
          error: 'ID da integração é obrigatório'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Inicializar cliente do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar dados da integração
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('type', 'guacamole')
      .single()

    if (integrationError || !integration) {
      console.error('Integration error:', integrationError)
      return new Response(
        JSON.stringify({ 
          error: 'Integração do Guacamole não encontrada'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!integration.is_active) {
      return new Response(
        JSON.stringify({ 
          error: 'Integração do Guacamole está inativa'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Integration found:', {
      name: integration.name,
      base_url: integration.base_url,
      username: integration.username
    })

    // Preparar URL da API - remover barras duplas e garantir formato correto
    let baseUrl = integration.base_url.replace(/\/+$/, '') // Remove barras no final
    
    // Garantir que a URL não tenha problemas de codificação
    try {
      const urlTest = new URL(baseUrl)
      baseUrl = urlTest.toString().replace(/\/+$/, '')
    } catch (urlError) {
      console.error('Invalid base URL:', baseUrl)
      return new Response(
        JSON.stringify({ 
          error: `URL base inválida: ${baseUrl}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Primeiro, fazer login para obter token
    console.log('Getting auth token...')
    const tokenUrl = `${baseUrl}/api/tokens`
    console.log('Token URL:', tokenUrl)
    
    const loginResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: integration.username,
        password: integration.password,
      }),
    })

    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, loginResponse.statusText)
      const errorText = await loginResponse.text()
      console.error('Login error response:', errorText)
      return new Response(
        JSON.stringify({ 
          error: `Erro de autenticação: ${loginResponse.status} - Verifique as credenciais`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const authToken = await loginResponse.text()
    console.log('Auth token obtained, length:', authToken.length)

    // Construir URL da API baseada no endpoint solicitado
    let apiPath = ''
    
    switch (endpoint) {
      case 'connections':
        apiPath = '/api/session/data/mysql/connections'
        break
      case 'users':
        apiPath = '/api/session/data/mysql/users'
        break
      case 'sessions':
        apiPath = '/api/session/data/mysql/activeConnections'
        break
      default:
        if (endpoint.startsWith('connections/')) {
          const connectionId = endpoint.split('/')[1]
          apiPath = `/api/session/data/mysql/connections/${encodeURIComponent(connectionId)}`
        } else if (endpoint.startsWith('sessions/')) {
          const sessionId = endpoint.split('/')[1]
          apiPath = `/api/session/data/mysql/activeConnections/${encodeURIComponent(sessionId)}`
        } else {
          apiPath = `/api/session/data/mysql/${endpoint}`
        }
    }

    // Construir URL final com token como parâmetro
    const apiUrl = `${baseUrl}${apiPath}?token=${encodeURIComponent(authToken)}`
    console.log('Making API call to:', apiUrl)

    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data)
    }

    const apiResponse = await fetch(apiUrl, requestOptions)
    console.log('API response status:', apiResponse.status)

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API error response:', errorText)
      return new Response(
        JSON.stringify({ 
          error: `Erro da API Guacamole: ${apiResponse.status} - ${apiResponse.statusText}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result
    try {
      const responseText = await apiResponse.text()
      console.log('Raw API response (first 200 chars):', responseText.substring(0, 200))
      
      if (responseText.trim() === '') {
        result = {}
      } else {
        result = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Error parsing API response:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar resposta da API Guacamole'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('API response processed successfully')
    console.log('Result type:', typeof result)
    console.log('Result keys:', Object.keys(result || {}))

    return new Response(
      JSON.stringify({ result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: `Erro interno: ${error.message}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
