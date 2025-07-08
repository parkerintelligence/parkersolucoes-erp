
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
      username: integration.username,
      has_password: !!integration.password,
      has_api_token: !!integration.api_token
    })

    // Preparar URL da API - garantir formato correto
    let baseUrl = integration.base_url.replace(/\/+$/, '') // Remove barras no final
    
    // Garantir que a URL seja válida e acessível
    try {
      const urlTest = new URL(baseUrl)
      baseUrl = urlTest.toString().replace(/\/+$/, '')
      console.log('Base URL validada:', baseUrl)
    } catch (urlError) {
      console.error('Invalid base URL:', baseUrl, urlError)
      return new Response(
        JSON.stringify({ 
          error: `URL base inválida: ${baseUrl}. Use formato: https://guacamole.exemplo.com/guacamole`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let authToken = ''

    // Verificar método de autenticação
    if (integration.api_token) {
      // Usar token da API diretamente
      console.log('=== Using API Token Authentication ===')
      authToken = integration.api_token
    } else if (integration.username && integration.password) {
      // Fazer login para obter token
      console.log('=== Authenticating with Credentials ===')
      const tokenUrl = `${baseUrl}/api/tokens`
      console.log('Token URL:', tokenUrl)
      
      try {
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

        console.log('Login response status:', loginResponse.status)
        console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()))

        if (!loginResponse.ok) {
          const errorText = await loginResponse.text()
          console.error('Login failed:', loginResponse.status, loginResponse.statusText)
          console.error('Login error response:', errorText)
          
          let errorMessage = 'Erro de autenticação no Guacamole'
          
          switch (loginResponse.status) {
            case 401:
              errorMessage = 'Credenciais inválidas. Verifique usuário e senha.'
              break
            case 403:
              errorMessage = 'Acesso negado. Verifique se o usuário tem permissões administrativas.'
              break
            case 404:
              errorMessage = 'URL do Guacamole não encontrada. Verifique se a URL está correta e inclui /guacamole se necessário.'
              break
            case 500:
              errorMessage = 'Erro interno do servidor Guacamole. Verifique se o serviço está funcionando.'
              break
            default:
              errorMessage = `Erro HTTP ${loginResponse.status}: ${loginResponse.statusText}`
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              details: {
                status: loginResponse.status,
                statusText: loginResponse.statusText,
                url: tokenUrl,
                response: errorText.substring(0, 500)
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        authToken = await loginResponse.text()
        console.log('Auth token obtained successfully, length:', authToken.length)
      } catch (fetchError) {
        console.error('Network error during login:', fetchError)
        return new Response(
          JSON.stringify({ 
            error: `Erro de conectividade: Não foi possível acessar ${tokenUrl}. Verifique se:
            • A URL está correta e acessível
            • O servidor Guacamole está online
            • Não há bloqueios de firewall
            • A URL inclui /guacamole se necessário`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Configuração incompleta do Guacamole. Configure credenciais (usuário e senha) ou um token da API.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Validar se o token foi realmente obtido
    if (!authToken || authToken.trim() === '') {
      return new Response(
        JSON.stringify({ 
          error: 'Token de autenticação vazio retornado pelo Guacamole'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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

    // Construir URL final
    let apiUrl = ''
    let requestHeaders: Record<string, string> = {}

    if (integration.api_token) {
      // Usar autenticação por header Authorization
      apiUrl = `${baseUrl}${apiPath}`
      requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      }
    } else {
      // Usar token como parâmetro de query
      apiUrl = `${baseUrl}${apiPath}?token=${encodeURIComponent(authToken)}`
      requestHeaders = {
        'Content-Type': 'application/json',
      }
    }

    console.log('Making API call to:', apiUrl.replace(authToken, '***TOKEN***'))

    const requestOptions: RequestInit = {
      method: method,
      headers: requestHeaders,
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data)
    }

    let apiResponse: Response
    try {
      apiResponse = await fetch(apiUrl, requestOptions)
    } catch (fetchError) {
      console.error('Network error during API call:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: `Erro de conectividade com a API: Não foi possível acessar ${baseUrl}${apiPath}. Verifique se:
          • O servidor Guacamole está online
          • A URL está correta
          • Não há bloqueios de firewall
          • A API REST está habilitada no Guacamole`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('API response status:', apiResponse.status)
    console.log('API response headers:', Object.fromEntries(apiResponse.headers.entries()))

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API error response:', errorText)
      
      let errorMessage = 'Erro da API Guacamole'
      
      switch (apiResponse.status) {
        case 401:
          errorMessage = 'Token de autenticação expirado ou inválido'
          break
        case 403:
          errorMessage = 'Acesso negado à API. Verifique se o usuário/token tem permissões para acessar dados de conexão.'
          break
        case 404:
          errorMessage = 'Endpoint da API não encontrado. Verifique se a versão do Guacamole é compatível.'
          break
        default:
          errorMessage = `Erro da API Guacamole: ${apiResponse.status} - ${apiResponse.statusText}`
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            endpoint: apiPath,
            response: errorText.substring(0, 500)
          }
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
          error: 'Erro ao processar resposta da API Guacamole. Resposta não é um JSON válido.'
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
        error: `Erro interno: ${error.message}`,
        details: {
          name: error.name,
          stack: error.stack?.substring(0, 500)
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
