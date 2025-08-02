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

    // Clean up base URL and try multiple connection methods
    let cleanBaseUrl = base_url.replace(/\/+$/, '');
    
    // Normalize URL - ensure protocol is included
    if (!cleanBaseUrl.includes('://')) {
      cleanBaseUrl = `https://${cleanBaseUrl}`;
    }
    
    // Parse URL to get components
    let baseUrls = [];
    try {
      const urlObj = new URL(cleanBaseUrl);
      const baseHost = `${urlObj.protocol}//${urlObj.hostname}`;
      
      // If a specific port is provided, use it first
      if (urlObj.port) {
        baseUrls.push(cleanBaseUrl);
      } else {
        // Try common Wazuh ports in order of likelihood
        const ports = ['55000', '443', '9200', '5601'];
        baseUrls = ports.map(port => `${baseHost}:${port}`);
      }
    } catch (urlError) {
      console.error('Invalid URL format:', cleanBaseUrl);
      throw new Error(`Invalid URL format: ${cleanBaseUrl}`);
    }

    // Handle diagnostic mode for testing connectivity
    if (diagnostics) {
      return await handleDiagnostics(baseUrls, username, password, endpoint);
    }

    // Try multiple URLs until one works
    let lastError = null;
    for (const baseUrl of baseUrls) {
      console.log(`Trying Wazuh API request to: ${baseUrl}${endpoint}`);
      
      try {
        const result = await attemptWazuhConnection(baseUrl, endpoint, username, password, method);
        if (result) {
          console.log(`Successfully connected to Wazuh at: ${baseUrl}`);
          return result;
        }
      } catch (error) {
        console.log(`Failed to connect to ${baseUrl}: ${error.message}`);
        lastError = error;
        continue;
      }
    }
    
    // If all URLs failed, throw the last error
    throw lastError || new Error('All Wazuh connection attempts failed');
      
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

// Function to test basic connectivity before attempting full connection
async function testBasicConnectivity(baseUrl: string): Promise<{ success: boolean; error?: string; details?: string }> {
  try {
    const url = new URL(baseUrl);
    console.log(`🧪 Testing basic connectivity to ${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`);
    
    // Test with minimal timeout for quick connectivity check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for basic test
    
    const response = await fetch(`${baseUrl}/`, {
      method: 'HEAD', // Use HEAD for minimal data transfer
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return {
      success: true,
      details: `Basic connectivity OK: ${response.status} ${response.statusText}`
    };
    
  } catch (error) {
    console.log(`❌ Basic connectivity failed: ${error.message}`);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timeout',
        details: 'Server did not respond within 3 seconds'
      };
    }
    
    if (error.message.includes('certificate')) {
      return {
        success: false,
        error: 'SSL Certificate error',
        details: 'SSL certificate is invalid or self-signed'
      };
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
      return {
        success: false,
        error: 'Connection refused',
        details: 'Server is not accessible or firewall is blocking the connection'
      };
    }
    
    return {
      success: false,
      error: 'Network error',
      details: error.message
    };
  }
}

