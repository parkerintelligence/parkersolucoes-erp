
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let grafanaUrl: string;
    let username: string;
    let password: string;

    if (req.method === 'POST') {
      const body = await req.json();
      grafanaUrl = body.url;
      username = body.username;
      password = body.password;
    } else {
      // Fallback para método GET (compatibilidade)
      const url = new URL(req.url);
      grafanaUrl = url.searchParams.get('url');
      const authHeader = url.searchParams.get('auth');
      
      if (!grafanaUrl || !authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing url or auth parameter' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Decodificar base64 auth
      try {
        const decoded = atob(authHeader);
        [username, password] = decoded.split(':');
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

    if (!grafanaUrl || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: url, username, password' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Proxying request to:', grafanaUrl);
    console.log('Using username:', username);

    // Criar header de autenticação Basic
    const authToken = btoa(`${username}:${password}`);

    const grafanaResponse = await fetch(grafanaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const responseText = await grafanaResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    console.log('Grafana response status:', grafanaResponse.status);
    console.log('Grafana response:', responseData);

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
      JSON.stringify({ error: 'Proxy request failed', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
