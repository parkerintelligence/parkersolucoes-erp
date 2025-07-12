
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache de tokens em memória por integração
const tokenCache = new Map<string, { token: string, expires: number }>()

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

    // Obter dataSource da integração (campo directory)
    const dataSource = integration.directory || 'postgresql'

    console.log('Integration found:', {
      name: integration.name,
      base_url: integration.base_url,
      username: integration.username,
      dataSource: dataSource,
      has_password: !!integration.password
    })

    // Validar credenciais obrigatórias
    if (!integration.username || !integration.password) {
      return new Response(
        JSON.stringify({ 
          error: 'Credenciais incompletas. Configure usuário e senha na integração.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar URL da API - normalizar para incluir /guacamole se necessário
    let baseUrl = integration.base_url.replace(/\/+$/, '') // Remove barras no final
    
    // Adicionar /guacamole se não estiver presente
    if (!baseUrl.endsWith('/guacamole')) {
      baseUrl += '/guacamole';
    }
    
    // Garantir que a URL seja válida e acessível
    try {
      const urlTest = new URL(baseUrl)
      console.log('Base URL normalizada e validada:', baseUrl)
    } catch (urlError) {
      console.error('Invalid base URL:', baseUrl, urlError)
      return new Response(
        JSON.stringify({ 
          error: `URL base inválida: ${baseUrl}. Use formato: http://servidor:porta/guacamole`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se temos um token em cache ainda válido
    const now = Date.now()
    const cachedToken = tokenCache.get(integrationId)
    let authToken = ''

    if (cachedToken && cachedToken.expires > now) {
      console.log('=== Usando token em cache ===')
      authToken = cachedToken.token
    } else {
      console.log('=== Fazendo login para obter novo token ===')
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
              errorMessage = 'Acesso negado. Verifique se o usuário tem permissões administrativas no Guacamole.'
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
                response: errorText.substring(0, 500),
                baseUrlNormalized: baseUrl
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
        console.log('Token preview (first 20 chars):', authToken.substring(0, 20) + '...')

        // Cache do token por 50 minutos (tokens do Guacamole geralmente expiram em 60 min)
        // Também verificar se o token é válido antes de cachear
        if (authToken && authToken.length > 10) {
          tokenCache.set(integrationId, {
            token: authToken,
            expires: now + (50 * 60 * 1000) // 50 minutos
          })
          console.log('Token cached successfully')
        } else {
          console.warn('Token muito curto ou inválido, não será cacheado:', authToken?.length || 0)
        }
        
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
    }
    
    // Validar se o token foi obtido
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

    // Construir URL da API baseada no endpoint solicitado usando dataSource dinamicamente
    let apiPath = ''
    
    switch (endpoint) {
      case 'connections':
        apiPath = `/api/session/data/${dataSource}/connections`
        break
      case 'users':
        apiPath = `/api/session/data/${dataSource}/users`
        break
      case 'sessions':
        apiPath = `/api/session/data/${dataSource}/activeConnections`
        break
      case 'connectionGroups':
        apiPath = `/api/session/data/${dataSource}/connectionGroups`
        break
      case 'permissions':
        apiPath = `/api/session/data/${dataSource}/permissions`
        break
      case 'schemas':
        apiPath = `/api/session/data/${dataSource}/schema/userAttributes`
        break
      case 'history':
        apiPath = `/api/session/data/${dataSource}/history/connections`
        break
      default:
        if (endpoint.startsWith('connections/')) {
          const connectionId = endpoint.split('/')[1]
          const action = endpoint.split('/')[2]
          if (action) {
            apiPath = `/api/session/data/${dataSource}/connections/${encodeURIComponent(connectionId)}/${action}`
          } else {
            apiPath = `/api/session/data/${dataSource}/connections/${encodeURIComponent(connectionId)}`
          }
        } else if (endpoint.startsWith('sessions/')) {
          const sessionId = endpoint.split('/')[1]
          apiPath = `/api/session/data/${dataSource}/activeConnections/${encodeURIComponent(sessionId)}`
        } else if (endpoint.startsWith('users/')) {
          const username = endpoint.split('/')[1]
          const action = endpoint.split('/')[2]
          if (action) {
            apiPath = `/api/session/data/${dataSource}/users/${encodeURIComponent(username)}/${action}`
          } else {
            apiPath = `/api/session/data/${dataSource}/users/${encodeURIComponent(username)}`
          }
        } else {
          apiPath = `/api/session/data/${dataSource}/${endpoint}`
        }
    }

    // Construir URL final com token como parâmetro
    const apiUrl = `${baseUrl}${apiPath}?token=${encodeURIComponent(authToken)}`

    console.log('=== Making API call ===')
    console.log('API Path:', apiPath)
    console.log('Data Source:', dataSource)
    console.log('Base URL:', baseUrl)
    console.log('Full URL (token masked):', `${baseUrl}${apiPath}?token=***MASKED***`)
    console.log('Token length:', authToken.length)
    console.log('Token valid:', !!authToken && authToken.length > 0)

    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
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
          • A URL está correta: ${baseUrl}
          • Não há bloqueios de firewall
          • A API REST está habilitada no Guacamole
          • O Data Source '${dataSource}' está configurado corretamente`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('=== API Response ===')
    console.log('API response status:', apiResponse.status)
    console.log('API response headers:', Object.fromEntries(apiResponse.headers.entries()))

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API error response:', errorText)
      
      // Se for erro 401 ou 403, limpar cache do token
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        console.log('Token inválido, removendo do cache')
        tokenCache.delete(integrationId)
      }
      
      let errorMessage = 'Erro da API Guacamole'
      
      switch (apiResponse.status) {
        case 401:
          errorMessage = 'Token de autenticação expirado ou inválido. O sistema irá tentar obter um novo token na próxima requisição.'
          break
        case 403:
          errorMessage = `Acesso negado à API do Guacamole. IMPORTANTE: O usuário "${integration.username}" precisa ter permissões ADMINISTRATIVAS no Guacamole para acessar os dados de conexões, usuários e sessões ativas. Verifique no painel administrativo do Guacamole se este usuário tem as permissões corretas.`
          break
        case 404:
          errorMessage = `Endpoint da API não encontrado. Verifique se a versão do Guacamole é compatível, se a API REST está habilitada e se o Data Source '${dataSource}' está configurado corretamente.`
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
            dataSource: dataSource,
            baseUrl: baseUrl,
            response: errorText.substring(0, 500),
            username: integration.username,
            needsAdminPermissions: apiResponse.status === 403
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

    console.log('=== Success ===')
    console.log('API response processed successfully')
    console.log('Result type:', typeof result)
    console.log('Result keys:', Object.keys(result || {}))
    console.log('Token cache status:', tokenCache.has(integrationId) ? 'cached' : 'not cached')
    console.log('Data Source used:', dataSource)
    console.log('Base URL used:', baseUrl)

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
