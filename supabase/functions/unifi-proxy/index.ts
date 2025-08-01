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

  // For Universal API, always use the correct base URL
  let fullBaseUrl = base_url;
  
  // If base_url is unifi.ui.com, correct it to api.ui.com for Universal API
  if (base_url.includes('unifi.ui.com')) {
    fullBaseUrl = 'https://api.ui.com';
    console.log('Corrected UniFi base URL to use Universal API endpoint');
  } else if (!base_url.startsWith('http')) {
    const protocol = use_ssl ? 'https' : 'http';
    fullBaseUrl = `${protocol}://${base_url}${port ? `:${port}` : ''}`;
  }

  let cookies = '';
  let authHeaders: Record<string, string> = {};

  // Check if using UniFi Site Manager API token
  if (api_token) {
    console.log('Using UniFi Site Manager API X-API-KEY authentication');
    authHeaders['X-API-KEY'] = api_token;
    authHeaders['Accept'] = 'application/json';
    
    // For Site Manager API v2, use endpoint directly without conversion
    const apiUrl = `${fullBaseUrl}${endpoint}`;
    console.log('Making UniFi Site Manager API request to:', apiUrl);

      const requestOptions: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders
        },
      };

      if (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(postData);
      }

      const apiResponse = await fetch(apiUrl, requestOptions);

      if (!apiResponse.ok) {
        console.error('UniFi Site Manager API request failed:', apiResponse.status, apiResponse.statusText);
        const errorText = await apiResponse.text();
        console.error('UniFi Site Manager API error response:', errorText);
        
        // Return error in expected format
        return new Response(JSON.stringify({ 
          error: `UniFi Site Manager API request failed: ${apiResponse.status} ${apiResponse.statusText}`,
          details: errorText,
          endpoint: apiUrl
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if response is JSON before parsing
      const contentType = apiResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await apiResponse.text();
        console.error('UniFi Site Manager API returned non-JSON response:', responseText.substring(0, 200));
        
        return new Response(JSON.stringify({ 
          error: 'UniFi Site Manager API returned invalid response format',
          details: responseText.substring(0, 500),
          endpoint: apiUrl
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const responseData = await apiResponse.json();
      console.log('UniFi Site Manager API response successful, data keys:', Object.keys(responseData || {}));
      console.log('UniFi Site Manager API response sample:', JSON.stringify(responseData).substring(0, 500));

      // Site Manager API returns data in a consistent structure
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Legacy local controller authentication with session cookies
    console.log('Using local controller authentication with username/password');
    
    // First, login to UniFi controller
    console.log('Logging into UniFi controller...');
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
      console.error('UniFi login failed:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.error('UniFi login error response:', errorText);
      throw new Error(`UniFi authentication failed: ${loginResponse.statusText}`);
    }

    // Extract cookies from login response
    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      cookies = setCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
      console.log('Login successful, cookies extracted');
    } else {
      console.log('Login successful, no cookies found');
    }

    // Make the actual API request
    const apiUrl = `${fullBaseUrl}${endpoint}`;
    console.log('Making UniFi API request to:', apiUrl);

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
      console.error('UniFi API request failed:', apiResponse.status, apiResponse.statusText);
      const errorText = await apiResponse.text();
      console.error('UniFi API error response:', errorText);
      throw new Error(`UniFi API request failed: ${apiResponse.statusText}`);
    }

    const responseData = await apiResponse.json();
    console.log('UniFi API response successful, data keys:', Object.keys(responseData));

    // Logout after request (optional, depends on API design)
    try {
      await fetch(`${fullBaseUrl}/api/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cookies && { 'Cookie': cookies })
        },
      });
      console.log('Logged out from UniFi controller');
    } catch (logoutError) {
      console.warn('Failed to logout from UniFi controller:', logoutError);
    }

    return new Response(JSON.stringify(responseData), {
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