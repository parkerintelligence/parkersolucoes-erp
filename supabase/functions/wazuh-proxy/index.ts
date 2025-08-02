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
    const { method, endpoint, integrationId, diagnostics } = requestBody;

    console.log('Wazuh proxy request:', { method, endpoint, integrationId, userId: user.id, diagnostics });

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

    // Handle diagnostic mode for testing connectivity
    if (diagnostics) {
      return await handleDiagnostics(cleanBaseUrl, username, password, endpoint);
    }

    console.log(`Making direct Wazuh API request to: ${cleanBaseUrl}${endpoint}`);
    
    // Make direct API request with Basic Auth (more common for Wazuh)
    const apiUrl = `${cleanBaseUrl}${endpoint}`;
    const basicAuth = btoa(`${username}:${password}`);
    
    console.log('Using HTTP Basic Authentication for Wazuh API');

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const apiResponse = await fetch(apiUrl, {
        method: method || 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Wazuh-Proxy/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log(`Wazuh API response status: ${apiResponse.status} ${apiResponse.statusText}`);

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
            const authTimeoutId = setTimeout(() => authController.abort(), 15000);
            
            const authResponse = await fetch(`${cleanBaseUrl}/security/user/authenticate`, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Supabase-Wazuh-Proxy/1.0',
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
                const tokenTimeoutId = setTimeout(() => tokenController.abort(), 30000);
                
                const tokenApiResponse = await fetch(apiUrl, {
                  method: method || 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Supabase-Wazuh-Proxy/1.0',
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
            
            // If it's an AbortError, it was a timeout
            if (tokenError.name === 'AbortError') {
              console.error('Token authentication timed out');
            }
          }
        }
        
        throw new Error(`Wazuh API request failed: ${apiResponse.status} ${apiResponse.statusText}`);
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific fetch errors
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out after 30 seconds');
        throw new Error('Wazuh API request timed out. Please check your network connection and Wazuh server status.');
      }
      
      console.error('Network error during Wazuh API request:', fetchError);
      
      // Provide more helpful error messages based on the error type
      if (fetchError.message.includes('certificate')) {
        throw new Error('SSL Certificate error. Please ensure your Wazuh server has a valid SSL certificate or configure it to accept self-signed certificates.');
      }
      
      if (fetchError.message.includes('network')) {
        throw new Error('Network connection error. Please check if the Wazuh server is reachable and the URL is correct.');
      }
      
      throw new Error(`Network error connecting to Wazuh API: ${fetchError.message}`);
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

// Diagnostic function to test Wazuh connectivity
async function handleDiagnostics(baseUrl: string, username: string, password: string, endpoint?: string) {
  console.log('🔍 Starting Wazuh connectivity diagnostics...');
  
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    baseUrl,
    endpoint: endpoint || '/version',
    tests: [] as any[]
  };

  const basicAuth = btoa(`${username}:${password}`);

  // Test 1: Basic connectivity test
  try {
    console.log('🧪 Test 1: Basic connectivity');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const testUrl = `${baseUrl}/version`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Wazuh-Proxy-Diagnostics/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    diagnosticResults.tests.push({
      name: 'Basic Connectivity',
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      details: `Response status: ${response.status} ${response.statusText}`,
      responseHeaders: Object.fromEntries(response.headers.entries())
    });

    if (response.ok) {
      const responseData = await response.json();
      diagnosticResults.tests[0].responseData = responseData;
    }

  } catch (error) {
    console.error('🚨 Basic connectivity test failed:', error);
    diagnosticResults.tests.push({
      name: 'Basic Connectivity',
      success: false,
      error: error.message,
      errorType: error.name,
      details: error.name === 'AbortError' ? 'Request timed out after 10 seconds' : error.message
    });
  }

  // Test 2: Alternative ports if main failed
  if (!diagnosticResults.tests[0]?.success) {
    console.log('🧪 Test 2: Trying alternative ports');
    const ports = ['55000', '443', '80'];
    const baseUrlWithoutPort = baseUrl.replace(/:(\d+)/, '');
    
    for (const port of ports) {
      if (baseUrl.includes(`:${port}`)) continue; // Skip if it's the original port
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const altUrl = `${baseUrlWithoutPort}:${port}/version`;
        const response = await fetch(altUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Wazuh-Proxy-Diagnostics/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        diagnosticResults.tests.push({
          name: `Alternative Port ${port}`,
          success: response.ok,
          status: response.status,
          url: altUrl,
          details: `Tried port ${port}: ${response.status} ${response.statusText}`
        });

        if (response.ok) break; // Stop if we found a working port

      } catch (error) {
        diagnosticResults.tests.push({
          name: `Alternative Port ${port}`,
          success: false,
          error: error.message,
          url: `${baseUrlWithoutPort}:${port}/version`
        });
      }
    }
  }

  // Test 3: Authentication methods
  console.log('🧪 Test 3: Authentication methods');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const authUrl = `${baseUrl}/security/user/authenticate`;
    const authResponse = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Wazuh-Proxy-Diagnostics/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    diagnosticResults.tests.push({
      name: 'Token Authentication',
      success: authResponse.ok,
      status: authResponse.status,
      details: `Authentication endpoint: ${authResponse.status} ${authResponse.statusText}`
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      diagnosticResults.tests[diagnosticResults.tests.length - 1].hasToken = !!authData.data?.token;
    }

  } catch (error) {
    diagnosticResults.tests.push({
      name: 'Token Authentication',
      success: false,
      error: error.message,
      details: 'Failed to test token authentication'
    });
  }

  // Test 4: SSL Certificate validation
  console.log('🧪 Test 4: SSL Certificate info');
  if (baseUrl.startsWith('https://')) {
    try {
      // Extract hostname for SSL info
      const url = new URL(baseUrl);
      diagnosticResults.tests.push({
        name: 'SSL Certificate',
        hostname: url.hostname,
        port: url.port || '443',
        protocol: url.protocol,
        details: 'HTTPS connection detected',
        recommendation: 'If connection fails, check if certificate is self-signed or expired'
      });
    } catch (error) {
      diagnosticResults.tests.push({
        name: 'SSL Certificate',
        success: false,
        error: 'Invalid URL format'
      });
    }
  }

  console.log('🔍 Diagnostics completed:', diagnosticResults);
  
  return new Response(JSON.stringify({
    success: true,
    diagnostics: diagnosticResults,
    summary: {
      totalTests: diagnosticResults.tests.length,
      passedTests: diagnosticResults.tests.filter(t => t.success).length,
      hasConnectivity: diagnosticResults.tests.some(t => t.success),
      recommendations: generateRecommendations(diagnosticResults.tests)
    }
  }), {
    headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json' 
    },
  });
}

function generateRecommendations(tests: any[]) {
  const recommendations = [];
  
  const hasBasicConnectivity = tests.find(t => t.name === 'Basic Connectivity')?.success;
  const hasAlternativePort = tests.some(t => t.name.includes('Alternative Port') && t.success);
  const hasAuth = tests.find(t => t.name === 'Token Authentication')?.success;
  
  if (!hasBasicConnectivity && !hasAlternativePort) {
    recommendations.push('❌ No connectivity detected. Check if Wazuh server is running and accessible.');
    recommendations.push('🔧 Verify firewall settings and network connectivity.');
    recommendations.push('🌐 Ensure the URL format is correct (https://your-wazuh-server:55000).');
  }
  
  if (hasAlternativePort && !hasBasicConnectivity) {
    const workingPort = tests.find(t => t.name.includes('Alternative Port') && t.success);
    recommendations.push(`✅ Connection works on port ${workingPort?.name?.split(' ')[2]}. Consider updating your base URL.`);
  }
  
  if (!hasAuth) {
    recommendations.push('🔐 Authentication failed. Verify username and password.');
    recommendations.push('👤 Check if the user account exists and has proper permissions in Wazuh.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All tests passed! Wazuh connection should be working.');
  }
  
  return recommendations;
}