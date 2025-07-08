
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let grafanaUrl: string;
    let authHeader: string;
    let authType: string = 'basic';

    if (req.method === 'POST') {
      const body = await req.json();
      grafanaUrl = body.url;
      authType = body.auth_type || 'basic';

      if (authType === 'token' && body.api_token) {
        // Usar Bearer token para API Token
        authHeader = `Bearer ${body.api_token}`;
        console.log('Using Bearer token authentication');
      } else if (authType === 'basic' && body.username && body.password) {
        // Usar Basic Auth para usuário/senha
        const credentials = btoa(`${body.username}:${body.password}`);
        authHeader = `Basic ${credentials}`;
        console.log('Using Basic authentication for user:', body.username);
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication data. Provide either api_token or username/password.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Fallback para método GET (compatibilidade)
      const url = new URL(req.url);
      grafanaUrl = url.searchParams.get('url');
      const authParam = url.searchParams.get('auth');
      
      if (!grafanaUrl || !authParam) {
        return new Response(
          JSON.stringify({ error: 'Missing url or auth parameter' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        const decoded = atob(authParam);
        const [username, password] = decoded.split(':');
        const credentials = btoa(`${username}:${password}`);
        authHeader = `Basic ${credentials}`;
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid auth format' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (!grafanaUrl || !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: url and authentication' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Proxying request to:', grafanaUrl);
    console.log('Auth type:', authType);

    const requestHeaders: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Adicionar User-Agent para evitar bloqueios
    requestHeaders['User-Agent'] = 'Grafana-Proxy/1.0';

    const grafanaResponse = await fetch(grafanaUrl, {
      method: 'GET',
      headers: requestHeaders,
    });

    const responseText = await grafanaResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText, raw: responseText };
    }

    console.log('Grafana response status:', grafanaResponse.status);
    console.log('Grafana response data:', responseData);

    // Se a resposta não for OK, incluir mais detalhes do erro
    if (!grafanaResponse.ok) {
      console.error('Grafana API error:', {
        status: grafanaResponse.status,
        statusText: grafanaResponse.statusText,
        data: responseData
      });

      // Customizar mensagem de erro baseada no status
      let errorMessage = responseData.message || grafanaResponse.statusText;
      if (grafanaResponse.status === 401) {
        errorMessage = 'Credenciais inválidas ou expiradas';
      } else if (grafanaResponse.status === 403) {
        errorMessage = 'Acesso negado - verifique permissões do usuário';
      } else if (grafanaResponse.status === 404) {
        errorMessage = 'Endpoint não encontrado - verifique a URL do Grafana';
      }

      responseData.message = errorMessage;
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: grafanaResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Grafana proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Proxy request failed', 
        details: error.message,
        message: 'Erro interno do proxy - verifique os logs'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
