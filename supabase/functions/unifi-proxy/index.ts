import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("UniFi Site Manager API proxy function starting...");

serve(async (req) => {
  console.log(`Received ${req.method} request to unifi-proxy`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating Supabase client...");
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      throw new Error('Authorization header is required');
    }

    console.log("Authenticating user...");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log(`User authenticated: ${user.id}`);

    const requestBody = await req.json();
    const { method, endpoint, integrationId, data: postData } = requestBody;

    console.log('UniFi Site Manager API request:', { method, endpoint, integrationId, userId: user.id });

    // Get UniFi integration configuration
    console.log("Fetching UniFi integration...");
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .eq('type', 'unifi')
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      throw new Error('UniFi integration not found');
    }

    console.log("Integration found:", { id: integration.id, name: integration.name, is_active: integration.is_active });

    if (!integration.is_active) {
      throw new Error('UniFi integration is not active');
    }

    const { api_token } = integration;
    
    console.log("Integration config:", { 
      hasApiToken: !!api_token
    });
    
    if (!api_token) {
      console.error('Missing API token for UniFi Site Manager API');
      throw new Error('UniFi Site Manager API requires an API token. Get yours at https://account.ui.com/api');
    }

    // Use official UniFi Site Manager API
    const baseApiUrl = 'https://api.ui.com';
    console.log('Using UniFi Site Manager API:', baseApiUrl);
    console.log('API endpoint:', endpoint);

    // Make API request to UniFi Site Manager
    const apiUrl = `${baseApiUrl}${endpoint}`;
    console.log('Making Site Manager API request to:', apiUrl);

    const requestOptions: RequestInit = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': api_token
      },
    };

    if (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(postData);
    }

    console.log('Request options:', { 
      method: requestOptions.method, 
      url: apiUrl,
      hasApiKey: !!api_token,
      hasBody: !!requestOptions.body 
    });

    const apiResponse = await fetch(apiUrl, requestOptions);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Site Manager API request failed:', apiResponse.status, errorText);
      
      if (apiResponse.status === 401) {
        throw new Error('API token inválido ou expirado. Verifique suas credenciais na conta UniFi.');
      } else if (apiResponse.status === 403) {
        throw new Error('Acesso negado. Verifique as permissões do seu token API.');
      } else if (apiResponse.status === 404) {
        throw new Error('Endpoint não encontrado. Verifique se o site/host existe.');
      }
      
      throw new Error(`Site Manager API request failed: ${apiResponse.status} - ${errorText}`);
    }

    const responseData = await apiResponse.json();
    console.log('Site Manager API successful, response structure:', {
      hasData: !!responseData,
      dataKeys: responseData ? Object.keys(responseData) : [],
      dataLength: Array.isArray(responseData?.data) ? responseData.data.length : 'not array',
      fullResponse: responseData
    });

    // Always return the data property if it exists, otherwise return the full response
    const finalResponse = responseData?.data ? responseData : { data: responseData };
    console.log('Final response being sent:', finalResponse);

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in unifi-proxy function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the edge function logs for more details'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});