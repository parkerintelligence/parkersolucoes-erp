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

    // Configure fetch options with SSL handling
    const fetchOptions = {
      method: method || 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add timeout and SSL handling
      signal: AbortSignal.timeout(30000), // 30 second timeout
    };

    console.log('Fetch options:', JSON.stringify(fetchOptions, null, 2));

    const apiResponse = await fetch(apiUrl, fetchOptions);

    if (!apiResponse.ok) {
      console.error('Wazuh API request failed:', apiResponse.status, apiResponse.statusText);
      const errorText = await apiResponse.text();
      console.error('Wazuh API error response:', errorText);
      
      // Try alternative approach with different auth if basic auth fails
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        console.log('Basic auth failed, trying token-based authentication...');
        
        try {
          // Try Wazuh's token-based authentication
          const authResponse = await fetch(`${cleanBaseUrl}/security/user/authenticate`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
            },
          });

          if (authResponse.ok) {
            const authData = await authResponse.json();
            const token = authData.data?.token;

            if (token) {
              console.log('Token authentication successful, retrying API request');
              const tokenApiResponse = await fetch(apiUrl, {
                method: method || 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
              });

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
      
      // Try with HTTP instead of HTTPS if SSL fails
      if (cleanBaseUrl.startsWith('https://')) {
        console.log('HTTPS failed, trying HTTP...');
        const httpUrl = cleanBaseUrl.replace('https://', 'http://');
        const httpApiUrl = `${httpUrl}${endpoint}`;
        
        try {
          const httpResponse = await fetch(httpApiUrl, fetchOptions);
          if (httpResponse.ok) {
            const contentType = httpResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const responseData = await httpResponse.json();
              console.log('Wazuh API response successful via HTTP, data keys:', Object.keys(responseData));
              return new Response(JSON.stringify(responseData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        } catch (httpError) {
          console.error('HTTP fallback also failed:', httpError);
        }
      }
      
      throw new Error(`Wazuh API request failed: ${apiResponse.statusText}`);
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

  } catch (error) {
    console.error('Error in wazuh-proxy function:', error);
    
    // Provide more specific error information
    let errorMessage = 'Wazuh API connection failed';
    let errorDetails = error.message;
    
    if (error.message.includes('error sending request for url')) {
      errorMessage = 'Connection failed - check Wazuh server URL and SSL configuration';
      const baseUrlToUse = typeof cleanBaseUrl !== 'undefined' ? cleanBaseUrl : base_url || 'unknown';
      errorDetails = `Unable to connect to ${baseUrlToUse}. Please verify: 1) Server is running, 2) URL is correct, 3) SSL certificate is valid, 4) Port ${baseUrlToUse.includes(':') ? baseUrlToUse.split(':').pop() : '55000'} is open`;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        url_attempted: `${typeof cleanBaseUrl !== 'undefined' ? cleanBaseUrl : base_url || 'unknown'}${endpoint || ''}`,
        suggestions: [
          'Verify Wazuh server is running',
          'Check if URL is accessible from this environment',
          'Verify SSL certificate is valid',
          'Try using HTTP instead of HTTPS if SSL issues persist'
        ]
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});