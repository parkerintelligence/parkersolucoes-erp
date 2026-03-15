import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { integration_id, endpoint, method = 'GET', data } = await req.json()

    console.log(`📥 Hostinger Proxy Request: ${method} ${endpoint}`)

    if (!integration_id || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'integration_id e endpoint são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Interceptar QUALQUER tentativa de listar snapshots (API Hostinger não suporta)
    // Verifica tanto /snapshots no final quanto /snapshots/ em qualquer lugar do path
    if (endpoint.includes('/snapshots') && method.toUpperCase() === 'GET') {
      console.log('🚫 INTERCEPTADO: Tentativa de listar snapshots bloqueada - API não suportada')
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [],
          status: 200,
          note: 'Listagem de snapshots não suportada pela API Hostinger' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar a integração do Hostinger
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('type', 'hostinger')
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      console.error('Integration error:', integrationError)
      return new Response(
        JSON.stringify({ error: 'Integração Hostinger não encontrada ou inativa' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!integration.api_token) {
      return new Response(
        JSON.stringify({ error: 'Token da API Hostinger não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determinar a URL base correta baseada no endpoint
    let url: string;
    
    if (endpoint.startsWith('/api/dns/') || endpoint.startsWith('/api/domains/')) {
      // DNS e Domains usam base diferente
      url = `https://developers.hostinger.com${endpoint}`;
    } else {
      // VPS endpoints
      if (!integration.base_url.includes('/virtual-machines')) {
        const baseUrl = integration.base_url || 'https://developers.hostinger.com/api/vps/v1'
        url = `${baseUrl}${endpoint}`
      } else {
        if (endpoint === '/virtual-machines') {
          url = integration.base_url;
        } else {
          const baseUrl = integration.base_url.replace('/virtual-machines', '');
          url = `${baseUrl}${endpoint}`;
        }
      }
    }

    console.log('Making request to:', url)

    // Configurar headers para a API do Hostinger
    const headers = {
      'Authorization': `Bearer ${integration.api_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // Fazer requisição para a API do Hostinger
    const requestOptions: RequestInit = {
      method,
      headers
    }

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = JSON.stringify(data)
    }

    const response = await fetch(url, requestOptions)
    const responseText = await response.text()

    console.log('Hostinger API response status:', response.status)
    console.log('Hostinger API response:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro na API do Hostinger', 
          status: response.status,
          data: responseData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseData,
        status: response.status 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in hostinger-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})