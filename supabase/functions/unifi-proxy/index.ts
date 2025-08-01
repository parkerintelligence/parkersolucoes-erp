import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("UniFi-proxy function starting...");

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

    console.log('UniFi proxy request:', { method, endpoint, integrationId, userId: user.id });

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

    const { base_url, username, password, port, use_ssl, api_token } = integration;
    
    console.log("Integration auth config:", { 
      hasToken: !!api_token, 
      hasCredentials: !!(username && password) 
    });
    
    if (!api_token && (!username || !password)) {
      console.error('Missing integration config - need either token or credentials');
      throw new Error('UniFi integration needs either API token or username/password');
    }

    // Function to try Site Manager API
    const trySiteManagerAPI = async (): Promise<Response | null> => {
      if (!api_token) return null;

      const siteManagerUrl = 'https://api.ui.com';
      console.log('Trying UniFi Site Manager API with X-API-KEY authentication');
      
      const apiUrl = `${siteManagerUrl}${endpoint}`;
      console.log('Making UniFi Site Manager API request to:', apiUrl);

      const requestOptions: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': api_token,
        },
      };

      if (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(postData);
      }

      try {
        const apiResponse = await fetch(apiUrl, requestOptions);

        if (!apiResponse.ok) {
          console.error('Site Manager API failed:', apiResponse.status, apiResponse.statusText);
          const errorText = await apiResponse.text();
          console.error('Site Manager API error:', errorText);
          return null; // Fallback to local controller
        }

        const contentType = apiResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Site Manager API returned non-JSON response');
          return null; // Fallback to local controller
        }

        const responseData = await apiResponse.json();
        console.log('Site Manager API successful, data keys:', Object.keys(responseData || {}));

        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Site Manager API error:', error);
        return null; // Fallback to local controller
      }
    };

    // Function to try local controller API
    const tryLocalControllerAPI = async (): Promise<Response> => {
      if (!username || !password) {
        throw new Error('Local controller requires username and password');
      }

      console.log('Trying local controller API with username/password authentication');
      
      // Prepare local controller URL
      let fullBaseUrl = base_url;
      if (!base_url.startsWith('http')) {
        const protocol = use_ssl ? 'https' : 'http';
        fullBaseUrl = `${protocol}://${base_url}${port ? `:${port}` : ''}`;
      }

      // Convert Site Manager endpoints to local controller format
      let localEndpoint = endpoint;
      
      // Convert `/v1/hosts` to local controller sites endpoint
      if (endpoint === '/v1/hosts') {
        localEndpoint = '/api/self/sites';
      }
      // Convert `/v1/hosts/{hostId}/devices` to local controller format
      else if (endpoint.match(/^\/v1\/hosts\/[^\/]+\/devices$/)) {
        const siteId = endpoint.split('/')[3];
        localEndpoint = `/api/s/${siteId}/stat/device`;
      }
      // Convert `/v1/hosts/{hostId}/clients` to local controller format
      else if (endpoint.match(/^\/v1\/hosts\/[^\/]+\/clients$/)) {
        const siteId = endpoint.split('/')[3];
        localEndpoint = `/api/s/${siteId}/stat/sta`;
      }
      // Convert `/v1/hosts/{hostId}/networks` to local controller format
      else if (endpoint.match(/^\/v1\/hosts\/[^\/]+\/networks$/)) {
        const siteId = endpoint.split('/')[3];
        localEndpoint = `/api/s/${siteId}/rest/networkconf`;
      }
      // Convert `/v1/hosts/{hostId}/alarms` to local controller format
      else if (endpoint.match(/^\/v1\/hosts\/[^\/]+\/alarms$/)) {
        const siteId = endpoint.split('/')[3];
        localEndpoint = `/api/s/${siteId}/stat/alarm`;
      }
      // Convert `/v1/hosts/{hostId}/health` to local controller format
      else if (endpoint.match(/^\/v1\/hosts\/[^\/]+\/health$/)) {
        const siteId = endpoint.split('/')[3];
        localEndpoint = `/api/s/${siteId}/stat/health`;
      }

      console.log('Converted endpoint for local controller:', localEndpoint);

      // Login to controller
      console.log('Logging into local UniFi controller...');
      const loginResponse = await fetch(`${fullBaseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
          remember: false
        }),
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('Local controller login failed:', loginResponse.status, errorText);
        throw new Error(`Local controller authentication failed: ${loginResponse.statusText}`);
      }

      // Extract cookies
      let cookies = '';
      const setCookieHeaders = loginResponse.headers.get('set-cookie');
      if (setCookieHeaders) {
        cookies = setCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
        console.log('Local controller login successful, cookies extracted');
      }

      // Make API request
      const apiUrl = `${fullBaseUrl}${localEndpoint}`;
      console.log('Making local controller API request to:', apiUrl);

      const requestOptions: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(cookies && { 'Cookie': cookies })
        },
      };

      if (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(postData);
      }

      const apiResponse = await fetch(apiUrl, requestOptions);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Local controller API request failed:', apiResponse.status, errorText);
        throw new Error(`Local controller API request failed: ${apiResponse.statusText}`);
      }

      const responseData = await apiResponse.json();
      console.log('Local controller API successful, data keys:', Object.keys(responseData));

      // Logout
      try {
        await fetch(`${fullBaseUrl}/api/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cookies && { 'Cookie': cookies })
          },
        });
        console.log('Logged out from local controller');
      } catch (logoutError) {
        console.warn('Failed to logout from local controller:', logoutError);
      }

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    // Try Site Manager API first, then fallback to local controller
    console.log('Starting hybrid API approach...');
    
    if (api_token) {
      console.log('Attempting Site Manager API first...');
      const siteManagerResult = await trySiteManagerAPI();
      if (siteManagerResult) {
        console.log('Site Manager API succeeded');
        return siteManagerResult;
      }
      console.log('Site Manager API failed, falling back to local controller...');
    }

    if (username && password) {
      console.log('Attempting local controller API...');
      return await tryLocalControllerAPI();
    }

    throw new Error('No working authentication method available');

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