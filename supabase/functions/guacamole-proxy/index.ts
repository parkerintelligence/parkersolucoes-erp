
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
    console.log('Data:', data)

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

    // Preparar URL da API
    const baseUrl = integration.base_url.replace(/\/$/, '')
    
    // Primeiro, fazer login para obter token
    console.log('Getting auth token...')
    const loginResponse = await fetch(`${baseUrl}/api/tokens`, {
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
      return new Response(
        JSON.stringify({ 
          error: `Erro de autenticação: ${loginResponse.status} - ${errorText}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const authToken = await loginResponse.text()
    console.log('Auth token obtained')

    // Agora fazer a chamada para o endpoint solicitado
    let apiUrl = `${baseUrl}/api/session/data/mysql`
    
    // Mapear endpoints para URLs da API do Guacamole
    switch (endpoint) {
      case 'connections':
        apiUrl += `/connections?token=${authToken}`
        break
      case 'users':
        apiUrl += `/users?token=${authToken}`
        break
      case 'sessions':
        apiUrl += `/activeConnections?token=${authToken}`
        break
      default:
        if (endpoint.startsWith('connections/')) {
          const connectionId = endpoint.split('/')[1]
          apiUrl += `/connections/${connectionId}?token=${authToken}`
        } else if (endpoint.startsWith('sessions/')) {
          const sessionId = endpoint.split('/')[1]
          apiUrl += `/activeConnections/${sessionId}?token=${authToken}`
        } else {
          apiUrl += `/${endpoint}?token=${authToken}`
        }
    }

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
      console.error('API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: `Erro da API Guacamole: ${apiResponse.status} - ${errorText}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await apiResponse.json()
    console.log('API response received')

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
