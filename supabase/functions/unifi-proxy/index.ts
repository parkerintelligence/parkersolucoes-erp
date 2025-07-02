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
    console.log('=== UNIFI Proxy Request Started ===');
    
    const body = await req.json();
    const { config, endpoint, method = 'GET', body: requestBody } = body;
    
    console.log('Request body:', { 
      endpoint, 
      method,
      hasConfig: !!config,
      hasBody: !!requestBody
    });

    if (!config || !endpoint) {
      console.error('Missing required fields:', { hasConfig: !!config, endpoint: !!endpoint });
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios: config e endpoint' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { base_url, username, password, site = 'default' } = config;

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

    // Preparar URL da API UNIFI
    let apiUrl = base_url.replace(/\/$/, '');
    if (!apiUrl.startsWith('http')) {
      apiUrl = 'https://' + apiUrl;
    }
    
    const unifiApiUrl = `${apiUrl}/api/s/${site}/${endpoint}`;
    console.log('UNIFI API URL:', unifiApiUrl);

    // Primeiro, fazer login para obter o cookie de sessão
    const loginUrl = `${apiUrl}/api/login`;
    console.log('Attempting login to:', loginUrl);

    const loginPayload = {
      username,
      password,
      remember: false
    };

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-UNIFI-Proxy/1.0',
      },
      body: JSON.stringify(loginPayload),
    });

    console.log('Login response:', {
      status: loginResponse.status,
      statusText: loginResponse.statusText,
      ok: loginResponse.ok
    });

    if (!loginResponse.ok) {
      const loginError = await loginResponse.text();
      console.error('Login failed:', loginError);
      return new Response(JSON.stringify({
        error: `Falha na autenticação UNIFI: ${loginResponse.status}`,
        details: loginError.substring(0, 200)
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrair cookies de sessão
    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie headers:', setCookieHeaders);

    if (!setCookieHeaders) {
      return new Response(JSON.stringify({
        error: 'Falha na autenticação UNIFI',
        details: 'Nenhum cookie de sessão recebido'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fazer requisição para o endpoint solicitado
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout triggered');
      controller.abort();
    }, 30000);

    try {
      console.log('Making authenticated request to UNIFI...');
      
      const response = await fetch(unifiApiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': setCookieHeaders,
          'User-Agent': 'Supabase-UNIFI-Proxy/1.0',
        },
        body: requestBody ? JSON.stringify(requestBody) : undefined,
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
          error: 'Resposta inválida do UNIFI',
          details: 'Não foi possível processar a resposta JSON'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Parsed response:', { 
        hasData: !!data.data,
        hasMeta: !!data.meta,
        dataLength: Array.isArray(data.data) ? data.data.length : 'not array'
      });

      // UNIFI API retorna dados em data.data
      const result = data.data || data;

      console.log('Success! Returning result...');
      return new Response(JSON.stringify({ result }), {
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
          error: 'Timeout na conexão com o UNIFI (30s)',
          details: 'Verifique se o controlador UNIFI está acessível'
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        error: 'Erro de conectividade com o UNIFI',
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