// Function to attempt connection to a specific Wazuh URL
async function attemptWazuhConnection(baseUrl: string, endpoint: string, username: string, password: string, method?: string) {
  // First test basic connectivity
  const connectivityTest = await testBasicConnectivity(baseUrl);
  if (!connectivityTest.success) {
    console.log(`⚠️ Basic connectivity failed for ${baseUrl}: ${connectivityTest.error}`);
    throw new Error(`${connectivityTest.error}: ${connectivityTest.details}`);
  }
  
  // Normalize endpoint for Wazuh API v4+
  let normalizedEndpoint = endpoint;
  
  // Map common endpoints to correct Wazuh API paths
  const endpointMapping: { [key: string]: string } = {
    '/agents': '/agents?pretty=true&limit=500',
    '/agents/summary/status': '/agents/summary/status?pretty=true',
    '/alerts': '/alerts?pretty=true&limit=100&sort=-timestamp',
    '/alerts/summary': '/overview/agents?pretty=true',
    '/compliance': '/overview/pci?pretty=true',
    '/vulnerability': '/vulnerability/agents?pretty=true&limit=100',
    '/version': '/?pretty=true',
    '//': '/?pretty=true', // For connection tests
  };
  
  // Check if we need to map the endpoint
  if (endpointMapping[endpoint]) {
    normalizedEndpoint = endpointMapping[endpoint];
  }
  
  const apiUrl = `${baseUrl}${normalizedEndpoint}`;
  const basicAuth = btoa(`${username}:${password}`);
  
  console.log(`🔄 Attempting Wazuh API call to: ${apiUrl}`);
  console.log(`🔑 Using endpoint mapping: ${endpoint} -> ${normalizedEndpoint}`);
  
  // Create AbortController for timeout - reduced timeout after basic connectivity test
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout per attempt

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
    
    console.log(`✅ Wazuh API response status: ${apiResponse.status} ${apiResponse.statusText} for ${apiUrl}`);

    if (!apiResponse.ok) {
      // Try token-based authentication if basic auth fails
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        console.log('🔑 Basic auth failed, trying token-based authentication...');
        
        const authController = new AbortController();
        const authTimeoutId = setTimeout(() => authController.abort(), 8000);
        
        const authResponse = await fetch(`${baseUrl}/security/user/authenticate?pretty=true`, {
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
            console.log('🎯 Token authentication successful, retrying API request');
            const tokenController = new AbortController();
            const tokenTimeoutId = setTimeout(() => tokenController.abort(), 12000);
            
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
              console.log('✅ Wazuh API response successful with token auth');
              
              // Transform response data to standard format
              const transformedData = transformWazuhResponse(responseData, endpoint);
              
              return new Response(JSON.stringify(transformedData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }
      }
      
      throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
    }

    // Check if response is JSON
    const contentType = apiResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await apiResponse.text();
      console.error('❌ Wazuh API returned non-JSON response:', responseText.substring(0, 200));
      throw new Error('Wazuh API returned invalid response format');
    }

    const responseData = await apiResponse.json();
    console.log('✅ Wazuh API response successful, data structure:', Object.keys(responseData));
    
    // Transform response data to standard format
    const transformedData = transformWazuhResponse(responseData, endpoint);

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (fetchError) {
    clearTimeout(timeoutId);
    
    console.error(`❌ Failed to connect to ${apiUrl}:`, fetchError.message);
    
    // Handle specific fetch errors
    if (fetchError.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    
    // Provide more helpful error messages
    if (fetchError.message.includes('certificate')) {
      throw new Error('SSL Certificate error');
    }
    
    if (fetchError.message.includes('network') || fetchError.message.includes('ECONNREFUSED')) {
      throw new Error('Connection refused - server may be down or unreachable');
    }
    
    throw fetchError;
  }
}

// Transform Wazuh response to consistent format
function transformWazuhResponse(responseData: any, originalEndpoint: string) {
  console.log(`🔄 Transforming response for endpoint: ${originalEndpoint}`);
  console.log(`📊 Response structure:`, JSON.stringify(responseData, null, 2).substring(0, 500));
  
  if (!responseData) {
    return { data: null, error: 'Empty response from Wazuh' };
  }

  // Handle different response structures based on endpoint
  switch (originalEndpoint) {
    case '/agents':
      return {
        data: {
          affected_items: responseData.data?.affected_items || responseData.affected_items || [],
          total_affected_items: responseData.data?.total_affected_items || responseData.total_affected_items || 0
        }
      };
      
    case '/agents/summary/status':
      return {
        data: responseData.data || responseData || {}
      };
      
    case '/alerts':
      return {
        data: {
          affected_items: responseData.data?.affected_items || responseData.affected_items || [],
          total_affected_items: responseData.data?.total_affected_items || responseData.total_affected_items || 0
        }
      };
      
    case '/alerts/summary':
      // This might return overview data, transform accordingly
      return {
        data: responseData.data || responseData || {}
      };
      
    case '/compliance':
    case '/vulnerability':
      return {
        data: responseData.data || responseData || {}
      };
      
    case '//':
    case '/version':
      // For connection tests and version info
      return responseData;
      
    default:
      return responseData;
  }
}

// Diagnostic function to test Wazuh connectivity

// Diagnostic function to test Wazuh connectivity
async function handleDiagnostics(baseUrls: string[], username: string, password: string, endpoint?: string) {
  console.log('🔍 Starting Wazuh connectivity diagnostics...');
  
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    baseUrls,
    endpoint: endpoint || '/version',
    tests: [] as any[]
  };

  const basicAuth = btoa(`${username}:${password}`);

  // Test all provided URLs
  console.log('🧪 Test 1: Testing all provided URLs');
  for (let i = 0; i < baseUrls.length; i++) {
    const baseUrl = baseUrls[i];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
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
        name: `Connectivity Test ${i + 1}`,
        url: baseUrl,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        details: `${baseUrl} responded with ${response.status} ${response.statusText}`,
        responseHeaders: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        try {
          const responseData = await response.json();
          diagnosticResults.tests[diagnosticResults.tests.length - 1].responseData = responseData;
        } catch (jsonError) {
          diagnosticResults.tests[diagnosticResults.tests.length - 1].jsonError = 'Failed to parse JSON response';
        }
      }

    } catch (error) {
      console.error(`🚨 Connectivity test failed for ${baseUrl}:`, error);
      diagnosticResults.tests.push({
        name: `Connectivity Test ${i + 1}`,
        url: baseUrl,
        success: false,
        error: error.message,
        errorType: error.name,
        details: error.name === 'AbortError' ? 'Request timed out after 8 seconds' : error.message
      });
    }
  }

  // Test 2: Authentication methods on working URLs
  console.log('🧪 Test 2: Authentication methods');
  const workingUrls = diagnosticResults.tests.filter(t => t.success).map(t => t.url);
  
  if (workingUrls.length > 0) {
    for (const workingUrl of workingUrls.slice(0, 2)) { // Test up to 2 working URLs
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const authUrl = `${workingUrl}/security/user/authenticate`;
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
          name: `Token Authentication (${workingUrl})`,
          url: workingUrl,
          success: authResponse.ok,
          status: authResponse.status,
          details: `Authentication endpoint: ${authResponse.status} ${authResponse.statusText}`
        });

        if (authResponse.ok) {
          try {
            const authData = await authResponse.json();
            diagnosticResults.tests[diagnosticResults.tests.length - 1].hasToken = !!authData.data?.token;
          } catch (jsonError) {
            diagnosticResults.tests[diagnosticResults.tests.length - 1].jsonError = 'Failed to parse auth JSON';
          }
        }

      } catch (error) {
        diagnosticResults.tests.push({
          name: `Token Authentication (${workingUrl})`,
          url: workingUrl,
          success: false,
          error: error.message,
          details: 'Failed to test token authentication'
        });
      }
    }
  } else {
    diagnosticResults.tests.push({
      name: 'Token Authentication',
      success: false,
      details: 'No working URLs found to test authentication'
    });
  }

  // Test 3: SSL Certificate validation
  console.log('🧪 Test 3: SSL Certificate info');
  const httpsUrls = baseUrls.filter(url => url.startsWith('https://'));
  
  if (httpsUrls.length > 0) {
    for (const httpsUrl of httpsUrls.slice(0, 3)) { // Test up to 3 HTTPS URLs
      try {
        const url = new URL(httpsUrl);
        diagnosticResults.tests.push({
          name: `SSL Certificate (${url.hostname}:${url.port || '443'})`,
          hostname: url.hostname,
          port: url.port || '443',
          protocol: url.protocol,
          url: httpsUrl,
          details: 'HTTPS connection detected',
          recommendation: 'If connection fails, check if certificate is self-signed or expired'
        });
      } catch (error) {
        diagnosticResults.tests.push({
          name: `SSL Certificate (${httpsUrl})`,
          success: false,
          error: 'Invalid URL format'
        });
      }
    }
  } else {
    diagnosticResults.tests.push({
      name: 'SSL Certificate',
      details: 'No HTTPS URLs provided - using HTTP may cause security warnings'
    });
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