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
    console.log('🔄 Chatwoot proxy request:', req.method, req.url);
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    console.log('Authenticating user...');
    
    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

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

    // Fetch integration from database
    // Masters can access all integrations, regular users only their own
    let query = supabaseClient
      .from('integrations')
      .select('base_url, api_token')
      .eq('id', integrationId)
      .eq('type', 'chatwoot')
      .eq('is_active', true);

    // Only filter by user_id if not master
    if (!isMaster) {
      query = query.eq('user_id', user.id);
    }

    const { data: integration, error: integrationError } = await query.single();

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

    // Build Chatwoot API URL
    let apiUrl = integration.base_url.replace(/\/$/, '');
    apiUrl = apiUrl.replace(/\/app\/login$/, '');
    apiUrl = apiUrl.replace(/\/app$/, '');
    
    if (!apiUrl.includes('/api/v1')) {
      apiUrl = apiUrl + '/api/v1';
    }
    
    const fullUrl = `${apiUrl}${endpoint}`;

    console.log('Chatwoot Proxy - Full URL:', fullUrl);

    // Make request to Chatwoot API
    const chatwootResponse = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': integration.api_token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const chatwootData = await chatwootResponse.json();

    console.log('Chatwoot Proxy - Response status:', chatwootResponse.status);

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
