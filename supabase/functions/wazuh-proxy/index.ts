import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("🚀 Wazuh-proxy function starting...");

serve(async (req) => {
  console.log(`📥 Received ${req.method} request to wazuh-proxy`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("✅ Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client
    console.log("🔧 Creating Supabase client...");
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 2. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      throw new Error('Authorization header is required');
    }

    console.log("🔐 Authenticating user...");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // 3. Parse request body
    const requestBody = await req.json();
    const { method = 'GET', endpoint, integrationId } = requestBody;

    console.log('📋 Wazuh proxy request:', { method, endpoint, integrationId, userId: user.id });

    // 4. Get Wazuh integration configuration
    console.log("🔍 Fetching Wazuh integration...");
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .eq('type', 'wazuh')
      .single();

    if (integrationError || !integration) {
      console.error('❌ Integration not found:', integrationError);
      throw new Error('Wazuh integration not found');
    }

    console.log("✅ Integration found:", { 
      id: integration.id, 
      name: integration.name, 
      is_active: integration.is_active,
      base_url: integration.base_url?.substring(0, 50) + '...'
    });

    if (!integration.is_active) {
      throw new Error('Wazuh integration is not active');
    }

    const { base_url, username, password } = integration;
    
    if (!base_url || !username || !password) {
      console.error('❌ Missing integration config:', { 
        has_base_url: !!base_url, 
        has_username: !!username, 
        has_password: !!password 
      });
      throw new Error('Wazuh integration is not properly configured');
    }

    // 5. Prepare Wazuh URL
    let wazuhUrl = base_url.replace(/\/+$/, '');
    
    // Add default port 55000 if not specified
    if (!wazuhUrl.match(/:\d+$/)) {
      wazuhUrl = wazuhUrl + ':55000';
    }

    // Ensure protocol
    if (!wazuhUrl.startsWith('http')) {
      wazuhUrl = 'https://' + wazuhUrl;
    }

    console.log(`🌐 Prepared Wazuh URL: ${wazuhUrl}`);

    // 6. Create basic auth header
    const basicAuth = btoa(`${username}:${password}`);
    console.log(`🔑 Created basic auth for user: ${username}`);

    // 7. Simple connectivity test
    console.log('🔗 Testing basic connectivity...');
    try {
      const testResponse = await fetch(`${wazuhUrl}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      console.log(`✅ Connectivity test: ${testResponse.status}`);
    } catch (connectError) {
      console.log(`⚠️ Connectivity test failed: ${connectError.message}`);
    }

    // 8. Try authentication and API call
    const apiUrl = `${wazuhUrl}${endpoint}`;
    console.log(`🎯 Making API request to: ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      method: method,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    console.log(`📊 API Response status: ${apiResponse.status}`);
    console.log(`📊 API Response headers:`, Object.fromEntries(apiResponse.headers.entries()));

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`❌ API error response (${apiResponse.status}):`, errorText);
      
      // Try HTTP if HTTPS failed
      if (wazuhUrl.startsWith('https://')) {
        console.log('🔄 Trying HTTP fallback...');
        const httpUrl = wazuhUrl.replace('https://', 'http://');
        const httpApiUrl = `${httpUrl}${endpoint}`;
        
        const httpResponse = await fetch(httpApiUrl, {
          method: method,
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(15000),
        });

        console.log(`📊 HTTP fallback status: ${httpResponse.status}`);

        if (!httpResponse.ok) {
          const httpErrorText = await httpResponse.text();
          console.error(`❌ HTTP fallback also failed (${httpResponse.status}):`, httpErrorText);
          throw new Error(`API request failed on both HTTPS and HTTP: ${httpResponse.status} ${httpResponse.statusText}`);
        }

        const httpData = await httpResponse.json();
        console.log(`✅ HTTP success, returning data with ${Object.keys(httpData).length} keys`);
        
        return new Response(JSON.stringify(httpData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`);
    }

    // 9. Parse successful response
    const responseData = await apiResponse.json();
    console.log(`✅ API success, returning data with ${Object.keys(responseData).length} keys`);
    console.log(`📄 Sample response:`, JSON.stringify(responseData, null, 2).substring(0, 500));
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in wazuh-proxy function:', error);
    
    // Enhanced error response
    const errorResponse = {
      error: 'Wazuh API connection failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Verify Wazuh server is running and accessible',
        'Check username and password credentials',
        'Ensure network/firewall allows access to Wazuh API port 55000',
        'Try HTTP if HTTPS has SSL certificate issues'
      ]
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});