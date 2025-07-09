
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

      console.log('Received auth data:', {
        url: grafanaUrl,
        auth_type: authType,
        hasApiToken: !!(body.api_token),
        hasUsername: !!(body.username),
        hasPassword: !!(body.password)
      });

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
        console.error('Invalid authentication data received:', {
          auth_type: authType,
          hasApiToken: !!(body.api_token),
          hasUsername: !!(body.username),
          hasPassword: !!(body.password)
        });
        return new Response(
          JSON.stringify({ 
            error: 'Invalid authentication data', 
            message: 'Forneça API Token ou usuário/senha válidos.',
            details: 'Configure as credenciais no painel de administração'
          }),
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
          JSON.stringify({ 
            error: 'Missing parameters', 
            message: 'URL e parâmetros de autenticação são obrigatórios' 
          }),
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
        authType = 'basic';
      } catch (e) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid auth format', 
            message: 'Formato de autenticação inválido' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (!grafanaUrl || !authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          message: 'URL e credenciais são obrigatórias' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Proxying request to:', grafanaUrl);
    console.log('Auth type:', authType);
    console.log('Auth header present:', !!authHeader);

    const requestHeaders: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Grafana-Proxy/1.0'
    };

    console.log('Request headers:', Object.keys(requestHeaders));

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
    console.log('Grafana response headers:', Object.fromEntries(grafanaResponse.headers.entries()));

    // Se a resposta não for OK, incluir mais detalhes do erro
    if (!grafanaResponse.ok) {
      console.error('Grafana API error:', {
        status: grafanaResponse.status,
        statusText: grafanaResponse.statusText,
        data: responseData,
        headers: Object.fromEntries(grafanaResponse.headers.entries())
      });

      // Customizar mensagem de erro baseada no status
      let errorMessage = responseData.message || grafanaResponse.statusText;
      if (grafanaResponse.status === 401) {
        errorMessage = authType === 'token' ? 
          'Token de API inválido ou expirado. Verifique o token no painel de administração.' :
          'Credenciais inválidas. Verifique usuário e senha no painel de administração.';
      } else if (grafanaResponse.status === 403) {
        errorMessage = 'Acesso negado. Verifique as permissões do usuário/token no Grafana.';
      } else if (grafanaResponse.status === 404) {
        errorMessage = 'Endpoint não encontrado. Verifique a URL do Grafana.';
      } else if (grafanaResponse.status >= 500) {
        errorMessage = 'Erro no servidor Grafana. Verifique se o serviço está disponível.';
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
        message: 'Erro interno do proxy. Verifique os logs e configuração.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
