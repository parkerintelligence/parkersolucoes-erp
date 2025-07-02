import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('=== Zabbix Proxy Request Started ===');
    
    const body = await req.json();
    const { config, method, params, id = 1 } = body;
    
    console.log('Request body:', { 
      method, 
      params: params ? Object.keys(params) : null,
      hasConfig: !!config,
      id
    });

    if (!config || !method) {
      console.error('Missing required fields:', { hasConfig: !!config, method: !!method });
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios: config e method' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { base_url, username, password } = config;

    if (!base_url || !username || !password) {
      console.error('Missing config fields:', { 
        hasBaseUrl: !!base_url, 
        hasUsername: !!username, 
        hasPassword: !!password 
      });
      return new Response(JSON.stringify({ 
        error: 'Configuração incompleta: base_url, username e password são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar URL da API Zabbix
    let apiUrl = base_url.replace(/\/$/, '');
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
          'User-Agent': 'Supabase-Zabbix-Proxy/1.0',
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