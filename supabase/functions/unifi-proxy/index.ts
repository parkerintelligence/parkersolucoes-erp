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

    const { base_url, username, password, port, use_ssl } = integration;
    
    console.log("Integration config:", { 
      hasBaseUrl: !!base_url,
      hasUsername: !!username,
      hasPassword: !!password,
      port: port,
      useSsl: use_ssl
    });
    
    if (!username || !password) {
      console.error('Missing username or password for local controller');
      throw new Error('UniFi local controller requires username and password');
    }

    if (!base_url) {
      console.error('Missing base_url for local controller');
      throw new Error('UniFi controller base URL is required');
    }

    // Normalize base URL - remove trailing slash
    const normalizedBaseUrl = base_url.replace(/\/$/, '');
    
    // Build full base URL
    let fullBaseUrl;
    if (!normalizedBaseUrl.startsWith('http')) {
      const protocol = use_ssl ? 'https' : 'http';
      const defaultPort = use_ssl ? 8443 : 8080;
      const finalPort = port || defaultPort;
      fullBaseUrl = `${protocol}://${normalizedBaseUrl}:${finalPort}`;
    } else {
      // Remove port from URL if it's already included and add it separately
      const urlWithoutPort = normalizedBaseUrl.replace(/:8443$|:8080$/, '');
      const finalPort = port || (use_ssl ? 8443 : 8080);
      fullBaseUrl = `${urlWithoutPort}:${finalPort}`;
    }

    console.log('Final controller URL:', fullBaseUrl);

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

    // Try different approaches for connection
    let loginResponse: Response;
    let finalUrl = fullBaseUrl;
    
    // First try: Original URL
    console.log('Logging into local UniFi controller...');
    let loginUrl = `${fullBaseUrl}/api/login`;
    console.log('Login URL (attempt 1):', loginUrl);
    
    try {
      loginResponse = await fetch(loginUrl, {
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
        throw new Error(`HTTP ${loginResponse.status}`);
      }
      
      console.log('Login successful with original URL');
    } catch (firstAttemptError) {
      console.log('First attempt failed:', firstAttemptError.message);
      
      // Second try: Force HTTP if HTTPS failed
      if (fullBaseUrl.startsWith('https://')) {
        finalUrl = fullBaseUrl.replace('https://', 'http://').replace(':8443', ':8080');
        loginUrl = `${finalUrl}/api/login`;
        console.log('Login URL (attempt 2 - HTTP):', loginUrl);
        
        try {
          loginResponse = await fetch(loginUrl, {
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
            throw new Error(`HTTP ${loginResponse.status}`);
          }
          
          console.log('Login successful with HTTP URL');
        } catch (secondAttemptError) {
          console.error('Second attempt also failed:', secondAttemptError.message);
          
          // Third try: Just the hostname without port
          const hostname = base_url.replace(/^https?:\/\//, '').replace(/:.*$/, '');
          finalUrl = `http://${hostname}:8080`;
          loginUrl = `${finalUrl}/api/login`;
          console.log('Login URL (attempt 3 - simple HTTP):', loginUrl);
          
          try {
            loginResponse = await fetch(loginUrl, {
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
              throw new Error(`HTTP ${loginResponse.status}`);
            }
            
            console.log('Login successful with simple HTTP URL');
          } catch (thirdAttemptError) {
            console.error('All login attempts failed. Last error:', thirdAttemptError.message);
            const errorText = await loginResponse?.text() || 'No response';
            throw new Error(`All UniFi controller connection attempts failed. Final response: ${errorText}`);
          }
        }
      } else {
        const errorText = await loginResponse?.text() || 'No response';
        throw new Error(`UniFi controller connection failed: ${firstAttemptError.message}. Response: ${errorText}`);
      }
    }

    // Extract cookies
    let cookies = '';
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse cookies more carefully
      const cookieParts = setCookieHeader.split(',');
      cookies = cookieParts
        .map(cookie => cookie.trim().split(';')[0])
        .filter(cookie => cookie.includes('='))
        .join('; ');
      console.log('Local controller login successful, cookies extracted:', cookies.substring(0, 50) + '...');
    } else {
      console.warn('No cookies received from login response');
    }

    // Make API request using the working URL
    const apiUrl = `${finalUrl}${localEndpoint}`;
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

    console.log('Request options:', { ...requestOptions, headers: { ...requestOptions.headers, Cookie: cookies ? '[REDACTED]' : 'none' } });

    const apiResponse = await fetch(apiUrl, requestOptions);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Local controller API request failed:', apiResponse.status, errorText);
      throw new Error(`Local controller API request failed: ${apiResponse.status} - ${errorText}`);
    }

    const responseData = await apiResponse.json();
    console.log('Local controller API successful, response structure:', {
      hasData: !!responseData,
      dataKeys: responseData ? Object.keys(responseData) : [],
      dataLength: Array.isArray(responseData?.data) ? responseData.data.length : 'not array'
    });

    // Logout
    try {
      await fetch(`${finalUrl}/api/logout`, {
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