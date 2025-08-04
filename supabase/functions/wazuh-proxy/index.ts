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

    // Clean up base URL - remove any trailing slashes and add port if needed
    let cleanBaseUrl = base_url.replace(/\/+$/, '');
    
    // If it's just a domain/IP without port and doesn't have a port specified, add common Wazuh ports
    if (!cleanBaseUrl.includes(':') && !cleanBaseUrl.includes('://')) {
      cleanBaseUrl = `https://${cleanBaseUrl}:55000`;
    } else if (cleanBaseUrl.startsWith('http://') || cleanBaseUrl.startsWith('https://')) {
      // If protocol is specified but no port, add default Wazuh port
      if (!cleanBaseUrl.match(/:(\d+)/)) {
        cleanBaseUrl = cleanBaseUrl + ':55000';
      }
    }

    console.log(`Attempting to connect to Wazuh API: ${cleanBaseUrl}${endpoint}`);
    
    // First, try to authenticate and get a JWT token
    const authUrl = `${cleanBaseUrl}/security/user/authenticate`;
    console.log('Step 1: Authenticating with Wazuh API to get JWT token');
    
    const basicAuth = btoa(`${username}:${password}`);
    
    try {
      const authResponse = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!authResponse.ok) {
        console.error('Authentication failed:', authResponse.status, authResponse.statusText);
        
        // Try HTTP if HTTPS fails
        if (cleanBaseUrl.startsWith('https://')) {
          console.log('HTTPS authentication failed, trying HTTP...');
          const httpUrl = cleanBaseUrl.replace('https://', 'http://');
          const httpAuthResponse = await fetch(`${httpUrl}/security/user/authenticate`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(15000),
          });
          
          if (httpAuthResponse.ok) {
            cleanBaseUrl = httpUrl;
            console.log('HTTP authentication successful, using HTTP for API calls');
          } else {
            throw new Error(`Authentication failed on both HTTPS and HTTP: ${authResponse.statusText}`);
          }
        } else {
          throw new Error(`Authentication failed: ${authResponse.statusText}`);
        }
      }

      // Get the JWT token from successful authentication
      let jwtToken = null;
      try {
        const authData = await authResponse.json();
        jwtToken = authData.data?.token;
        console.log('JWT token obtained successfully');
      } catch (e) {
        console.log('Could not parse JWT from auth response, using Basic Auth');
      }

      // Make the actual API request with JWT token (if available) or Basic Auth
      const apiUrl = `${cleanBaseUrl}${endpoint}`;
      const requestHeaders = jwtToken 
        ? {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        : {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };

      console.log(`Step 2: Making API request to: ${apiUrl}`);
      console.log('Using authentication:', jwtToken ? 'JWT Bearer Token' : 'HTTP Basic Auth');

      const fetchOptions = {
        method: method || 'GET',
        headers: requestHeaders,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      };

      const apiResponse = await fetch(apiUrl, fetchOptions);

      if (!apiResponse.ok) {
        console.error('Wazuh API request failed:', apiResponse.status, apiResponse.statusText);
        const errorText = await apiResponse.text();
        console.error('Wazuh API error response:', errorText);
        throw new Error(`Wazuh API request failed: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      // Check if response is JSON
      const contentType = apiResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await apiResponse.text();
        console.error('Wazuh API returned non-JSON response:', responseText.substring(0, 200));
        throw new Error('Wazuh API returned invalid response format');
      }

      const responseData = await apiResponse.json();
      console.log('Wazuh API response successful, data keys:', Object.keys(responseData));
      console.log('Response structure:', JSON.stringify(responseData, null, 2).substring(0, 500));

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (authError) {
      console.error('Authentication/API error:', authError);
      
      // Try HTTP fallback if HTTPS fails
      if (cleanBaseUrl.startsWith('https://')) {
        console.log('HTTPS failed, trying HTTP fallback...');
        const httpUrl = cleanBaseUrl.replace('https://', 'http://');
        
        try {
          // Try auth with HTTP
          const httpAuthResponse = await fetch(`${httpUrl}/security/user/authenticate`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(15000),
          });
          
          let httpJwtToken = null;
          if (httpAuthResponse.ok) {
            try {
              const httpAuthData = await httpAuthResponse.json();
              httpJwtToken = httpAuthData.data?.token;
              console.log('HTTP authentication successful');
            } catch (e) {
              console.log('HTTP auth successful but no JWT, using Basic Auth');
            }
          }
          
          // Make HTTP API request
          const httpApiUrl = `${httpUrl}${endpoint}`;
          const httpHeaders = httpJwtToken 
            ? { 'Authorization': `Bearer ${httpJwtToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
            : { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
          
          const httpApiResponse = await fetch(httpApiUrl, {
            method: method || 'GET',
            headers: httpHeaders,
            signal: AbortSignal.timeout(30000),
          });
          
          if (httpApiResponse.ok) {
            const httpResponseData = await httpApiResponse.json();
            console.log('HTTP API request successful, data keys:', Object.keys(httpResponseData));
            return new Response(JSON.stringify(httpResponseData), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (httpError) {
          console.error('HTTP fallback also failed:', httpError);
        }
      }
      
      throw authError;
    }

  } catch (error) {
    console.error('Error in wazuh-proxy function:', error);
    
    // Provide more specific error information
    let errorMessage = 'Wazuh API connection failed';
    let errorDetails = error.message;
    
    if (error.message.includes('error sending request for url')) {
      errorMessage = 'Connection failed - check Wazuh server URL and network access';
      errorDetails = `Unable to connect to Wazuh server. Please verify: 1) Server is running and accessible, 2) URL and port are correct, 3) Network/firewall allows access`;
    } else if (error.message.includes('Authentication failed')) {
      errorMessage = 'Authentication failed';
      errorDetails = 'Invalid credentials or authentication method. Please verify username and password.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        suggestions: [
          'Verify Wazuh server is running and accessible',
          'Check username and password credentials',
          'Ensure network/firewall allows access to Wazuh API',
          'Try HTTP if HTTPS has SSL certificate issues'
        ]
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
});