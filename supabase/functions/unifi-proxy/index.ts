import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const isTlsCertificateError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /UnknownIssuer|invalid peer certificate|self[- ]signed|certificate|CERT/i.test(message);
};

const fetchIgnoringCerts = async (url: string, options: RequestInit = {}) => {
  const hostname = new URL(url).hostname;
  console.log(`[TLS-BYPASS] Creating insecure client for hostname: ${hostname}`);
  
  // Create a fresh client each time – Supabase Edge Functions may GC cached clients
  const insecureClient = Deno.createHttpClient({
    certs: [],                              // empty CA store
    // deno-lint-ignore no-deprecated-deno-api
  });

  try {
    return await fetch(url, { ...options, client: insecureClient } as any);
  } catch (err) {
    // If empty certs didn't work, try dangerouslyIgnoreCertificateErrors
    console.log(`[TLS-BYPASS] Empty certs failed, trying dangerouslyIgnoreCertificateErrors for ${hostname}`);
    const insecureClient2 = Deno.createHttpClient({
      dangerouslyIgnoreCertificateErrors: [hostname],
    });
    return await fetch(url, { ...options, client: insecureClient2 } as any);
  }
};

const fetchWithTlsFallback = async (url: string, options: RequestInit = {}, allowInsecureFallback: boolean = true) => {
  // For HTTPS URLs with self-signed certs, try insecure first if the URL is known to fail
  try {
    return await fetch(url, options);
  } catch (error) {
    if (!allowInsecureFallback || !isTlsCertificateError(error)) {
      throw error;
    }

    console.warn(`[TLS-FALLBACK] Certificate error for ${url}, retrying with TLS bypass...`);
    try {
      return await fetchIgnoringCerts(url, options);
    } catch (retryError) {
      console.error(`[TLS-FALLBACK] Insecure fetch also failed:`, retryError instanceof Error ? retryError.message : retryError);
      throw retryError;
    }
  }
};

console.log("UniFi Local Controller API proxy function starting...");

