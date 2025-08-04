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
    
    // Add default Wazuh API port (55000) if not specified
    if (!cleanBaseUrl.includes(':') || cleanBaseUrl.match(/^https?:\/\/[^:]+$/)) {
      if (cleanBaseUrl.startsWith('http://')) {
        cleanBaseUrl = cleanBaseUrl + ':55000';
      } else if (cleanBaseUrl.startsWith('https://')) {
        cleanBaseUrl = cleanBaseUrl + ':55000';
      } else {
        cleanBaseUrl = `https://${cleanBaseUrl}:55000`;
      }
    }

    console.log(`Attempting to connect to Wazuh API: ${cleanBaseUrl}${endpoint}`);
    
    // Step 1: Test basic connectivity first
    console.log('Step 1: Testing basic connectivity...');
    try {
      const connectivityTest = await fetch(`${cleanBaseUrl}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      console.log('Connectivity test result:', connectivityTest.status);
    } catch (connectError) {
      console.log('Basic connectivity failed, will try anyway:', connectError.message);
    }

    // Step 2: Get JWT token using proper Wazuh API authentication
    console.log('Step 2: Authenticating with Wazuh API...');
    const authUrl = `${cleanBaseUrl}/security/user/authenticate`;
    console.log('Auth URL:', authUrl);
    
    const basicAuth = btoa(`${username}:${password}`);
    
    // Function to attempt authentication
    const attemptAuth = async (url: string, isRetry = false) => {
      console.log(`Attempting ${isRetry ? 'HTTP' : 'HTTPS'} authentication to:`, url);
      
      const authResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      console.log('Auth response status:', authResponse.status);
      console.log('Auth response headers:', Object.fromEntries(authResponse.headers.entries()));

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('Auth error response body:', errorText);
        throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText} - ${errorText}`);
      }

      const authData = await authResponse.json();
      console.log('Auth response data:', JSON.stringify(authData, null, 2));
      
      return {
        token: authData.data?.token || authData.token,
        baseUrl: url.replace('/security/user/authenticate', '')
      };
    };

    // Function to make API request
    const makeApiRequest = async (baseUrl: string, token: string | null) => {
      const apiUrl = `${baseUrl}${endpoint}`;
      console.log('Step 3: Making API request to:', apiUrl);
      
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
        console.log('Using JWT Bearer authentication');
      } else {
        requestHeaders['Authorization'] = `Basic ${basicAuth}`;
        console.log('Using Basic authentication (no JWT token available)');
      }

      const apiResponse = await fetch(apiUrl, {
        method: method || 'GET',
        headers: requestHeaders,
        signal: AbortSignal.timeout(30000),
      });

      console.log('API response status:', apiResponse.status);
      console.log('API response headers:', Object.fromEntries(apiResponse.headers.entries()));

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API error response:', errorText);
        throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`);
      }

      const contentType = apiResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await apiResponse.text();
        console.error('Non-JSON response received:', responseText.substring(0, 200));
        throw new Error('API returned non-JSON response');
      }

      const responseData = await apiResponse.json();
      console.log('API response keys:', Object.keys(responseData));
      console.log('API response sample:', JSON.stringify(responseData, null, 2).substring(0, 1000));
      
      return responseData;
    };

    try {
      // Try HTTPS first
      let authResult;
      let finalBaseUrl = cleanBaseUrl;
      
      try {
        authResult = await attemptAuth(authUrl);
        finalBaseUrl = authResult.baseUrl;
      } catch (httpsError) {
        console.log('HTTPS authentication failed, trying HTTP fallback...');
        
        // Try HTTP as fallback
        if (cleanBaseUrl.startsWith('https://')) {
          const httpUrl = cleanBaseUrl.replace('https://', 'http://');
          const httpAuthUrl = `${httpUrl}/security/user/authenticate`;
          
          try {
            authResult = await attemptAuth(httpAuthUrl, true);
            finalBaseUrl = authResult.baseUrl;
            console.log('HTTP authentication successful, using HTTP for API calls');
          } catch (httpError) {
            console.error('Both HTTPS and HTTP authentication failed');
            throw new Error(`Authentication failed on both protocols. HTTPS: ${httpsError.message}, HTTP: ${httpError.message}`);
          }
        } else {
          throw httpsError;
        }
      }

      // Make the actual API request
      const responseData = await makeApiRequest(finalBaseUrl, authResult.token);
      
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Complete request flow failed:', error);
      throw error;
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