import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// JWT token cache to avoid re-authentication on every request
let tokenCache: { [key: string]: { token: string, expires: number } } = {};

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
      .eq('type', 'wazuh')
      .or(`user_id.eq.${user.id},is_global.eq.true`)
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
    
    const basicAuth = btoa(`${username}:${password}`);
    const cacheKey = `${cleanBaseUrl}:${username}`;
    
    // Function to attempt authentication and cache token
    const attemptAuth = async (url: string, isRetry = false) => {
      console.log(`Attempting ${isRetry ? 'HTTP' : 'HTTPS'} authentication to:`, url);
      
      try {
        const authResponse = await fetch(url, {
          method: 'POST', // Wazuh uses POST for authentication
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password
          }),
          signal: AbortSignal.timeout(15000),
        });

        console.log('Auth response status:', authResponse.status);
        
        if (!authResponse.ok) {
          const errorText = await authResponse.text();
          console.error('Auth error response body:', errorText);
          throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`);
        }

        const authData = await authResponse.json();
        console.log('Auth response received, token length:', authData.data?.token?.length || 0);
        
        const token = authData.data?.token;
        if (!token) {
          throw new Error('No JWT token received from authentication');
        }
        
        // Cache the token for 15 minutes (Wazuh default expiry is usually longer)
        tokenCache[cacheKey] = {
          token: token,
          expires: Date.now() + (15 * 60 * 1000)
        };
        
        return {
          token: token,
          baseUrl: url.replace('/security/user/authenticate', '')
        };
      } catch (error) {
        console.error(`${isRetry ? 'HTTP' : 'HTTPS'} auth error:`, error.message);
        throw error;
      }
    };
    
    // Check if we have a valid cached token
    const cachedToken = tokenCache[cacheKey];
    if (cachedToken && cachedToken.expires > Date.now()) {
      console.log('Using cached JWT token');
    } else {
      console.log('Getting new JWT token...');
    }

    // Function to make API request with proper Wazuh endpoints
    const makeApiRequest = async (baseUrl: string, token: string) => {
      const apiUrl = `${baseUrl}${endpoint}`;
      console.log('Step 3: Making API request to:', apiUrl);
      
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const apiResponse = await fetch(apiUrl, {
        method: method || 'GET',
        headers: requestHeaders,
        signal: AbortSignal.timeout(30000),
      });

      console.log('API response status:', apiResponse.status);
      
      if (!apiResponse.ok) {
        // If token expired, clear cache and retry once
        if (apiResponse.status === 401) {
          console.log('Token might be expired, clearing cache...');
          delete tokenCache[cacheKey];
          throw new Error('JWT_EXPIRED');
        }
        
        const errorText = await apiResponse.text();
        console.error('API error response:', errorText);
        throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const contentType = apiResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await apiResponse.text();
        console.error('Non-JSON response received:', responseText.substring(0, 200));
        throw new Error('API returned non-JSON response');
      }

      const responseData = await apiResponse.json();
      console.log('API response structure:', {
        hasError: !!responseData.error,
        hasData: !!responseData.data,
        dataType: typeof responseData.data,
        affectedItems: responseData.data?.affected_items?.length || 0,
        totalItems: responseData.data?.total_affected_items || 0
      });
      
      return responseData;
    };

    // Get or refresh JWT token
    let jwtToken = cachedToken?.token;
    let finalBaseUrl = cleanBaseUrl;
    
    if (!jwtToken) {
      try {
        // Try HTTP first if we detect HTTPS (common for self-signed certs)
        const shouldTryHttp = cleanBaseUrl.startsWith('https://');
        const protocols = shouldTryHttp 
          ? [cleanBaseUrl.replace('https://', 'http://'), cleanBaseUrl] 
          : [cleanBaseUrl];
        
        let lastError;
        let authSuccess = false;
        
        for (const baseUrl of protocols) {
          try {
            const authUrl = `${baseUrl}/security/user/authenticate`;
            console.log(`Trying authentication with: ${baseUrl}`);
            
            const authResult = await attemptAuth(authUrl, baseUrl.startsWith('http://'));
            finalBaseUrl = authResult.baseUrl;
            jwtToken = authResult.token;
            authSuccess = true;
            console.log(`Authentication successful using: ${baseUrl.startsWith('http://') ? 'HTTP' : 'HTTPS'}`);
            break;
          } catch (error) {
            console.log(`Failed with ${baseUrl.startsWith('http://') ? 'HTTP' : 'HTTPS'}: ${error.message}`);
            lastError = error;
          }
        }
        
        if (!authSuccess) {
          throw new Error(`All authentication attempts failed. Last error: ${lastError?.message}`);
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
      }
    }

    // Make the actual API request
    const responseData = await makeApiRequest(finalBaseUrl, jwtToken);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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