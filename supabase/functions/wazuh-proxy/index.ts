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
      // Default to HTTPS for Wazuh API
      cleanBaseUrl = `https://${cleanBaseUrl}`;
    }
    
    // Add default Wazuh API port (55000) if not specified
    if (!cleanBaseUrl.match(/:\d+$/)) {
      cleanBaseUrl = cleanBaseUrl + ':55000';
    }

    console.log(`Connecting to Wazuh API: ${cleanBaseUrl}${endpoint}`);
    console.log('Authenticating with Wazuh API...');

    const basicAuth = btoa(`${username}:${password}`);
    
    // Simple authentication function - no fallbacks, no custom clients
    const authenticateWithWazuh = async (baseUrl: string): Promise<string> => {
      const authUrl = `${baseUrl}/security/user/authenticate`;
      
      console.log(`🔐 Authenticating to: ${authUrl}`);
      
      const authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        }
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error(`❌ Auth failed: ${authResponse.status} - ${errorText}`);
        throw new Error(`Authentication failed: ${authResponse.status}`);
      }

      const authData = await authResponse.json();
      console.log('✅ Authentication successful');
      
      return authData.data?.token;
    };
    
    // Get JWT token
    console.log('🔄 Getting JWT token...');
    
    let jwtToken: string;
    try {
      jwtToken = await authenticateWithWazuh(cleanBaseUrl);
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      
      return new Response(
        JSON.stringify({
          error: '❌ Wazuh Authentication Failed',
          details: error.message,
          suggestions: [
            '🔴 PROBLEM: Cannot authenticate with Wazuh API',
            '',
            '⚙️  Check the following:',
            '',
            '1️⃣  Verify the Wazuh URL is correct (should be https://your-server:55000)',
            '',
            '2️⃣  Verify username and password are correct',
            '',
            '3️⃣  Check that the Wazuh API is running:',
            '   sudo systemctl status wazuh-manager',
            '',
            '4️⃣  Check firewall allows port 55000:',
            '   sudo ufw status',
            '   sudo ufw allow 55000/tcp',
            '',
            '5️⃣  If using HTTPS, ensure you have a valid SSL certificate (not self-signed)',
            '',
            '📖 See "Guia de Setup" tab for detailed instructions'
          ]
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
    if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('UnknownIssuer')) {
      errorMessage = '🔒 SSL Certificate Problem';
      errorDetails = 'Wazuh HTTPS connection failed due to certificate issues. Deno (used by Supabase) requires valid SSL certificates.';
      suggestions = [
        '⚠️  HTTPS with self-signed certificates is not supported',
        '',
        '📋 Solutions:',
        '1. Install a valid SSL certificate (Let\'s Encrypt recommended)',
        '2. OR configure Wazuh for HTTP if on private network',
        '',
        '📖 See "Guia de Setup" tab for detailed instructions'
      ];
    } else if (error.message.includes('connection') || error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      errorMessage = '❌ Cannot Connect to Wazuh';
      errorDetails = `Connection to Wazuh server failed: ${error.message}`;
      suggestions = [
        '🔴 Check the following:',
        '',
        '1️⃣  Verify the Wazuh URL is correct',
        '',
        '2️⃣  Check that Wazuh API is running:',
        '   sudo systemctl status wazuh-manager',
        '',
        '3️⃣  Check firewall allows port 55000:',
        '   sudo ufw status',
        '   sudo ufw allow 55000/tcp',
        '',
        '4️⃣  Test locally on server:',
        '   curl -k https://localhost:55000',
        '',
        '📖 See "Guia de Setup" tab for details'
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