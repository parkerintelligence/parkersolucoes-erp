import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utility function to clean and validate URLs
function cleanBaseUrl(url: string): string {
  let cleaned = url.replace(/\/+$/, ''); // Remove trailing slashes
  
  // Add protocol if missing
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  
  // Add default port if not specified
  const hasPort = cleaned.split('://')[1]?.includes(':');
  if (!hasPort) {
    cleaned += ':55000';
  }
  
  // Ensure /api is in the path if not present
  if (!cleaned.includes('/api')) {
    cleaned += '/api';
  }
  
  return cleaned;
}

// Utility function to test connectivity
async function testConnectivity(baseUrl: string, username: string, password: string): Promise<{ success: boolean, method: string, error?: string }> {
  const testEndpoint = '/';
  const basicAuth = btoa(`${username}:${password}`);
  
  // Test HTTPS first
  try {
    const httpsUrl = `${baseUrl.replace('http://', 'https://')}${testEndpoint}`;
    const response = await fetch(httpsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok || response.status === 401) { // 401 is ok, means server is reachable
      return { success: true, method: 'https' };
    }
  } catch (error) {
    console.log("HTTPS test failed:", error.message);
  }
  
  // Test HTTP fallback
  try {
    const httpUrl = `${baseUrl.replace('https://', 'http://')}${testEndpoint}`;
    const response = await fetch(httpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok || response.status === 401) {
      return { success: true, method: 'http' };
    }
  } catch (error) {
    return { success: false, method: 'none', error: error.message };
  }
  
  return { success: false, method: 'none', error: 'No protocol worked' };
}

