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

    console.log(`Making direct Wazuh API request to: ${cleanBaseUrl}${endpoint}`);
    
    // Make direct API request with Basic Auth (more common for Wazuh)
    const apiUrl = `${cleanBaseUrl}${endpoint}`;
    const basicAuth = btoa(`${username}:${password}`);
    
    console.log('Using HTTP Basic Authentication for Wazuh API');

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const apiResponse = await fetch(apiUrl, {
        method: method || 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        // Disable SSL verification for self-signed certificates (common in Wazuh)
        // @ts-ignore
        rejectUnauthorized: false,
      });
      
      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        console.error('Wazuh API request failed:', apiResponse.status, apiResponse.statusText);
        const errorText = await apiResponse.text();
        console.error('Wazuh API error response:', errorText);
        
        // Try alternative approach with different auth if basic auth fails
        if (apiResponse.status === 401 || apiResponse.status === 403) {
          console.log('Basic auth failed, trying token-based authentication...');
          
          try {
            // Try Wazuh's token-based authentication
            const authController = new AbortController();
            const authTimeoutId = setTimeout(() => authController.abort(), 5000);
            
            const authResponse = await fetch(`${cleanBaseUrl}/security/user/authenticate`, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json',
              },
              signal: authController.signal,
            });
            
            clearTimeout(authTimeoutId);

            if (authResponse.ok) {
              const authData = await authResponse.json();
              const token = authData.data?.token;

              if (token) {
                console.log('Token authentication successful, retrying API request');
                const tokenController = new AbortController();
                const tokenTimeoutId = setTimeout(() => tokenController.abort(), 10000);
                
                const tokenApiResponse = await fetch(apiUrl, {
                  method: method || 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                  signal: tokenController.signal,
                });
                
                clearTimeout(tokenTimeoutId);

                if (tokenApiResponse.ok) {
                  const responseData = await tokenApiResponse.json();
                  console.log('Wazuh API response successful with token auth, data keys:', Object.keys(responseData));
                  return new Response(JSON.stringify(responseData), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  });
                }
              }
            }
          } catch (tokenError) {
            console.error('Token authentication also failed:', tokenError);
          }
        }
        
        throw new Error(`Wazuh API request failed: ${apiResponse.statusText} (${apiResponse.status})`);
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

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific timeout errors
      if (fetchError.name === 'AbortError') {
        console.error('Wazuh API request timed out after 10 seconds');
        throw new Error('Connection timeout: Unable to reach Wazuh server. Check if the server is accessible from the internet.');
      }
      
      // Handle network connectivity errors
      if (fetchError.message.includes('error sending request')) {
        console.error('Network connectivity error:', fetchError.message);
        throw new Error('Network error: Cannot connect to Wazuh server. Verify the URL and network connectivity.');
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in wazuh-proxy function:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    let statusCode = 400;
    
    if (error.message.includes('timeout') || error.message.includes('Network error')) {
      statusCode = 503; // Service Unavailable
      errorMessage = `Connectivity issue: ${error.message}`;
    } else if (error.message.includes('Unauthorized') || error.message.includes('failed: 401')) {
      statusCode = 401;
      errorMessage = 'Authentication failed: Check Wazuh credentials';
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      statusCode = 404;
      errorMessage = 'Wazuh endpoint not found: Check API version and endpoints';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Check the edge function logs for more details',
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});