serve(async (req) => {
  console.log(`Received ${req.method} request to unifi-proxy`);
  
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
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Authorization header is required');
    }

    console.log("Authenticating user...");
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    // Create a client with the user's token instead of service role
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await userSupabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication failed:', { 
        error: authError?.message, 
        hasUser: !!user,
        tokenPresent: !!token 
      });
      throw new Error(`Authentication failed: ${authError?.message || 'User not found'}`);
    }

    console.log(`User authenticated: ${user.id}`);

    const requestBody = await req.json();
    const { method, endpoint, integrationId, data: postData, ignore_ssl = false } = requestBody;

    console.log('UniFi API request:', { method, endpoint, integrationId, userId: user.id });

    // Get UniFi integration configuration
    console.log("Fetching UniFi integration...");
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('type', 'unifi')
      .or(`user_id.eq.${user.id},is_global.eq.true`)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      throw new Error('UniFi integration not found');
    }

    console.log("Integration found:", { id: integration.id, name: integration.name, is_active: integration.is_active });

    if (!integration.is_active) {
      throw new Error('UniFi integration is not active');
    }

    // Determine connection mode based on integration data + endpoint requested
    const { base_url, username, password, api_token, use_ssl = true } = integration;
    const normalizedBaseUrl = typeof base_url === 'string' ? base_url.trim().replace(/\/+$/, '') : '';
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password.trim() : '';
    const normalizedApiToken = typeof api_token === 'string' ? api_token.trim() : '';

    const hasLocalCredentials = !!(normalizedBaseUrl && normalizedUsername && normalizedPassword);
    const hasApiToken = !!normalizedApiToken;
    const endpointIsLocalController = typeof endpoint === 'string' && endpoint.startsWith('/api/');

    // If endpoint is local (/api/*), prioritize local controller when credentials exist.
    const useLocalController = hasLocalCredentials && (endpointIsLocalController || !hasApiToken);
    const useSiteManagerApi = hasApiToken && !useLocalController;

    console.log("Integration config:", {
      hasBaseUrl: !!normalizedBaseUrl,
      hasUsername: !!normalizedUsername,
      hasPassword: !!normalizedPassword,
      hasApiToken: !!normalizedApiToken,
      useSSL: use_ssl,
      endpoint,
      endpointIsLocalController,
      useLocalController,
      useSiteManagerApi
    });

    if (!useLocalController && !useSiteManagerApi) {
      console.error('Invalid UniFi integration configuration');
      throw new Error('UniFi integration requires either (base_url, username, password) for local controller OR (api_token) for Site Manager API');
    }

    let baseApiUrl;
    if (useLocalController) {
      // Use local UniFi Controller
      baseApiUrl = normalizedBaseUrl;

      if (!use_ssl && baseApiUrl.startsWith('https://')) {
        baseApiUrl = toHttpUrl(baseApiUrl);
      } else if (use_ssl && baseApiUrl.startsWith('http://')) {
        baseApiUrl = baseApiUrl.replace(/^http:\/\//i, 'https://');
      }

      console.log('Using UniFi Local Controller:', baseApiUrl);
    } else {
      // Use Site Manager API
      baseApiUrl = 'https://api.ui.com';
      console.log('Using UniFi Site Manager API:', baseApiUrl);
    }
    console.log('API endpoint:', endpoint);

    if (useLocalController) {
      // LOCAL CONTROLLER - Authenticate with username/password
      let activeBaseApiUrl = baseApiUrl;
      let loginUrl = `${activeBaseApiUrl}/api/auth/login`;
      console.log('=== UNIFI CONTROLLER CONNECTION DIAGNOSTICS ===');
      console.log('Controller URL:', activeBaseApiUrl);
      console.log('Login endpoint:', loginUrl);
      console.log('Username provided:', !!username);
      console.log('Password provided:', !!password);
      console.log('Use SSL configured:', use_ssl);
      console.log('Ignore SSL configured:', requestBody.ignore_ssl);
      
      // Enhanced connection diagnostics
      const connectionDetails = {
        originalUrl: activeBaseApiUrl,
        loginUrl: loginUrl,
        isHttps: loginUrl.startsWith('https://'),
        hostname: new URL(activeBaseApiUrl).hostname,
        port: new URL(activeBaseApiUrl).port || (loginUrl.startsWith('https://') ? '443' : '80'),
        protocol: new URL(activeBaseApiUrl).protocol
      };
      console.log('Connection details:', connectionDetails);

      // Try local login with SSL bypass for self-signed certificates
      let loginResponse: Response;

      if (requestBody.ignore_ssl && loginUrl.startsWith('https://')) {
        console.log('SSL certificate validation disabled for local controller');
      }
      
      console.log('Attempting connection with SSL bypass (self-signed cert support)...');

      const loginBody = JSON.stringify({
        username: normalizedUsername,
        password: normalizedPassword,
        remember: true
      });

      const loginHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Lovable-UniFi-Integration/1.0'
      };

      const executeLogin = async (targetLoginUrl: string, allowTlsFallback: boolean) => {
        let response = await fetchWithTlsFallback(targetLoginUrl, {
          method: 'POST',
          headers: loginHeaders,
          body: loginBody
        }, allowTlsFallback);

        if (response.status === 404) {
          const legacyLoginUrl = `${targetLoginUrl.replace(/\/api\/auth\/login$/, '')}/api/login`;
          console.log('Trying legacy login endpoint:', legacyLoginUrl);
          response = await fetchWithTlsFallback(legacyLoginUrl, {
            method: 'POST',
            headers: loginHeaders,
            body: loginBody
          }, allowTlsFallback);
          console.log(`Legacy login response: status=${response.status}`);
        }

        return response;
      };

      try {
        const startTime = Date.now();
        loginResponse = await executeLogin(loginUrl, true);
        const responseTime = Date.now() - startTime;
        console.log(`Login response: status=${loginResponse.status}, time=${responseTime}ms`);
      } catch (connError) {
        const httpsError = connError instanceof Error ? connError.message : String(connError);
        console.error('Connection error:', httpsError);

        if (!activeBaseApiUrl.startsWith('https://')) {
          throw new Error(`Falha ao conectar na controladora: ${httpsError}. Verifique se a URL ${activeBaseApiUrl} está acessível.`);
        }

        const httpBaseApiUrl = toHttpUrl(activeBaseApiUrl);
        const httpLoginUrl = `${httpBaseApiUrl}/api/auth/login`;
        console.warn(`HTTPS falhou, tentando fallback HTTP: ${httpLoginUrl}`);

        try {
          loginResponse = await executeLogin(httpLoginUrl, false);
          activeBaseApiUrl = httpBaseApiUrl;
          loginUrl = httpLoginUrl;
          console.log('HTTP fallback login successful. Continuing with:', activeBaseApiUrl);
        } catch (httpError) {
          const httpConnectionError = httpError instanceof Error ? httpError.message : String(httpError);
          console.error('HTTP fallback also failed:', httpConnectionError);
          throw new Error(`Falha ao conectar na controladora. HTTPS: ${httpsError}. HTTP: ${httpConnectionError}. Verifique URL, porta e firewall da controladora.`);
        }
      }

      if (!loginResponse.ok) {
        const loginErrorText = await loginResponse.text();
        console.error('Login failed:', loginResponse.status, loginErrorText);
        
        if (loginResponse.status === 401) {
          throw new Error('Credenciais inválidas. Verifique usuário e senha da controladora.');
        } else if (loginResponse.status === 403) {
          throw new Error('Acesso proibido. Verifique permissões do usuário.');
        } else {
          throw new Error(`Erro de autenticação (${loginResponse.status}): ${loginErrorText}`);
        }
      }

      // Extract cookies from login response
      const headerWithSetCookie = loginResponse.headers as Headers & { getSetCookie?: () => string[] };
      const cookieList = headerWithSetCookie.getSetCookie?.() || [];
      const setCookieHeaders = cookieList.length > 0
        ? cookieList.map((cookie) => cookie.split(';')[0]).join('; ')
        : (loginResponse.headers.get('set-cookie') || '');
      const csrfToken = loginResponse.headers.get('x-csrf-token') || '';
      console.log('Login successful, cookies present:', !!setCookieHeaders, 'csrf token present:', !!csrfToken);

      // Make API request to UniFi Controller
      let apiUrl = `${activeBaseApiUrl}${endpoint}`;
      console.log('Making Controller API request to:', apiUrl);

      const apiHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (setCookieHeaders) {
        apiHeaders['Cookie'] = setCookieHeaders;
      }

      if (csrfToken) {
        apiHeaders['X-CSRF-Token'] = csrfToken;
      }

      const apiBody = (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH'))
        ? JSON.stringify(postData)
        : undefined;

      const shouldAllowTlsFallback = activeBaseApiUrl.startsWith('https://');

      let apiResponse = await fetchWithTlsFallback(apiUrl, {
        method: method || 'GET',
        headers: apiHeaders,
        body: apiBody
      }, shouldAllowTlsFallback);

      // UniFi OS controllers often expose Network API under /proxy/network
      if (apiResponse.status === 404 && !endpoint.startsWith('/proxy/network')) {
        const prefixedEndpoint = `/proxy/network${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const prefixedUrl = `${activeBaseApiUrl}${prefixedEndpoint}`;
        console.warn('Retrying with /proxy/network prefix:', prefixedUrl);

        apiResponse = await fetchWithTlsFallback(prefixedUrl, {
          method: method || 'GET',
          headers: apiHeaders,
          body: apiBody
        }, shouldAllowTlsFallback);
        apiUrl = prefixedUrl;
      }

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('UniFi Controller API request failed:', apiResponse.status, errorText);
        console.error('Request details:', { url: apiUrl, method: method || 'GET', endpoint });

        if (apiResponse.status === 401) {
          throw new Error('Credenciais inválidas ou sessão expirada. Verifique usuário e senha.');
        } else if (apiResponse.status === 403) {
          throw new Error('Acesso negado. Verifique as permissões do usuário na controladora.');
        } else if (apiResponse.status === 404) {
          // Para 404, retornar uma resposta vazia ao invés de erro para alguns endpoints
          if (endpoint.includes('/sites') || endpoint.includes('/devices') || endpoint.includes('/clients')) {
            console.log('404 for data endpoint, returning empty response');
            return new Response(JSON.stringify({ data: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw new Error('Endpoint não encontrado. Verifique se o site existe na controladora.');
        }

        throw new Error(`UniFi Controller API request failed: ${apiResponse.status} - ${errorText}`);
      }

      const responseData = await apiResponse.json();
      console.log('UniFi Controller API successful, response structure:', {
        hasData: !!responseData,
        dataKeys: responseData ? Object.keys(responseData) : [],
        dataLength: Array.isArray(responseData?.data) ? responseData.data.length : 'not array',
        fullResponse: JSON.stringify(responseData, null, 2)
      });

      // Transform data structure for consistency with frontend
      let finalResponse;
      if (responseData?.data) {
        // Already in the expected format
        finalResponse = responseData;
      } else if (Array.isArray(responseData)) {
        // Wrap array response in data object
        finalResponse = { data: responseData };
      } else {
        // Single object response
        finalResponse = { data: responseData };
      }
      
      console.log('Final response being sent:', JSON.stringify(finalResponse, null, 2));

      return new Response(JSON.stringify(finalResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } else {
      // SITE MANAGER API - Use api_token authentication
      console.log('Using UniFi Site Manager API with token auth');
      
      // Map endpoints to Site Manager API format
      let siteManagerEndpoint = endpoint;
      
      // Transform local controller endpoints to Site Manager API v1 endpoints
      if (endpoint.includes('/api/self/sites')) {
        siteManagerEndpoint = '/v1/hosts';
      } else if (endpoint.includes('/v1/hosts/') && endpoint.includes('/sites')) {
        // /v1/hosts/{hostId}/sites has inconsistent availability; use official list-sites endpoint
        siteManagerEndpoint = '/v1/sites';
      } else if (endpoint.includes('/api/s/') && endpoint.includes('/stat/device')) {
        // Extract site ID from local controller endpoint format
        const match = endpoint.match(/\/api\/s\/([^\/]+)\/stat\/device/);
        const siteId = match ? match[1] : '';
        siteManagerEndpoint = `/v1/sites/${siteId}/devices`;
      } else if (endpoint.includes('/api/s/') && endpoint.includes('/stat/sta')) {
        const match = endpoint.match(/\/api\/s\/([^\/]+)\/stat\/sta/);
        const siteId = match ? match[1] : '';
        siteManagerEndpoint = `/v1/sites/${siteId}/clients`;
      } else if (endpoint.includes('/api/s/') && endpoint.includes('/rest/wlanconf')) {
        const match = endpoint.match(/\/api\/s\/([^\/]+)\/rest\/wlanconf/);
        const siteId = match ? match[1] : '';
        siteManagerEndpoint = `/v1/sites/${siteId}/networks`;
      } else if (endpoint.includes('/api/s/') && endpoint.includes('/stat/alarm')) {
        const match = endpoint.match(/\/api\/s\/([^\/]+)\/stat\/alarm/);
        const siteId = match ? match[1] : '';
        siteManagerEndpoint = `/v1/sites/${siteId}/events`;
      } else if (endpoint.includes('/api/s/') && endpoint.includes('/stat/health')) {
        const match = endpoint.match(/\/api\/s\/([^\/]+)\/stat\/health/);
        const siteId = match ? match[1] : '';
        siteManagerEndpoint = `/v1/sites/${siteId}/health`;
      } else if (endpoint.includes('/v1/')) {
        // Already a Site Manager API v1 endpoint
        siteManagerEndpoint = endpoint;
      } else if (endpoint.includes('/ea/hosts')) {
        // Convert old ea/hosts to v1/hosts
        siteManagerEndpoint = endpoint.replace('/ea/hosts', '/v1/hosts');
        // Also handle sites sub-endpoint
        siteManagerEndpoint = siteManagerEndpoint.replace('/ea/', '/v1/');
      }
      
      console.log('Endpoint mapping:', { original: endpoint, mapped: siteManagerEndpoint });
      
      const requestOptions: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': normalizedApiToken,
          'User-Agent': 'Lovable-UniFi-Integration/1.0'
        },
      };

      if (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(postData);
      }

      const apiUrl = `${baseApiUrl}${siteManagerEndpoint}`;
      console.log('Making Site Manager API request to:', apiUrl);

      const apiResponse = await fetch(apiUrl, requestOptions);
      
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Site Manager API request failed:', apiResponse.status, errorText);
        
        if (apiResponse.status === 401) {
          throw new Error('API Token inválido ou expirado. Verifique o token na configuração.');
        } else if (apiResponse.status === 403) {
          throw new Error('API Token não tem permissões necessárias para este endpoint.');
        } else if (apiResponse.status === 404) {
          // Para 404, retornar uma resposta vazia ao invés de erro para alguns endpoints
          if (endpoint.includes('/sites') || endpoint.includes('/devices') || endpoint.includes('/clients')) {
            console.log('404 for data endpoint, returning empty response');
            return new Response(JSON.stringify({ data: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw new Error('Endpoint não encontrado. Verifique se o site/host existe ou se a API mudou.');
        }
        
        throw new Error(`Site Manager API request failed: ${apiResponse.status} - ${errorText}`);
      }

      const responseData = await apiResponse.json();
      console.log('Site Manager API successful, response structure:', {
        hasData: !!responseData,
        dataKeys: responseData ? Object.keys(responseData) : [],
        dataLength: Array.isArray(responseData?.data) ? responseData.data.length : 'not array',
        fullResponse: JSON.stringify(responseData, null, 2)
      });

      // Transform Site Manager API response to match local controller format
      let finalResponse;
      if (siteManagerEndpoint === '/v1/hosts') {
        // Transform hosts response to match expected format
        const hosts = Array.isArray(responseData) ? responseData : (responseData?.data || []);
        
        console.log('Processing hosts response. Raw hosts count:', hosts.length);
        
        if (hosts.length === 0) {
          console.log('⚠️ DEBUGGING: No hosts found in Site Manager API');
          console.log('This indicates:');
          console.log('1. No UniFi controllers are registered with this Cloud account');
          console.log('2. Controllers may be local-only (not connected to Cloud)');
          console.log('3. API token may not have access to controllers');
          console.log('4. User should check unifi.ui.com to verify controller registration');
          
          finalResponse = {
            data: [],
            meta: {
              empty_response: true,
              suggestion: 'local_controller_setup',
              message: 'No controllers found in UniFi Cloud. Consider using local controller configuration.',
              debug_info: {
                raw_response: responseData,
                endpoint_called: apiUrl,
                token_used: true
              }
            }
          };
        } else {
          finalResponse = {
            data: hosts.map((host: any) => {
              // API can return camelCase or snake_case depending on version
              const reportedState = host.reportedState || host.reported_state;
              const userData = host.userData || host.user_data;
              const hardwareId = host.hardwareId || host.hardware_id;
              const registrationTime = host.registrationTime || host.registration_time;
              const lastConnectionStateChange = host.lastConnectionStateChange || host.last_connection_state_change;
              const isBlocked = host.isBlocked ?? host.is_blocked ?? false;
              
              return {
                id: host.id || hardwareId,
                hardwareId: hardwareId,
                type: reportedState?.host_type === 0 ? 'network-server' : (host.type || 'unknown'),
                ipAddress: reportedState?.ipAddrs?.[0] || host.ipAddress || host.ip_address || 'unknown',
                owner: host.owner || false,
                isBlocked: isBlocked,
                registrationTime: registrationTime,
                lastConnectionStateChange: lastConnectionStateChange,
                userData: userData,
                reportedState: reportedState,
                sitesCount: 0,
                isValid: true
              };
            })
          };
          
          console.log('Processed hosts:', finalResponse.data.map(h => ({
            id: h.id,
            name: h.reportedState?.name,
            state: h.reportedState?.state,
            ip: h.ipAddress
          })));
        }
      } else if (responseData?.data) {
        finalResponse = responseData;
      } else {
        finalResponse = { data: Array.isArray(responseData) ? responseData : [] };
      }
      
      console.log('Final response being sent:', JSON.stringify(finalResponse, null, 2));

      return new Response(JSON.stringify(finalResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in unifi-proxy function:', error);
    
    // Determine appropriate status code based on error type
    let status = 400;
    let errorMessage = 'Erro interno do servidor';
    let troubleshooting = '';
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Authentication failed')) {
        status = 401;
        errorMessage = 'Falha na autenticação. Verifique se você está logado.';
      } else if (error.message.includes('Credenciais inválidas') || error.message.includes('Check username/password')) {
        status = 400;
        errorMessage = 'Credenciais da Controladora UniFi inválidas.';
        troubleshooting = 'Verifique: 1) Usuário e senha estão corretos; 2) Usuário tem permissões de administrador; 3) Controladora está acessível.';
      } else if (error.message.includes('Authorization header')) {
        status = 401;
        errorMessage = 'Header de autorização ausente.';
      } else if (error.message.includes('Conexão falhou com HTTPS e HTTP')) {
        status = 502;
        errorMessage = 'Falha na conectividade de rede com a controladora.';
        troubleshooting = 'Verifique: 1) URL e porta estão corretos; 2) Controladora está online; 3) Firewall permite acesso; 4) Certificados SSL (se HTTPS).';
      } else if (error.message.includes('sending request for url')) {
        status = 502;
        errorMessage = 'Erro de conectividade SSL/TLS ou DNS.';
        troubleshooting = 'Problemas comuns: 1) Certificado auto-assinado (normal em controladora local); 2) Porta incorreta; 3) URL inacessível; 4) Problema de DNS.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: troubleshooting || 'Verifique a configuração da integração e conectividade de rede.',
        timestamp: new Date().toISOString()
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});