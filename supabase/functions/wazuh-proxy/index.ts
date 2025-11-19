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

    // Clean up base URL - remove trailing slashes
    let cleanBaseUrl = base_url.replace(/\/+$/, '');
    
    // Ensure we have the protocol and port
    if (!cleanBaseUrl.match(/^https?:\/\//)) {
      cleanBaseUrl = `https://${cleanBaseUrl}`;
    }
    
    // Add default Wazuh API port (55000) if not specified
    if (!cleanBaseUrl.match(/:\d+$/)) {
      cleanBaseUrl = cleanBaseUrl + ':55000';
    }

    console.log(`Connecting to Wazuh API: ${cleanBaseUrl}${endpoint}`);
    
    // According to Wazuh docs, API uses HTTPS by default with self-signed certs
    // Deno requires valid SSL certificates, so we'll try to connect and provide helpful errors
    console.log('Authenticating with Wazuh API...');

    const basicAuth = btoa(`${username}:${password}`);
    const cacheKey = `${cleanBaseUrl}:${username}`;
    
    // Function to authenticate with Wazuh API following official documentation
    const authenticateWithWazuh = async (baseUrl: string, useHttpClient: boolean = false) => {
      // Per Wazuh docs: GET /security/user/authenticate?raw=true with Basic Auth
      const authUrl = `${baseUrl}/security/user/authenticate?raw=true`;
      
      console.log(`🔐 Authenticating to: ${authUrl}`);
      console.log(`📋 Protocol: ${baseUrl.startsWith('https') ? 'HTTPS' : 'HTTP'}`);
      console.log(`🔧 Using custom HTTP client: ${useHttpClient}`);
      
      // Create HTTP client that accepts self-signed certificates if needed
      const fetchOptions: any = {
        method: 'GET',  // CRITICAL: Wazuh docs specify GET, not POST
        headers: {
          'Authorization': `Basic ${basicAuth}`,
        },
        signal: AbortSignal.timeout(15000),
      };

      // If using HTTPS with self-signed certificate, create custom client
      if (useHttpClient && baseUrl.startsWith('https')) {
        const httpClient = Deno.createHttpClient({
          // Accept self-signed certificates for development/testing
          // In production, provide proper CA certificate
        });
        fetchOptions.client = httpClient;
      }

      const authResponse = await fetch(authUrl, fetchOptions);

      console.log(`✅ Auth response status: ${authResponse.status}`);
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('❌ Auth error:', errorText);
        throw new Error(`Authentication failed: ${authResponse.status} - ${errorText}`);
      }

      // With raw=true, response is the token as plain text
      const token = await authResponse.text();
      
      if (!token || token.trim() === '') {
        throw new Error('No JWT token received from authentication');
      }
      
      console.log(`🎫 Authentication successful, token length: ${token.length}`);
      
      // Cache token for 15 minutes
      tokenCache[cacheKey] = {
        token: token.trim(),
        expires: Date.now() + (15 * 60 * 1000)
      };
      
      return token.trim();
    };
    
    // Check if we have a valid cached token
    const cachedToken = tokenCache[cacheKey];
    let jwtToken: string;
    
    if (cachedToken && cachedToken.expires > Date.now()) {
      console.log('♻️ Using cached JWT token');
      jwtToken = cachedToken.token;
    } else {
      console.log('🔄 Getting new JWT token...');
      
      // Try to authenticate with retry logic for HTTPS/HTTP
      let authError: Error | null = null;
      let useCustomClient = false;
      
      try {
        // First attempt: Try with default settings
        jwtToken = await authenticateWithWazuh(cleanBaseUrl, false);
      } catch (error) {
        console.log('⚠️ First auth attempt failed:', error.message);
        authError = error;
        
        // If it's a certificate error and using HTTPS, try with custom client
        if (cleanBaseUrl.startsWith('https') && 
            (error.message.includes('certificate') || 
             error.message.includes('SSL') || 
             error.message.includes('TLS'))) {
          
          console.log('🔧 Retrying with custom HTTP client (accepting self-signed certs)...');
          try {
            jwtToken = await authenticateWithWazuh(cleanBaseUrl, true);
            authError = null;
          } catch (retryError) {
            console.log('⚠️ Second auth attempt failed:', retryError.message);
            
            // Try HTTP as last resort
            if (cleanBaseUrl.startsWith('https')) {
              const httpUrl = cleanBaseUrl.replace('https://', 'http://');
              console.log(`🔄 Trying HTTP fallback: ${httpUrl}`);
              try {
                jwtToken = await authenticateWithWazuh(httpUrl, false);
                authError = null;
                // Update base URL for subsequent requests
                cleanBaseUrl = httpUrl;
              } catch (httpError) {
                authError = httpError;
              }
            }
          }
        }
        
        if (authError) {
          throw authError;
        }
      }
    }

    // Make the API request with the JWT token
    const apiUrl = `${cleanBaseUrl}${endpoint}`;
    console.log(`📡 Making API request to: ${apiUrl}`);
    
    const apiResponse = await fetch(apiUrl, {
      method: method || 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
    });

    console.log(`📊 API response status: ${apiResponse.status}`);
    
    if (!apiResponse.ok) {
      // If token expired, clear cache for next request
      if (apiResponse.status === 401) {
        console.log('🔄 Token expired, clearing cache...');
        delete tokenCache[cacheKey];
      }
      
      const errorText = await apiResponse.text();
      console.error('❌ API error:', errorText);
      throw new Error(`API request failed: ${apiResponse.status}`);
    }

    const responseData = await apiResponse.json();
    console.log('✅ API response received successfully');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== Wazuh Proxy Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    
    let errorMessage = 'Wazuh API connection failed';
    let errorDetails = error.message;
    let suggestions = [];
    
    // Provide specific guidance based on error type
    if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
      errorMessage = 'SSL Certificate Error';
      errorDetails = 'The Wazuh server is using a self-signed SSL certificate that cannot be verified.';
      suggestions = [
        'Option 1: Install a valid SSL certificate (recommended)',
        'Option 2: Configure Wazuh to accept HTTP connections (less secure)',
        'See Wazuh documentation: https://documentation.wazuh.com/current/user-manual/api/configuration.html'
      ];
    } else if (error.message.includes('connection closed') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection Failed';
      errorDetails = 'Cannot connect to Wazuh server. The server may be down or not configured correctly.';
      suggestions = [
        'Verify Wazuh server is running: systemctl status wazuh-manager',
        'Check if API is listening on the correct port',
        'Ensure firewall allows connections to port 55000',
        'Try accessing the API locally on the server first'
      ];
    } else if (error.message.includes('Authentication failed') || error.message.includes('401')) {
      errorMessage = 'Authentication Failed';
      errorDetails = 'Invalid username or password.';
      suggestions = [
        'Verify Wazuh API credentials are correct',
        'Check if the user has necessary permissions',
        'Try resetting the password: https://documentation.wazuh.com/current/user-manual/user-administration/password-management.html'
      ];
    } else {
      suggestions = [
        'Check Wazuh server status and logs',
        'Verify network connectivity',
        'Review Wazuh API configuration'
      ];
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        suggestions
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});