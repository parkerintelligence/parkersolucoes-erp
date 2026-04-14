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

    const { base_url, username, password, api_token } = integration;

    if (!base_url) {
      console.error('Missing integration config:', { base_url: !!base_url, username: !!username, password: !!password, api_token: !!api_token });
      throw new Error('Wazuh integration is not properly configured');
    }

    if (!api_token && (!username || !password)) {
      console.error('Missing auth config:', { username: !!username, password: !!password, api_token: !!api_token });
      throw new Error('Wazuh integration requires either API token or username/password');
    }

    const normalizeBaseUrl = (rawUrl: string, protocol?: 'http' | 'https') => {
      const trimmedUrl = rawUrl.trim().replace(/\/+$/, '');
      const hasProtocol = /^https?:\/\//i.test(trimmedUrl);
      const urlWithProtocol = hasProtocol
        ? trimmedUrl
        : `${protocol ?? 'https'}://${trimmedUrl}`;

      const parsedUrl = new URL(urlWithProtocol);
      if (!parsedUrl.port) {
        parsedUrl.port = '55000';
      }

      if (protocol) {
        parsedUrl.protocol = `${protocol}:`;
      }

      return parsedUrl.toString().replace(/\/+$/, '');
    };

    const buildBaseUrlCandidates = (rawUrl: string) => {
      const trimmedUrl = rawUrl.trim();
      if (/^https?:\/\//i.test(trimmedUrl)) {
        const parsed = new URL(trimmedUrl);
        const primaryProtocol = parsed.protocol.replace(':', '') as 'http' | 'https';
        const secondaryProtocol = primaryProtocol === 'https' ? 'http' : 'https';

        return [
          normalizeBaseUrl(trimmedUrl, primaryProtocol),
          normalizeBaseUrl(trimmedUrl, secondaryProtocol),
        ];
      }

      return [
        normalizeBaseUrl(trimmedUrl, 'https'),
        normalizeBaseUrl(trimmedUrl, 'http'),
      ];
    };

    const cleanBaseUrls = [...new Set(buildBaseUrlCandidates(base_url))];
    const originalBaseUrl = cleanBaseUrls[0];

    console.log(`Connecting to Wazuh API. Candidates: ${cleanBaseUrls.join(' | ')}`);

    const parseAuthToken = (rawBody: string) => {
      const trimmed = rawBody.trim();
      if (!trimmed) return '';

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        return parsed?.data?.token || parsed?.token || '';
      }

      return trimmed;
    };

    const buildAuthError = (baseUrl: string, message: string, status?: number) => {
      const normalizedMessage = message.toLowerCase();
      const protocol = baseUrl.startsWith('https://') ? 'HTTPS' : 'HTTP';

      if (status === 401 || normalizedMessage.includes('invalid credentials') || normalizedMessage.includes('unauthorized')) {
        return `Authentication failed on ${protocol}: invalid username/password or API token`;
      }

      if (
        normalizedMessage.includes('certificate') ||
        normalizedMessage.includes('unknownissuer') ||
        normalizedMessage.includes('cert_verify_failed') ||
        normalizedMessage.includes('self-signed')
      ) {
        return `SSL certificate validation failed on HTTPS. Your Wazuh server is reachable but uses a self-signed or invalid certificate.`;
      }

      if (
        normalizedMessage.includes('connection closed') ||
        normalizedMessage.includes('message completed') ||
        normalizedMessage.includes('sendrequest') ||
        normalizedMessage.includes('remotedisconnected')
      ) {
        return `Connection closed by the Wazuh server on ${protocol}. This usually means the server expects the other protocol.`;
      }

      return `${protocol} request failed: ${message}`;
    };

    const authenticateWithWazuh = async (): Promise<{ token: string; baseUrl: string; usedApiToken: boolean }> => {
      if (api_token) {
        console.log('🔐 Using configured Wazuh API token');
        return { token: api_token, baseUrl: cleanBaseUrls[0], usedApiToken: true };
      }

      const basicAuth = btoa(`${username}:${password}`);
      const errors: string[] = [];

      for (const candidateBaseUrl of cleanBaseUrls) {
        const authUrl = `${candidateBaseUrl}/security/user/authenticate?raw=true`;
        console.log(`🔐 Authenticating to: ${authUrl}`);

        try {
          const authResponse = await fetch(authUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(15000),
          });

          const responseText = await authResponse.text();

          if (!authResponse.ok) {
            const errorMessage = buildAuthError(candidateBaseUrl, responseText, authResponse.status);
            console.error(`❌ Auth failed for ${candidateBaseUrl}: ${authResponse.status} - ${responseText}`);
            errors.push(errorMessage);
            continue;
          }

          const parsedToken = parseAuthToken(responseText);
          if (!parsedToken) {
            errors.push(`Authentication response from ${candidateBaseUrl} did not include a token`);
            continue;
          }

          console.log(`✅ Authentication successful with ${candidateBaseUrl}`);
          return { token: parsedToken, baseUrl: candidateBaseUrl, usedApiToken: false };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
          console.error(`❌ Auth request error for ${candidateBaseUrl}:`, errorMessage);
          errors.push(buildAuthError(candidateBaseUrl, errorMessage));
        }
      }

      throw new Error(errors.join(' | '));
    };

    console.log('🔄 Getting Wazuh auth token...');

    let jwtToken: string;
    let finalBaseUrl = originalBaseUrl;
    let usedApiToken = false;

    try {
      const result = await authenticateWithWazuh();
      jwtToken = result.token;
      finalBaseUrl = result.baseUrl;
      usedApiToken = result.usedApiToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Wazuh authentication error';
      console.error('❌ Authentication failed:', errorMessage);

      return new Response(
        JSON.stringify({
          error: '❌ Wazuh Authentication Failed',
          details: errorMessage,
          suggestions: [
            '1️⃣ Save the URL with the correct protocol. Your server currently looks HTTPS-first, not plain HTTP.',
            '2️⃣ If using HTTPS, install a valid SSL certificate. Supabase Edge Functions cannot ignore self-signed certificates.',
            '3️⃣ If you stay on HTTP, ensure the Wazuh API is really listening in HTTP on port 55000.',
            '4️⃣ Recheck the username/password or configure a valid API token.',
            '5️⃣ Test directly on the server: curl -u usuario:senha -k https://SEU_HOST:55000/security/user/authenticate?raw=true'
          ]
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiUrl = `${finalBaseUrl}${endpoint}`;
    console.log(`📡 Making API request to: ${apiUrl}`);

    if (finalBaseUrl.startsWith('http://') && originalBaseUrl.startsWith('https://')) {
      console.warn('⚠️ Using HTTP fallback because HTTPS did not work');
    }

    const apiResponse = await fetch(apiUrl, {
      method: method || 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
    });

    console.log(`📊 API response status: ${apiResponse.status}`);

    const responseText = await apiResponse.text();

    if (!apiResponse.ok) {
      console.error('❌ API error:', responseText);
      throw new Error(`API request failed: ${apiResponse.status} - ${responseText}`);
    }

    const responseData = responseText ? JSON.parse(responseText) : {};
    console.log('✅ API response received successfully');

    const responseHeaders: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/json' };

    if (usedApiToken) {
      responseHeaders['X-Wazuh-Auth'] = 'api-token';
    }

    if (finalBaseUrl.startsWith('http://') && originalBaseUrl.startsWith('https://')) {
      responseHeaders['X-Wazuh-Connection'] = 'http-fallback';
    }

    return new Response(JSON.stringify(responseData), {
      headers: responseHeaders,
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