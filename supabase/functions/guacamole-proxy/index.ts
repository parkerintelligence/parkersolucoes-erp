import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache de tokens em memória por integração com informações completas
const tokenCache = new Map<string, { 
  authToken: string, 
  username: string,
  dataSource: string,
  availableDataSources: string[],
  expires: number 
}>()

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

    // Preparar URL da API - usar exatamente como configurado
    let baseUrl = integration.base_url.replace(/\/+$/, '') // Remove barras no final
    
    // Garantir que a URL seja válida e acessível
    try {
      const urlTest = new URL(baseUrl)
      console.log('Base URL validada:', baseUrl)
    } catch (urlError) {
      console.error('Invalid base URL:', baseUrl, urlError)
      return new Response(
        JSON.stringify({ 
          error: `URL base inválida: ${baseUrl}. Use formato: http://servidor:porta`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se temos um token em cache ainda válido
    const now = Date.now()
    const cachedAuth = tokenCache.get(integrationId)
    let authTokenData: any = null

    if (cachedAuth && cachedAuth.expires > now) {
      console.log('=== Usando token em cache ===')
      authTokenData = {
        authToken: cachedAuth.authToken,
        username: cachedAuth.username,
        dataSource: cachedAuth.dataSource,
        availableDataSources: cachedAuth.availableDataSources
      }
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
              errorMessage = 'URL do Guacamole não encontrada. Verifique se a URL está correta.'
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

        let responseText
        try {
          responseText = await loginResponse.text()
          console.log('Login response text:', responseText.substring(0, 200) + '...')
          
          // Tentar fazer parse como JSON primeiro (formato estruturado)
          try {
            authTokenData = JSON.parse(responseText)
            console.log('Auth response parsed as JSON:', {
              hasAuthToken: !!authTokenData.authToken,
              username: authTokenData.username,
              dataSource: authTokenData.dataSource,
              availableDataSources: authTokenData.availableDataSources
            })
            
            // Validar se tem o campo authToken
            if (!authTokenData.authToken) {
              throw new Error('Resposta não contém authToken')
            }
            
          } catch (jsonError) {
            // Fallback: assumir que a resposta é apenas o token (formato antigo)
            console.log('Response is not JSON, treating as plain token')
            authTokenData = {
              authToken: responseText.trim(),
              username: integration.username,
              dataSource: integration.directory || 'postgresql',
              availableDataSources: [integration.directory || 'postgresql']
            }
          }
          
        } catch (textError) {
          console.error('Error reading response text:', textError)
          return new Response(
            JSON.stringify({ 
              error: 'Erro ao ler resposta do servidor de autenticação'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Cache do token por 50 minutos (tokens do Guacamole geralmente expiram em 60 min)
        if (authTokenData && authTokenData.authToken && authTokenData.authToken.length > 10) {
          tokenCache.set(integrationId, {
            authToken: authTokenData.authToken,
            username: authTokenData.username,
            dataSource: authTokenData.dataSource,
            availableDataSources: authTokenData.availableDataSources || [authTokenData.dataSource],
            expires: now + (50 * 60 * 1000) // 50 minutos
          })
          console.log('Token cached successfully with data source:', authTokenData.dataSource)
        } else {
          console.warn('Token data inválido, não será cacheado')
        }
        
      } catch (fetchError) {
        console.error('Network error during login:', fetchError)
        return new Response(
          JSON.stringify({ 
            error: `Erro de conectividade: Não foi possível acessar ${tokenUrl}. Verifique se:
            • A URL está correta e acessível
            • O servidor Guacamole está online
            • Não há bloqueios de firewall`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }
    
    // Validar se os dados de autenticação foram obtidos
    if (!authTokenData || !authTokenData.authToken || authTokenData.authToken.trim() === '') {
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

    // Usar o dataSource retornado pelo servidor ou fallback para configuração
    const dataSource = authTokenData.dataSource || integration.directory || 'postgresql'
    console.log('Data source sendo usado:', dataSource)
    console.log('Data sources disponíveis:', authTokenData.availableDataSources)
    
    // Validar se o dataSource está disponível
    if (authTokenData.availableDataSources && 
        !authTokenData.availableDataSources.includes(dataSource)) {
      console.warn('Data source não está disponível:', dataSource)
      console.warn('Data sources disponíveis:', authTokenData.availableDataSources)
    }

    // Construir URL da API baseada no endpoint solicitado usando o padrão do Guacamole
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
        apiPath = `/api/session/data/${dataSource}/schema`
        break
      case 'history':
        apiPath = `/api/session/data/${dataSource}/history`
        break
      case 'token-status':
        // Para verificar status do token, fazemos uma chamada simples às conexões
        apiPath = `/api/session/data/${dataSource}/connections`
        break
      case 'tunnels':
        // Endpoint para túneis/conexões ativas
        apiPath = `/api/session/data/${dataSource}/activeConnections`
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
        } else if (endpoint.startsWith('tunnels/')) {
          const connectionId = endpoint.split('/')[1]
          // Criar túnel para conexão
          apiPath = `/api/session/tunnels/${encodeURIComponent(connectionId)}`
        } else {
          apiPath = `/api/session/data/${dataSource}/${endpoint}`
        }
    }

    // Para token-status, apenas retornamos que o token é válido se chegamos até aqui
    if (endpoint === 'token-status') {
      return new Response(
        JSON.stringify({ 
          isValid: true, 
          dataSource: dataSource,
          username: authTokenData.username,
          expiresIn: Math.max(0, Math.floor((tokenCache.get(integrationId)?.expires || Date.now()) - Date.now()) / 1000)
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construir URL final com token como parâmetro
    const apiUrl = `${baseUrl}${apiPath}?token=${encodeURIComponent(authTokenData.authToken)}`

    console.log('=== Making API call ===')
    console.log('API Path:', apiPath)
    console.log('Base URL:', baseUrl)
    console.log('Full URL (token masked):', `${baseUrl}${apiPath}?token=***MASKED***`)
    console.log('Token length:', authTokenData.authToken.length)

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
          • A API REST está habilitada no Guacamole`
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
          errorMessage = `Endpoint da API não encontrado: ${apiPath}. Verifique se a versão do Guacamole é compatível e se a API REST está habilitada.`
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