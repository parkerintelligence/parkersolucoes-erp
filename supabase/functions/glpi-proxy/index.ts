import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache de tokens de sessão em memória por integração
const sessionCache = new Map<string, { 
  sessionToken: string, 
  expires: number 
}>()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { endpoint, method = 'GET', data, integrationId } = await req.json()
    
    console.log('=== GLPI Proxy Function Start ===')
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
      .eq('type', 'glpi')
      .single()

    if (integrationError || !integration) {
      console.error('Integration error:', integrationError)
      return new Response(
        JSON.stringify({ 
          error: 'Integração do GLPI não encontrada'
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
          error: 'Integração do GLPI está inativa'
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
      has_api_token: !!integration.api_token,
      has_username: !!integration.username,
      has_password: !!integration.password
    })

    // Validar configurações obrigatórias
    if (!integration.api_token) {
      return new Response(
        JSON.stringify({ 
          error: 'App Token não configurado. Configure o App Token no GLPI.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!integration.password && (!integration.username || !integration.password)) {
      return new Response(
        JSON.stringify({ 
          error: 'Credenciais não configuradas. Configure User Token ou usuário/senha.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar URL da API - corrigir URL base
    let baseUrl = integration.base_url.replace(/\/+$/, '').replace(/\/apirest\.php$/, '')
    
    // Garantir que a URL seja válida
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

    // Verificar se temos um token de sessão em cache válido
    const now = Date.now()
    const cachedSession = sessionCache.get(integrationId)
    let sessionToken: string | null = null

    if (cachedSession && cachedSession.expires > now) {
      console.log('=== Usando session token em cache ===')
      sessionToken = cachedSession.sessionToken
    } else {
      console.log('=== Inicializando nova sessão GLPI ===')
      
      // Preparar headers de autenticação
      let authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'App-Token': integration.api_token,
      }

      try {
        let response: Response
        
        // Método 1: Tentar com User Token se disponível
        if (integration.password && !integration.username) {
          console.log('Tentando autenticação com User Token...')
          authHeaders['Authorization'] = `user_token ${integration.password}`
          
          response = await fetch(`${baseUrl}/apirest.php/initSession`, {
            method: 'POST',
            headers: authHeaders,
          })
        } else {
          // Método 2: Basic Auth
          console.log('Tentando autenticação com Basic Auth...')
          const credentials = btoa(`${integration.username}:${integration.password}`)
          authHeaders['Authorization'] = `Basic ${credentials}`
          
          response = await fetch(`${baseUrl}/apirest.php/initSession`, {
            method: 'POST',
            headers: authHeaders,
          })
        }

        console.log('Session init response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Session init failed:', response.status, errorText)
          
          let errorMessage = 'Erro de autenticação no GLPI'
          
          switch (response.status) {
            case 401:
              errorMessage = 'Credenciais inválidas. Verifique App Token, User Token ou usuário/senha.'
              break
            case 400:
              errorMessage = 'Erro na requisição. Verifique se o App Token e credenciais estão corretos.'
              break
            case 500:
              errorMessage = 'Erro interno do servidor GLPI. Verifique se o serviço está funcionando.'
              break
            default:
              errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              details: {
                status: response.status,
                statusText: response.statusText,
                response: errorText.substring(0, 500)
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const sessionData = await response.json()
        console.log('Session data received:', { hasSessionToken: !!sessionData.session_token })

        if (!sessionData.session_token) {
          return new Response(
            JSON.stringify({ 
              error: 'Session token não retornado pelo GLPI'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        sessionToken = sessionData.session_token

        // Cache do token por 50 minutos
        sessionCache.set(integrationId, {
          sessionToken: sessionToken,
          expires: now + (50 * 60 * 1000) // 50 minutos
        })

        console.log('Session token cached successfully')
        
      } catch (fetchError) {
        console.error('Network error during session init:', fetchError)
        return new Response(
          JSON.stringify({ 
            error: `Erro de conectividade: Não foi possível acessar ${baseUrl}/apirest.php/initSession. Verifique se:
            • A URL está correta e acessível
            • O servidor GLPI está online
            • Não há bloqueios de firewall
            • A API REST está habilitada no GLPI`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Para endpoint de inicialização de sessão, retornar apenas o token
    if (endpoint === 'initSession') {
      return new Response(
        JSON.stringify({ 
          session_token: sessionToken,
          success: true
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
      case 'tickets':
        apiPath = '/apirest.php/Ticket?range=0-9999'
        break
      case 'computers':
        apiPath = '/apirest.php/Computer?range=0-9999'
        break
      case 'users':
        apiPath = '/apirest.php/User?range=0-9999'
        break
      case 'problems':
        apiPath = '/apirest.php/Problem?range=0-9999'
        break
      case 'changes':
        apiPath = '/apirest.php/Change?range=0-9999'
        break
      case 'entities':
        apiPath = '/apirest.php/Entity?range=0-9999'
        break
      case 'locations':
        apiPath = '/apirest.php/Location?range=0-9999'
        break
      case 'groups':
        apiPath = '/apirest.php/Group?range=0-9999'
        break
      default:
        if (endpoint.startsWith('tickets/')) {
          const ticketId = endpoint.split('/')[1]
          apiPath = `/apirest.php/Ticket/${encodeURIComponent(ticketId)}`
        } else if (endpoint.startsWith('users/')) {
          const userId = endpoint.split('/')[1]
          apiPath = `/apirest.php/User/${encodeURIComponent(userId)}`
        } else {
          apiPath = `/apirest.php/${endpoint}`
        }
    }

    // Construir URL final
    const apiUrl = `${baseUrl}${apiPath}`

    console.log('=== Making API call ===')
    console.log('API Path:', apiPath)
    console.log('Full URL:', apiUrl)
    console.log('HTTP Method:', method)
    console.log('Request Body:', data ? JSON.stringify(data, null, 2) : 'N/A')

    // Log detalhado para criação de tickets
    if (method === 'POST' && endpoint === 'Ticket') {
      console.log('📮 [GLPI Proxy] === CRIANDO TICKET ===')
      console.log('📮 [GLPI Proxy] Payload completo recebido:', JSON.stringify(data, null, 2))
      
      if (data && typeof data === 'object') {
        const input = data.input || data
        console.log('📮 [GLPI Proxy] Dados do ticket:')
        console.log('  - name:', input.name)
        console.log('  - content:', input.content)
        console.log('  - content.length:', input.content?.length || 0)
        console.log('  - entities_id:', input.entities_id)
        console.log('  - users_id_assign:', input.users_id_assign)
        console.log('  - users_id_requester:', input.users_id_requester)
        console.log('  - priority:', input.priority)
        console.log('  - urgency:', input.urgency)
        console.log('  - impact:', input.impact)
        console.log('  - type:', input.type)
        console.log('  - itilcategories_id:', input.itilcategories_id)
      }
    }

    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'App-Token': integration.api_token,
        'Session-Token': sessionToken,
      },
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      // GLPI API requires data to be wrapped in "input" field
      const payload = { input: data }
      requestOptions.body = JSON.stringify(payload)
      console.log('🔍 [GLPI Proxy] Payload final sendo enviado para API GLPI:', JSON.stringify(payload, null, 2))
      console.log('🔍 [GLPI Proxy] Verificação dos campos principais:')
      console.log('   - name:', data.name)
      console.log('   - content:', data.content)
      console.log('   - entities_id:', data.entities_id)
      console.log('   - users_id_assign:', data.users_id_assign)
      console.log('   - users_id_requester:', data.users_id_requester)
    }

    let apiResponse: Response
    try {
      apiResponse = await fetch(apiUrl, requestOptions)
    } catch (fetchError) {
      console.error('Network error during API call:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: `Erro de conectividade com a API: Não foi possível acessar ${apiUrl}. Verifique se:
          • O servidor GLPI está online
          • A URL está correta: ${baseUrl}
          • Não há bloqueios de firewall
          • A API REST está habilitada no GLPI`
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
      console.error('❌ API error response:', errorText)
      console.error('❌ API error status:', apiResponse.status)
      console.error('❌ API error headers:', Object.fromEntries(apiResponse.headers.entries()))
      
      // Tentar fazer parse do erro para obter mais detalhes
      try {
        const errorData = JSON.parse(errorText)
        console.error('❌ Parsed error data:', errorData)
        
        // Verificar se é erro específico de formato
        if (errorData && typeof errorData === 'object') {
          if (errorData.length && errorData[0] && errorData[0].message) {
            console.error('❌ GLPI error message:', errorData[0].message)
          }
        }
      } catch (parseError) {
        console.error('❌ Erro não é JSON válido')
      }
      
      // Se for erro 401, limpar cache da sessão
      if (apiResponse.status === 401) {
        console.log('Session token inválido, removendo do cache')
        sessionCache.delete(integrationId)
      }
      
      // Tratamento especial para erros 400 na criação de tickets
      if (apiResponse.status === 400 && apiPath.toLowerCase().includes('ticket')) {
        console.log('Erro 400 detectado em endpoint de ticket - analisando detalhes')
        try {
          const errorData = JSON.parse(errorText)
          console.log('Error data parsed:', errorData)
          
          if (Array.isArray(errorData) && errorData.length >= 2) {
            const [errorCode, errorMessage] = errorData
            console.error('GLPI API Error Details:', { errorCode, errorMessage })
            
            return new Response(
              JSON.stringify({ 
                error: `GLPI API Error: ${errorCode}`,
                details: {
                  code: errorCode,
                  message: errorMessage,
                  status: apiResponse.status,
                  statusText: apiResponse.statusText,
                  url: apiUrl
                }
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        } catch (parseError) {
          console.error('Não foi possível parsear erro da API GLPI:', parseError)
          console.error('Raw error text that failed to parse:', errorText)
        }
      }
      
      let errorMessage = 'Erro da API GLPI'
      
      switch (apiResponse.status) {
        case 401:
          errorMessage = 'Session token expirado ou inválido. O sistema irá tentar obter um novo token na próxima requisição.'
          break
        case 403:
          errorMessage = 'Acesso negado. Verifique se o usuário tem permissões adequadas no GLPI.'
          break
        case 404:
          errorMessage = `Endpoint não encontrado: ${apiPath}. Verifique se a versão do GLPI é compatível.`
          break
        default:
          errorMessage = `Erro da API GLPI: ${apiResponse.status} - ${apiResponse.statusText}`
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
      console.log('Raw API response (first 500 chars):', responseText.substring(0, 500))
      
      if (responseText.trim() === '') {
        result = {}
        console.log('Empty response - returning empty object')
      } else {
        result = JSON.parse(responseText)
        console.log('Parsed result type:', typeof result)
        console.log('Parsed result (structure):', Array.isArray(result) ? `Array[${result.length}]` : typeof result)
        if (Array.isArray(result) && result.length > 0) {
          console.log('First result item keys:', Object.keys(result[0] || {}))
        }
      }
    } catch (parseError) {
      console.error('Error parsing API response:', parseError)
      console.error('Original response text:', responseText)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar resposta da API GLPI. Resposta não é um JSON válido.'
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
    console.log('Session cache status:', sessionCache.has(integrationId) ? 'cached' : 'not cached')

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