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
    let apiUrl = integration.base_url.replace(/\/$/, '');
    
    // Remove /login suffix if present but preserve /app path
    apiUrl = apiUrl.replace(/\/login$/, '');
    apiUrl = apiUrl.replace(/\/app\/login$/, '/app');
    
    // Remove /dashboard or /accounts paths but preserve /app
    apiUrl = apiUrl.replace(/\/(dashboard|accounts).*$/, '');
    
    // Detect if we need /app in the path
    // If URL contains /app/ or ends with /app, we should use /app/api/v1
    const needsAppPath = apiUrl.includes('/app');
    
    // Build the final API URL
    if (needsAppPath) {
      // For self-hosted with /app path
      if (!apiUrl.endsWith('/app')) {
        apiUrl = apiUrl + '/app';
      }
      apiUrl = apiUrl + '/api/v1';
    } else {
      // For cloud or self-hosted without /app
      if (!apiUrl.includes('/api/v1')) {
        apiUrl = apiUrl + '/api/v1';
      }
    }
    
    const fullUrl = `${apiUrl}${endpoint}`;

    console.log('Chatwoot Proxy - Base URL original:', integration.base_url);
    console.log('Chatwoot Proxy - Needs /app path:', needsAppPath);
    console.log('Chatwoot Proxy - Full URL construída:', fullUrl);

    // Try first with api_access_token header (Chatwoot standard)
    const headers1 = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api_access_token': integration.api_token,
    };
    
    console.log('Chatwoot Proxy - Sending headers:', Object.keys(headers1));
    
    let chatwootResponse = await fetch(fullUrl, {
      method,
      headers: headers1,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000), // 15 second timeout
    }).catch(error => {
      console.error('Chatwoot API - Network error:', error.message);
      throw error;
    });

    console.log('Chatwoot Proxy - First attempt status:', chatwootResponse.status);

    // If 401 or 406, try with Authorization Bearer header as fallback
    if (chatwootResponse.status === 401 || chatwootResponse.status === 406) {
      console.log('Chatwoot Proxy - Trying Authorization Bearer header as fallback...');
      
      const headers2 = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${integration.api_token}`,
      };
      
      chatwootResponse = await fetch(fullUrl, {
        method,
        headers: headers2,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });

      console.log('Chatwoot Proxy - Second attempt status:', chatwootResponse.status);
    }

    console.log('Chatwoot Proxy - Response status:', chatwootResponse.status);
    console.log('Chatwoot Proxy - Response headers:', Object.fromEntries(chatwootResponse.headers.entries()));

    // Check if response is JSON
    const contentType = chatwootResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await chatwootResponse.text();
      console.error('Chatwoot API returned non-JSON response:', textResponse.substring(0, 500));
      
      return new Response(
        JSON.stringify({
          error: `Chatwoot retornou ${contentType || 'tipo desconhecido'} ao invés de JSON`,
          details: {
            status: chatwootResponse.status,
            contentType: contentType,
            preview: textResponse.substring(0, 200),
            possibleCause: chatwootResponse.status === 401 
              ? 'Token de API inválido ou expirado' 
              : chatwootResponse.status === 404
              ? 'URL do endpoint incorreta. Verifique se a URL base está correta.'
              : 'Verifique a URL e credenciais do Chatwoot'
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
