import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Zabbix Direct Proxy Request Started ===');
    
    const body = await req.json();
    const { integrationId, method, params, id = 1 } = body;
    
    console.log('Request body:', { 
      integrationId, 
      method, 
      params: params ? Object.keys(params) : null,
      id
    });

    if (!integrationId || !method) {
      console.error('Missing required fields:', { integrationId: !!integrationId, method: !!method });
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios: integrationId e method' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ 
        error: 'Configuração do servidor incompleta' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configuração do Zabbix
    console.log('Fetching integration with ID:', integrationId);
    
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('base_url, username, password, api_token')
      .eq('id', integrationId)
      .eq('type', 'zabbix')
      .eq('is_active', true)
      .single();

    if (integrationError) {
      console.error('Database error:', integrationError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao buscar configuração da integração',
        details: integrationError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!integration) {
      console.error('Integration not found or inactive');
      return new Response(JSON.stringify({ 
        error: 'Integração Zabbix não encontrada ou inativa' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Integration found:', {
      base_url: integration.base_url,
      username: integration.username,
      hasPassword: !!integration.password,
      hasApiToken: !!integration.api_token
    });

    // Preparar URL da API Zabbix
    let apiUrl = integration.base_url.replace(/\/$/, '');
    if (!apiUrl.startsWith('http')) {
      apiUrl = 'https://' + apiUrl;
    }
    
    const zabbixApiUrl = `${apiUrl}/api_jsonrpc.php`;
    console.log('Zabbix API URL:', zabbixApiUrl);

    // Preparar payload JSON-RPC
    const payload = {
      jsonrpc: "2.0",
      method,
      params: params || {},
      id
    };

    // Se temos auth token no params, usar ele, senão usar o da integração
    if (integration.api_token && !params?.auth) {
      payload.params.auth = integration.api_token;
    }

    console.log('Zabbix payload:', JSON.stringify(payload, null, 2));

    // Fazer requisição para o Zabbix
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout triggered');
      controller.abort();
    }, 30000);

    try {
      console.log('Making request to Zabbix...');
      
      const response = await fetch(zabbixApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Zabbix-Direct-Proxy/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text preview:', responseText.substring(0, 500));

      if (!response.ok) {
        console.error('HTTP Error details:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500)
        });
        
        return new Response(JSON.stringify({
          error: `Erro HTTP ${response.status}: ${response.statusText}`,
          details: responseText.substring(0, 200)
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        return new Response(JSON.stringify({
          error: 'Resposta inválida do Zabbix',
          details: 'Não foi possível processar a resposta JSON'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Parsed response:', { 
        hasResult: !!data.result,
        hasError: !!data.error,
        resultType: typeof data.result,
        errorCode: data.error?.code
      });

      if (data.error) {
        console.error('Zabbix API Error:', data.error);
        return new Response(JSON.stringify({
          error: 'Erro da API Zabbix',
          details: data.error.message || data.error.data || 'Erro desconhecido',
          code: data.error.code
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Success! Returning result...');
      return new Response(JSON.stringify({ result: data.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message
      });
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return new Response(JSON.stringify({
          error: 'Timeout na conexão com o Zabbix (30s)',
          details: 'Verifique se o servidor Zabbix está acessível'
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        error: 'Erro de conectividade com o Zabbix',
        details: fetchError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('=== Edge Function Error ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message,
      type: error.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});