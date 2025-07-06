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
    const { method, params, integrationId } = await req.json()
    
    console.log('=== Zabbix Proxy Function ===')
    console.log('Method:', method)
    console.log('Integration ID:', integrationId)
    console.log('Params:', JSON.stringify(params, null, 2))

    // Verificar se temos o integration ID
    if (!integrationId) {
      console.error('Missing integration ID')
      return new Response(
        JSON.stringify({ 
          error: 'ID da integração é obrigatório',
          details: 'integrationId não fornecido na requisição'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Inicializar cliente do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching integration details...')
    
    // Buscar dados da integração
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('type', 'zabbix')
      .single()

    if (integrationError) {
      console.error('Integration fetch error:', integrationError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar configuração da integração',
          details: integrationError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!integration) {
      console.error('Integration not found')
      return new Response(
        JSON.stringify({ 
          error: 'Integração do Zabbix não encontrada',
          details: 'Verifique se a integração está configurada corretamente'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!integration.is_active) {
      console.error('Integration is inactive')
      return new Response(
        JSON.stringify({ 
          error: 'Integração do Zabbix está inativa',
          details: 'Ative a integração no painel de administração'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Integration found:', {
      name: integration.name,
      base_url: integration.base_url,
      hasApiToken: !!integration.api_token,
      hasCredentials: !!(integration.username && integration.password)
    })

    // Preparar URL da API
    let apiUrl = integration.base_url.replace(/\/$/, '')
    if (!apiUrl.endsWith('/api_jsonrpc.php')) {
      apiUrl = apiUrl + '/api_jsonrpc.php'
    }

    console.log('API URL:', apiUrl)

    // Preparar cabeçalhos da requisição
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Preparar corpo da requisição
    const requestBody: any = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1,  
    }

    // Adicionar autenticação
    if (integration.api_token) {
      console.log('Using API Token authentication')
      requestBody.auth = integration.api_token
    } else if (integration.username && integration.password) {
      console.log('Using username/password authentication')
      // Para métodos que não são login, precisamos primeiro fazer login
      if (method !== 'user.login') {
        console.log('Getting auth token first...')
        
        const loginResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'user.login',
            params: {
              user: integration.username,
              password: integration.password,
            },
            id: 1,
          }),
        })

        const loginData = await loginResponse.json()
        
        if (loginData.error) {
          console.error('Login error:', loginData.error)
          return new Response(
            JSON.stringify({ 
              error: 'Erro de autenticação no Zabbix',
              details: `${loginData.error.message || 'Erro desconhecido'} (Código: ${loginData.error.code || 'N/A'})`
            }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        if (!loginData.result) {
          console.error('Login failed - no token returned')
          return new Response(
            JSON.stringify({ 
              error: 'Falha na autenticação',
              details: 'Não foi possível obter token de autenticação'
            }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        requestBody.auth = loginData.result
        console.log('Auth token obtained successfully')
      }
    } else {
      console.error('No authentication method configured')
      return new Response(
        JSON.stringify({ 
          error: 'Configuração de autenticação incompleta',
          details: 'Configure um API Token ou credenciais de usuário'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Making request to Zabbix API...')
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    // Fazer requisição para o Zabbix
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    })

    console.log('Zabbix API response status:', response.status)

    if (!response.ok) {
      console.error('HTTP error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response body:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Erro HTTP ${response.status}`,
          details: `${response.statusText}: ${errorText}`
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('Zabbix API response:', JSON.stringify(data, null, 2))

    if (data.error) {
      console.error('Zabbix API error:', data.error)
      return new Response(
        JSON.stringify({ 
          error: `Erro da API do Zabbix: ${data.error.message || 'Erro desconhecido'}`,
          details: `Código: ${data.error.code || 'N/A'}, Dados: ${data.error.data || 'N/A'}`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Success! Returning result')
    return new Response(
      JSON.stringify({ result: data.result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message || 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})