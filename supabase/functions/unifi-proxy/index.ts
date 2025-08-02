import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

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
    const { method, endpoint, integrationId, data: postData } = requestBody;

    console.log('UniFi Local Controller API request:', { method, endpoint, integrationId, userId: user.id });

    // Get UniFi integration configuration
    console.log("Fetching UniFi integration...");
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .eq('type', 'unifi')
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      throw new Error('UniFi integration not found');
    }

    console.log("Integration found:", { id: integration.id, name: integration.name, is_active: integration.is_active });

    if (!integration.is_active) {
      throw new Error('UniFi integration is not active');
    }

    // Check if this is a local controller integration (has username/password) or Site Manager API (has api_token)
    const { base_url, username, password, api_token, use_ssl = true } = integration;
    
    const isLocalController = !!(username && password && base_url && !base_url.includes('api.ui.com'));
    const isSiteManagerAPI = !!(api_token && (!base_url || base_url.includes('api.ui.com')));
    
    console.log("Integration config:", { 
      hasBaseUrl: !!base_url,
      hasUsername: !!username,
      hasPassword: !!password,
      hasApiToken: !!api_token,
      useSSL: use_ssl,
      isLocalController,
      isSiteManagerAPI
    });
    
    if (!isLocalController && !isSiteManagerAPI) {
      console.error('Invalid UniFi integration configuration');
      throw new Error('UniFi integration requires either (base_url, username, password) for local controller OR (api_token) for Site Manager API');
    }

    let baseApiUrl;
    if (isLocalController) {
      // Use local UniFi Controller
      baseApiUrl = base_url.replace(/\/+$/, ''); // Remove trailing slashes
      console.log('Using UniFi Local Controller:', baseApiUrl);
    } else {
      // Use Site Manager API
      baseApiUrl = 'https://api.ui.com';
      console.log('Using UniFi Site Manager API:', baseApiUrl);
    }
    console.log('API endpoint:', endpoint);

    if (isLocalController) {
      // LOCAL CONTROLLER - Authenticate with username/password
      let loginUrl = `${baseApiUrl}/api/login`;
      console.log('=== UNIFI CONTROLLER CONNECTION DIAGNOSTICS ===');
      console.log('Controller URL:', baseApiUrl);
      console.log('Login endpoint:', loginUrl);
      console.log('Username provided:', !!username);
      console.log('Password provided:', !!password);
      console.log('Use SSL configured:', use_ssl);
      
      // Enhanced connection diagnostics
      const connectionDetails = {
        originalUrl: baseApiUrl,
        loginUrl: loginUrl,
        isHttps: loginUrl.startsWith('https://'),
        hostname: new URL(baseApiUrl).hostname,
        port: new URL(baseApiUrl).port || (loginUrl.startsWith('https://') ? '443' : '80'),
        protocol: new URL(baseApiUrl).protocol
      };
      console.log('Connection details:', connectionDetails);

      // Try HTTPS first with enhanced SSL handling, then HTTP as fallback
      let loginResponse: Response;
      let usedHttpFallback = false;
      let connectionMethod = '';
      
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Lovable-UniFi-Integration/1.0'
        },
        body: JSON.stringify({
          username: username,
          password: password,
          remember: true
        })
      };
      
      console.log('Attempting HTTPS connection...');
      try {
        const startTime = Date.now();
        loginResponse = await fetch(loginUrl, fetchOptions);
        const responseTime = Date.now() - startTime;
        connectionMethod = 'HTTPS';
        
        console.log('HTTPS connection successful:', {
          status: loginResponse.status,
          statusText: loginResponse.statusText,
          responseTime: `${responseTime}ms`,
          headers: Object.fromEntries(loginResponse.headers.entries())
        });
        
      } catch (httpsError) {
        console.error('=== HTTPS CONNECTION FAILED ===');
        console.error('Error type:', httpsError.constructor.name);
        console.error('Error message:', httpsError.message);
        console.error('Full error:', httpsError);
        
        // Analyze specific SSL/TLS errors
        const errorAnalysis = {
          isSSLError: httpsError.message.includes('certificate') || 
                     httpsError.message.includes('SSL') || 
                     httpsError.message.includes('TLS') ||
                     httpsError.message.includes('self-signed'),
          isConnectionRefused: httpsError.message.includes('connection refused') ||
                              httpsError.message.includes('ECONNREFUSED'),
          isDNSError: httpsError.message.includes('not found') ||
                     httpsError.message.includes('ENOTFOUND'),
          isTimeoutError: httpsError.message.includes('timeout') ||
                         httpsError.message.includes('ETIMEDOUT'),
          isNetworkError: httpsError.message.includes('network') ||
                         httpsError.message.includes('fetch')
        };
        
        console.log('Error analysis:', errorAnalysis);
        
        // Try HTTP fallback if HTTPS failed
        if (baseApiUrl.startsWith('https://')) {
          const httpUrl = baseApiUrl.replace('https://', 'http://');
          const httpLoginUrl = `${httpUrl}/api/login`;
          console.log('=== ATTEMPTING HTTP FALLBACK ===');
          console.log('HTTP URL:', httpLoginUrl);
          
          try {
            const startTime = Date.now();
            loginResponse = await fetch(httpLoginUrl, fetchOptions);
            const responseTime = Date.now() - startTime;
            usedHttpFallback = true;
            connectionMethod = 'HTTP (fallback)';
            
            console.log('HTTP fallback successful:', {
              status: loginResponse.status,
              statusText: loginResponse.statusText,
              responseTime: `${responseTime}ms`,
              headers: Object.fromEntries(loginResponse.headers.entries())
            });
            
            // Update URLs for subsequent requests
            loginUrl = httpLoginUrl;
            
          } catch (httpError) {
            console.error('=== HTTP FALLBACK ALSO FAILED ===');
            console.error('HTTP Error type:', httpError.constructor.name);
            console.error('HTTP Error message:', httpError.message);
            console.error('HTTP Full error:', httpError);
            
            // Generate detailed troubleshooting information
            let troubleshootingSteps = [];
            
            if (errorAnalysis.isSSLError) {
              troubleshootingSteps.push('Problema de certificado SSL/TLS. Controladora UniFi usa certificado auto-assinado por padrão.');
              troubleshootingSteps.push('Tente acessar https://' + connectionDetails.hostname + ':' + connectionDetails.port + ' no navegador e aceitar o certificado.');
            }
            
            if (errorAnalysis.isConnectionRefused) {
              troubleshootingSteps.push('Conexão recusada. Verifique se a controladora está rodando e acessível.');
              troubleshootingSteps.push('Verifique se a porta ' + connectionDetails.port + ' está aberta no firewall.');
            }
            
            if (errorAnalysis.isDNSError) {
              troubleshootingSteps.push('Erro de DNS. Verifique se o hostname "' + connectionDetails.hostname + '" é resolvível.');
              troubleshootingSteps.push('Tente usar IP ao invés do hostname.');
            }
            
            if (errorAnalysis.isTimeoutError) {
              troubleshootingSteps.push('Timeout de conexão. A controladora pode estar muito lenta ou inacessível.');
              troubleshootingSteps.push('Verifique a conectividade de rede e latência.');
            }
            
            troubleshootingSteps.push('Verifique se a controladora UniFi está online e funcionando normalmente.');
            troubleshootingSteps.push('Teste acesso manual via navegador: ' + baseApiUrl);
            
            throw new Error(`Falha de conectividade total. HTTPS: ${httpsError.message}. HTTP: ${httpError.message}. Diagnóstico: ${troubleshootingSteps.join(' | ')}`);
          }
        } else {
          throw httpsError;
        }
      }

      if (!loginResponse.ok) {
        const loginError = await loginResponse.text();
        console.error('=== AUTHENTICATION FAILED ===');
        console.error('Status:', loginResponse.status, loginResponse.statusText);
        console.error('Response headers:', Object.fromEntries(loginResponse.headers.entries()));
        console.error('Response body:', loginError);
        
        // Analyze authentication failure
        let authErrorMsg = '';
        let authTroubleshooting = [];
        
        if (loginResponse.status === 400) {
          if (loginError.includes('TLS') || loginError.includes('requires TLS')) {
            authErrorMsg = 'Controladora requer HTTPS mas a conexão falhou. Problema de certificado SSL.';
            authTroubleshooting.push('A controladora está configurada para exigir HTTPS mas o certificado não é válido.');
            authTroubleshooting.push('Acesse https://' + new URL(baseApiUrl).hostname + ':' + (new URL(baseApiUrl).port || '8443') + ' no navegador e aceite o certificado manualmente.');
            authTroubleshooting.push('Ou configure a controladora para permitir HTTP local.');
          } else if (loginError.includes('username') || loginError.includes('password')) {
            authErrorMsg = 'Credenciais de login inválidas.';
            authTroubleshooting.push('Verifique se o usuário e senha estão corretos.');
            authTroubleshooting.push('Verifique se o usuário tem permissões de administrador na controladora.');
          } else {
            authErrorMsg = 'Erro de autenticação (400 Bad Request).';
            authTroubleshooting.push('Formato de requisição inválido ou credenciais mal formatadas.');
          }
        } else if (loginResponse.status === 401) {
          authErrorMsg = 'Credenciais de acesso negadas.';
          authTroubleshooting.push('Usuário ou senha incorretos.');
          authTroubleshooting.push('Conta pode estar bloqueada ou desabilitada.');
        } else if (loginResponse.status === 403) {
          authErrorMsg = 'Acesso proibido.';
          authTroubleshooting.push('Usuário não tem permissões de administrador.');
          authTroubleshooting.push('API pode estar desabilitada na controladora.');
        } else if (loginResponse.status === 500) {
          authErrorMsg = 'Erro interno da controladora.';
          authTroubleshooting.push('Problema na controladora UniFi. Verifique logs da controladora.');
          authTroubleshooting.push('Tente reiniciar a controladora.');
        } else {
          authErrorMsg = `Erro de autenticação HTTP ${loginResponse.status}.`;
          authTroubleshooting.push('Erro inesperado na autenticação.');
        }
        
        console.error('Authentication error analysis:', { authErrorMsg, authTroubleshooting });
        
        throw new Error(`${authErrorMsg} Status: ${loginResponse.status}. Diagnóstico: ${authTroubleshooting.join(' | ')}`);
      }

      // Extract cookies from login response
      const setCookieHeaders = loginResponse.headers.get('set-cookie') || '';
      console.log('Login successful, got cookies');

      // Make API request to UniFi Controller
      // Update baseApiUrl if we used HTTP fallback
      const finalBaseUrl = usedHttpFallback ? baseApiUrl.replace('https://', 'http://') : baseApiUrl;
      const apiUrl = `${finalBaseUrl}${endpoint}`;
      console.log('Making Controller API request to:', apiUrl);

      const requestOptions: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': setCookieHeaders
        },
      };

      if (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(postData);
      }

      console.log('Request options:', { 
        method: requestOptions.method, 
        url: apiUrl,
        hasCookies: !!setCookieHeaders,
        hasBody: !!requestOptions.body 
      });

      const apiResponse = await fetch(apiUrl, requestOptions);
      
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('UniFi Controller API request failed:', apiResponse.status, errorText);
        console.error('Request details:', { url: apiUrl, method: requestOptions.method, endpoint });
        
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
      // SITE MANAGER API - Use API token
      if (!api_token) {
        console.error('Missing API token for UniFi Site Manager API');
        throw new Error('UniFi Site Manager API requires an API token. Get yours at https://account.ui.com/api');
      }

      // Make API request to UniFi Site Manager
      const apiUrl = `${baseApiUrl}${endpoint}`;
      console.log('Making Site Manager API request to:', apiUrl);

      const requestOptions: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': api_token
        },
      };

      if (postData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(postData);
      }

      console.log('Request options:', { 
        method: requestOptions.method, 
        url: apiUrl,
        hasApiKey: !!api_token,
        hasBody: !!requestOptions.body 
      });

      const apiResponse = await fetch(apiUrl, requestOptions);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Site Manager API request failed:', apiResponse.status, errorText);
        console.error('Request details:', { url: apiUrl, method: requestOptions.method, endpoint });
        
        if (apiResponse.status === 401) {
          throw new Error('API token inválido ou expirado. Verifique suas credenciais na conta UniFi.');
        } else if (apiResponse.status === 403) {
          throw new Error('Acesso negado. Verifique as permissões do seu token API.');
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

      // For hosts endpoint, the data might be directly in the root array
      let finalResponse;
      if (endpoint === '/v1/hosts' && Array.isArray(responseData)) {
        finalResponse = { data: responseData };
      } else if (responseData?.data) {
        finalResponse = responseData;
      } else {
        finalResponse = { data: responseData };
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