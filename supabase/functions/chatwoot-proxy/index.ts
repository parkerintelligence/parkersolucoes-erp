import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatwootProxyRequest {
  integrationId: string;
  endpoint: string;
  method?: string;
  body?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Chatwoot proxy v2.0 - WITH ACCEPT HEADER:', req.method, req.url);
    console.log('Authorization header present:', !!req.headers.get('Authorization'));
    
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Create admin client for user verification
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Authenticating user with JWT...');
    
    // Verify the JWT token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error('❌ Auth error:', userError.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!user) {
      console.error('❌ No user found');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Now create client with user context for database queries
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    const { integrationId, endpoint, method = 'GET', body } = await req.json() as ChatwootProxyRequest;

    console.log('Chatwoot Proxy - Request:', { integrationId, endpoint, method, userId: user.id });

    // Check if user is master using the new user_roles table
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master')
      .single();

    const isMaster = !!userRole;
    console.log('User is master:', isMaster);

    // Fetch integration from database with cache bypass
    // Masters can access all integrations, regular users only their own
    let query = supabaseClient
      .from('integrations')
      .select('base_url, api_token')
      .eq('id', integrationId)
      .eq('type', 'chatwoot');

    // Only filter by user_id if not master
    if (!isMaster) {
      query = query.eq('user_id', user.id);
    }

    const { data: integration, error: integrationError } = await query.single();
    
    console.log('Integration fetched from DB:', {
      id: integrationId,
      base_url: integration?.base_url,
      has_token: !!integration?.api_token
    });

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integração Chatwoot não encontrada' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build Chatwoot API URL with intelligent path detection
    let baseApiUrl = integration.base_url.replace(/\/$/, '');
    
    // Remove /login suffix if present but preserve /app path
    baseApiUrl = baseApiUrl.replace(/\/login$/, '');
    baseApiUrl = baseApiUrl.replace(/\/app\/login$/, '/app');
    
    // Remove /dashboard or /accounts paths but preserve /app
    baseApiUrl = baseApiUrl.replace(/\/(dashboard|accounts).*$/, '');
    
    // Detect if we need /app in the path
    // If URL contains /app/ or ends with /app, we should use /app/api/v1
    const needsAppPath = baseApiUrl.includes('/app');
    
    // Helper function to build URL with or without /app
    const buildApiUrl = (useAppPath: boolean): string => {
      let url = baseApiUrl.replace(/\/$/, '');
      
      // Remove any existing /app if we're not using it
      if (!useAppPath) {
        url = url.replace(/\/app$/, '');
      }
      
      // Add /app if needed
      if (useAppPath && !url.endsWith('/app')) {
        url = url + '/app';
      }
      
      // Add /api/v1
      url = url + '/api/v1';
      
      return url;
    };
    
    // Build both possible URLs
    const urlWithApp = buildApiUrl(true) + endpoint;
    const urlWithoutApp = buildApiUrl(false) + endpoint;
    const primaryUrl = needsAppPath ? urlWithApp : urlWithoutApp;
    const alternativeUrl = needsAppPath ? urlWithoutApp : urlWithApp;

    console.log('Chatwoot Proxy - Base URL original:', integration.base_url);
    console.log('Chatwoot Proxy - Primary URL:', primaryUrl);
    console.log('Chatwoot Proxy - Alternative URL:', alternativeUrl);

    // Helper function to try a request with specific URL and headers
    const tryRequest = async (url: string, headers: Record<string, string>): Promise<Response> => {
      return await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
    };

    // Try multiple authentication approaches with both URL patterns
    let chatwootResponse: Response | null = null;
    let lastError: string | null = null;
    let successfulUrl: string | null = null;
    
    // Attempt 1: api_access_token header with primary URL
    const headers1: Record<string, string> = {
      'Accept': 'application/json',
      'api_access_token': integration.api_token,
      'User-Agent': 'Lovable-Chatwoot-Proxy/1.0',
    };
    
    if (method !== 'GET') {
      headers1['Content-Type'] = 'application/json';
    }
    
    console.log('🔑 Attempt 1 - api_access_token (primary URL):', primaryUrl);
    
    try {
      chatwootResponse = await tryRequest(primaryUrl, headers1);
      console.log('Attempt 1 status:', chatwootResponse.status);
      if (chatwootResponse.ok || (chatwootResponse.status !== 401 && chatwootResponse.status !== 406)) {
        successfulUrl = primaryUrl;
      }
    } catch (error) {
      lastError = `Attempt 1 failed: ${error.message}`;
      console.error(lastError);
    }

    // Attempt 2: api_access_token header with alternative URL (if primary failed with 406)
    if (!chatwootResponse || chatwootResponse.status === 406) {
      console.log('🔑 Attempt 2 - api_access_token (alternative URL):', alternativeUrl);
      
      try {
        chatwootResponse = await tryRequest(alternativeUrl, headers1);
        console.log('Attempt 2 status:', chatwootResponse.status);
        if (chatwootResponse.ok || (chatwootResponse.status !== 401 && chatwootResponse.status !== 406)) {
          successfulUrl = alternativeUrl;
        }
      } catch (error) {
        lastError = `Attempt 2 failed: ${error.message}`;
        console.error(lastError);
      }
    }

    // Attempt 3: Authorization Bearer with primary URL
    if (!chatwootResponse || chatwootResponse.status === 401 || chatwootResponse.status === 406) {
      console.log('🔑 Attempt 3 - Authorization Bearer (primary URL)...');
      
      const headers2: Record<string, string> = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${integration.api_token}`,
        'User-Agent': 'Lovable-Chatwoot-Proxy/1.0',
      };
      
      if (method !== 'GET') {
        headers2['Content-Type'] = 'application/json';
      }
      
      try {
        chatwootResponse = await tryRequest(primaryUrl, headers2);
        console.log('Attempt 3 status:', chatwootResponse.status);
        if (chatwootResponse.ok || (chatwootResponse.status !== 401 && chatwootResponse.status !== 406)) {
          successfulUrl = primaryUrl;
        }
      } catch (error) {
        lastError = `Attempt 3 failed: ${error.message}`;
        console.error(lastError);
      }
    }

    // Attempt 4: Authorization Bearer with alternative URL
    if (!chatwootResponse || chatwootResponse.status === 406) {
      console.log('🔑 Attempt 4 - Authorization Bearer (alternative URL)...');
      
      const headers2: Record<string, string> = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${integration.api_token}`,
        'User-Agent': 'Lovable-Chatwoot-Proxy/1.0',
      };
      
      if (method !== 'GET') {
        headers2['Content-Type'] = 'application/json';
      }
      
      try {
        chatwootResponse = await tryRequest(alternativeUrl, headers2);
        console.log('Attempt 4 status:', chatwootResponse.status);
        if (chatwootResponse.ok || (chatwootResponse.status !== 401 && chatwootResponse.status !== 406)) {
          successfulUrl = alternativeUrl;
        }
      } catch (error) {
        lastError = `Attempt 4 failed: ${error.message}`;
        console.error(lastError);
      }
    }

    // Attempt 5: Without Accept header with primary URL
    if (!chatwootResponse || chatwootResponse.status === 401 || chatwootResponse.status === 406) {
      console.log('🔑 Attempt 5 - Without Accept header (primary URL)...');
      
      const headers3: Record<string, string> = {
        'api_access_token': integration.api_token,
        'User-Agent': 'Lovable-Chatwoot-Proxy/1.0',
      };
      
      if (method !== 'GET') {
        headers3['Content-Type'] = 'application/json';
      }
      
      try {
        chatwootResponse = await tryRequest(primaryUrl, headers3);
        console.log('Attempt 5 status:', chatwootResponse.status);
        if (chatwootResponse.ok || (chatwootResponse.status !== 401 && chatwootResponse.status !== 406)) {
          successfulUrl = primaryUrl;
        }
      } catch (error) {
        lastError = `Attempt 5 failed: ${error.message}`;
        console.error(lastError);
      }
    }

    // Attempt 6: Without Accept header with alternative URL
    if (!chatwootResponse || chatwootResponse.status === 406) {
      console.log('🔑 Attempt 6 - Without Accept header (alternative URL)...');
      
      const headers3: Record<string, string> = {
        'api_access_token': integration.api_token,
        'User-Agent': 'Lovable-Chatwoot-Proxy/1.0',
      };
      
      if (method !== 'GET') {
        headers3['Content-Type'] = 'application/json';
      }
      
      try {
        chatwootResponse = await tryRequest(alternativeUrl, headers3);
        console.log('Attempt 6 status:', chatwootResponse.status);
        if (chatwootResponse.ok) {
          successfulUrl = alternativeUrl;
        }
      } catch (error) {
        lastError = `Attempt 6 failed: ${error.message}`;
        console.error(lastError);
      }
    }

    // If all attempts failed, throw error
    if (!chatwootResponse) {
      throw new Error(lastError || 'All authentication attempts failed');
    }

    console.log('Chatwoot Proxy - Response status:', chatwootResponse.status);
    console.log('Chatwoot Proxy - Successful URL:', successfulUrl || 'none');
    console.log('Chatwoot Proxy - Response headers:', Object.fromEntries(chatwootResponse.headers.entries()));

    // Check if response is JSON
    const contentType = chatwootResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await chatwootResponse.text();
      console.error('Chatwoot API returned non-JSON response:', textResponse.substring(0, 500));
      
      // Generate detailed error information with specific guidance
      const possibleCauses = [];
      const actionSteps = [];
      
      if (chatwootResponse.status === 401) {
        possibleCauses.push('Token de API inválido ou expirado');
        possibleCauses.push('Token sem permissões de Administrator ou Agent');
        actionSteps.push('1. Faça login no Chatwoot');
        actionSteps.push('2. Vá em Profile Settings > Access Token');
        actionSteps.push('3. Gere um NOVO token');
        actionSteps.push('4. Atualize o token na configuração');
      } else if (chatwootResponse.status === 404) {
        possibleCauses.push('URL do endpoint incorreta');
        possibleCauses.push('Versão da API incorreta');
        actionSteps.push('Verifique se a URL base está correta');
        if (successfulUrl) {
          actionSteps.push(`Tente usar: ${successfulUrl.replace(endpoint, '')}`);
        }
      } else if (chatwootResponse.status === 406) {
        possibleCauses.push('⚠️ O token NÃO está sendo aceito pelo Chatwoot');
        possibleCauses.push('Estrutura da URL incorreta (com ou sem /app/)');
        possibleCauses.push('Tipo de token incorreto (usando Platform App ao invés de Access Token)');
        actionSteps.push('1. Faça login no Chatwoot');
        actionSteps.push('2. Clique no seu perfil (canto superior direito)');
        actionSteps.push('3. Vá em Profile Settings > Access Token');
        actionSteps.push('4. Copie o Access Token (NÃO use Platform App Token)');
        actionSteps.push('5. Cole o novo token na configuração e salve');
        if (primaryUrl !== alternativeUrl) {
          actionSteps.push(`6. Se ainda não funcionar, tente usar a URL: ${alternativeUrl.replace(endpoint, '')}`);
        }
        actionSteps.push('7. Teste a conexão novamente');
      } else {
        possibleCauses.push('Verifique a URL e credenciais do Chatwoot');
        possibleCauses.push('Verifique se o servidor Chatwoot está acessível');
        actionSteps.push('Verifique conectividade com o servidor');
      }
      
      return new Response(
        JSON.stringify({
          error: `Erro ${chatwootResponse.status}: Chatwoot retornou ${contentType || 'tipo desconhecido'} ao invés de JSON`,
          message: chatwootResponse.status === 406 
            ? '🔴 Tentamos TODAS as variações de URL. Gere um NOVO token no Chatwoot ou ajuste a URL base.'
            : 'Erro ao conectar com Chatwoot',
          details: {
            status: chatwootResponse.status,
            contentType: contentType || 'unknown',
            preview: textResponse.substring(0, 200),
            triedUrls: [primaryUrl, alternativeUrl],
            baseUrl: integration.base_url,
            tokenMasked: integration.api_token.substring(0, 3) + '...' + integration.api_token.substring(integration.api_token.length - 4),
            possibleCauses,
            actionSteps
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const chatwootData = await chatwootResponse.json();

    if (!chatwootResponse.ok) {
      console.error('Chatwoot API error:', chatwootData);
      return new Response(
        JSON.stringify({
          error: `Erro da API Chatwoot: ${chatwootResponse.status}`,
          details: chatwootData,
        }),
        {
          status: chatwootResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(chatwootData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Chatwoot Proxy - Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno no proxy do Chatwoot',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