serve(async (req) => {
  console.log("Wazuh-proxy function starting...");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check for Authorization header first
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: 'No Authorization header found',
          hint: 'Please make sure you are logged in and try again'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log("Creating Supabase client...");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    console.log("Authenticating user...");
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    console.log('User authentication result:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      error: authError?.message 
    });

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: authError?.message || 'No user found',
          hint: 'Please make sure you are logged in and try again. Your session may have expired.',
          authHeader: 'Present but invalid'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`User authenticated: ${user.id}`);

    const { method, endpoint, integrationId } = await req.json()
    console.log("Wazuh proxy request:", {
      method,
      endpoint,
      integrationId,
      userId: user.id
    });

    // Special endpoint for connectivity testing
    if (endpoint === '/test-connectivity') {
      console.log("Testing connectivity...");
      
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'wazuh')
        .eq('id', integrationId)
        .eq('is_active', true)
        .single()

      if (integrationError || !integration) {
        console.error("Integration error in test:", integrationError);
        return new Response(
          JSON.stringify({ 
            error: 'Wazuh integration not found or not active',
            details: integrationError?.message || 'No integration found'
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Handle both old and new integration data structure
      let base_url, username, password;
      
      if (integration.config && integration.config.baseUrl) {
        // New structure with config object
        base_url = integration.config.baseUrl;
        username = integration.config.username;
        password = integration.config.password;
      } else {
        // Old structure with direct columns
        base_url = integration.base_url;
        username = integration.username;
        password = integration.password;
      }
      if (!base_url || !username || !password) {
        return new Response(
          JSON.stringify({ error: 'Wazuh integration configuration incomplete' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const cleanedUrl = cleanBaseUrl(base_url);
      const connectivityTest = await testConnectivity(cleanedUrl, username, password);
      
      return new Response(
        JSON.stringify({
          connectivity: connectivityTest,
          config: {
            original_url: base_url,
            cleaned_url: cleanedUrl,
            has_credentials: !!(username && password)
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log("Fetching Wazuh integration...");
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'wazuh')
      .eq('id', integrationId)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      console.error("Integration error:", integrationError);
      return new Response(
        JSON.stringify({ 
          error: 'Wazuh integration not found or not active',
          details: integrationError?.message || 'No integration found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log("Integration found:", {
      id: integration.id,
      name: integration.name,
      is_active: integration.is_active,
      config_keys: integration.config ? Object.keys(integration.config) : 'no config'
    });

    // Handle both old and new integration data structure
    let base_url, username, password;
    
    if (integration.config && integration.config.baseUrl) {
      // New structure with config object
      base_url = integration.config.baseUrl;
      username = integration.config.username;
      password = integration.config.password;
    } else {
      // Old structure with direct columns
      base_url = integration.base_url;
      username = integration.username;
      password = integration.password;
    }

    console.log("Extracted credentials:", {
      has_base_url: !!base_url,
      has_username: !!username,
      has_password: !!password,
      base_url_preview: base_url ? base_url.substring(0, 20) + '...' : 'none'
    });
    
    if (!base_url || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'Wazuh integration configuration incomplete' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Clean and prepare the base URL
    const cleanedBaseUrl = cleanBaseUrl(base_url);
    console.log(`Cleaned URL: ${cleanedBaseUrl}`);

    // Test connectivity first
    const connectivity = await testConnectivity(cleanedBaseUrl, username, password);
    if (!connectivity.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot connect to Wazuh server',
          details: connectivity.error,
          troubleshooting: {
            original_url: base_url,
            cleaned_url: cleanedBaseUrl,
            suggestions: [
              "Check if Wazuh server is running",
              "Verify firewall allows port 55000",
              "Check if URL is correct",
              "Try both HTTP and HTTPS protocols"
            ]
          }
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Using ${connectivity.method.toUpperCase()} protocol for Wazuh API`);
    
    const protocol = connectivity.method === 'https' ? 'https://' : 'http://';
    const wazuhApiUrl = `${cleanedBaseUrl.replace(/https?:\/\//, protocol)}${endpoint}`;
    console.log(`Making Wazuh API request to: ${wazuhApiUrl}`);

    const basicAuth = btoa(`${username}:${password}`)
    const fetchOptions = {
      method,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    }

    console.log("Fetch options:", JSON.stringify({
      method: fetchOptions.method,
      headers: { ...fetchOptions.headers, Authorization: '[REDACTED]' },
      url: wazuhApiUrl
    }, null, 2));

    const response = await fetch(wazuhApiUrl, fetchOptions)
    
    console.log(`Wazuh API response: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error(`Wazuh API returned ${response.status}: ${response.statusText}`);
      
      // Try token authentication if basic auth failed
      if (response.status === 401 || response.status === 403) {
        console.log("Basic auth failed, attempting token authentication...");
        
        try {
          const authUrl = `${cleanedBaseUrl.replace(/https?:\/\//, protocol)}/security/user/authenticate`;
          const authResponse = await fetch(authUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: username,
              password: password
            }),
            signal: AbortSignal.timeout(15000),
          });
          
          if (authResponse.ok) {
            const authData = await authResponse.json();
            const token = authData.data?.token;
            
            if (token) {
              console.log("Got authentication token, retrying request...");
              const retryResponse = await fetch(wazuhApiUrl, {
                ...fetchOptions,
                headers: {
                  ...fetchOptions.headers,
                  'Authorization': `Bearer ${token}`,
                },
                signal: AbortSignal.timeout(30000),
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.text();
                let parsedData;
                try {
                  parsedData = JSON.parse(retryData);
                } catch {
                  parsedData = { data: retryData, raw: true };
                }
                
                return new Response(JSON.stringify(parsedData), {
                  headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Wazuh-Auth': 'token',
                    'X-Wazuh-Protocol': connectivity.method
                  },
                });
              }
            }
          }
        } catch (tokenError) {
          console.error("Token authentication failed:", tokenError);
        }
      }

      return new Response(
        JSON.stringify({ 
          error: `Wazuh API error: ${response.status} ${response.statusText}`,
          details: `Failed to connect to ${wazuhApiUrl}`,
          troubleshooting: {
            status: response.status,
            url: wazuhApiUrl,
            protocol: connectivity.method,
            suggestion: response.status >= 500 ? 
              "Server error - check if Wazuh server is running" :
              response.status === 401 || response.status === 403 ?
              "Authentication error - check username/password" :
              "Network error - check URL and network connectivity"
          }
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const contentType = response.headers.get('Content-Type') || '';
    let responseData;
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
      // Try to parse as JSON if it looks like JSON
      try {
        responseData = JSON.parse(responseData);
      } catch {
        // If not JSON, return as text wrapped in an object
        responseData = { data: responseData, raw: true };
      }
    }

    console.log("Wazuh API response received successfully");

    return new Response(JSON.stringify(responseData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Wazuh-Status': 'success',
        'X-Wazuh-Protocol': connectivity.method
      },
    })

  } catch (error) {
    console.error('Error in wazuh-proxy function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        type: error.name,
        troubleshooting: {
          suggestion: "Check network connectivity and Wazuh server status",
          common_issues: [
            "Firewall blocking port 55000",
            "SSL certificate issues",
            "Wazuh server not running",
            "Incorrect URL or credentials",
            "Network timeout"
          ]
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})