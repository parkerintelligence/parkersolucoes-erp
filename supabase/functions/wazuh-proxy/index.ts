import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("Wazuh-proxy function starting...");

serve(async (req) => {
  console.log(`Received ${req.method} request to wazuh-proxy`);
  
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
    const { method, endpoint, integrationId } = requestBody;

    console.log('Wazuh proxy request:', { method, endpoint, integrationId, userId: user.id });

    // Get Wazuh integration configuration
    console.log("Fetching Wazuh integration...");
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .eq('type', 'wazuh')
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      throw new Error('Wazuh integration not found');
    }

    console.log("Integration found:", { id: integration.id, name: integration.name, is_active: integration.is_active });

    if (!integration.is_active) {
      throw new Error('Wazuh integration is not active');
    }

    const { base_url, username, password } = integration;
    
    if (!base_url || !username || !password) {
      console.error('Missing integration config:', { base_url: !!base_url, username: !!username, password: !!password });
      throw new Error('Wazuh integration is not properly configured');
    }

    console.log(`Authenticating with Wazuh at: ${base_url}`);
    
    // Authenticate with Wazuh API
    const authResponse = await fetch(`${base_url}/security/user/authenticate`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      console.error('Wazuh auth failed:', authResponse.status, authResponse.statusText);
      const errorText = await authResponse.text();
      console.error('Wazuh auth error response:', errorText);
      throw new Error(`Wazuh authentication failed: ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    const token = authData.data?.token;

    if (!token) {
      console.error('No token in auth response:', authData);
      throw new Error('Failed to get Wazuh authentication token');
    }

    console.log('Wazuh authentication successful');

    // Make the actual API request
    const apiUrl = `${base_url}${endpoint}`;
    console.log('Making Wazuh API request to:', apiUrl);

    const apiResponse = await fetch(apiUrl, {
      method: method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      console.error('Wazuh API request failed:', apiResponse.status, apiResponse.statusText);
      const errorText = await apiResponse.text();
      console.error('Wazuh API error response:', errorText);
      throw new Error(`Wazuh API request failed: ${apiResponse.statusText}`);
    }

    const responseData = await apiResponse.json();
    console.log('Wazuh API response successful, data keys:', Object.keys(responseData));

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wazuh-proxy function:', error);
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