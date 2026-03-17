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

const normalizeUrlNoTrailingSlash = (value: string) => value.trim().replace(/\/+$/, '');

const toHttpUrl = (value: string) => normalizeUrlNoTrailingSlash(value).replace(/^https:\/\//i, 'http://');

const toHttpsUrl = (value: string) => normalizeUrlNoTrailingSlash(value).replace(/^http:\/\//i, 'https://');

const DEFAULT_FETCH_TIMEOUT_MS = 9000;

const MAX_LOGIN_ATTEMPTS = 24;
const MAX_LOGIN_DURATION_MS = 20000;

const buildLocalControllerCandidates = (
  baseUrl: string,
  preferSsl: boolean,
  configuredPort?: number | string | null,
) => {
  const normalized = normalizeUrlNoTrailingSlash(baseUrl);
  const parsed = new URL(normalized);

  const createVariant = (protocol: 'http:' | 'https:', port?: string) => {
    const variant = new URL(normalized);
    variant.protocol = protocol;
    if (port !== undefined) {
      variant.port = port;
    }
    return normalizeUrlNoTrailingSlash(variant.toString());
  };

  const candidates = new Set<string>();
  const push = (url: string) => {
    if (url) candidates.add(normalizeUrlNoTrailingSlash(url));
  };

  const configuredPortValue = String(configuredPort ?? '').trim();
  const currentPort = parsed.port || (preferSsl ? '443' : '80');
  const protocolOrder: Array<'https:' | 'http:'> = preferSsl ? ['https:', 'http:'] : ['http:', 'https:'];

  const prioritizedPorts = [
    configuredPortValue,
    currentPort,
    currentPort === '8445' ? '8443' : '8445',
    preferSsl ? '443' : '80',
  ].filter((value, index, arr) => !!value && arr.indexOf(value) === index);

  for (const portValue of prioritizedPorts.slice(0, 3)) {
    for (const protocol of protocolOrder) {
      push(createVariant(protocol, portValue));
    }
  }

  return Array.from(candidates).slice(0, 6);
};

const fetchIgnoringCerts = async (url: string, options: RequestInit = {}) => {
  const hostname = new URL(url).hostname;
  console.log(`[TLS-BYPASS] Creating insecure client for hostname: ${hostname}`);

  try {
    const insecureClient = Deno.createHttpClient({
      // deno-lint-ignore no-explicit-any
      dangerouslyIgnoreCertificateErrors: [hostname],
    } as any);
    return await fetch(url, { ...options, client: insecureClient } as any);
  } catch (error) {
    console.error('[TLS-BYPASS] Unable to bypass certificate validation:', error instanceof Error ? error.message : error);
    throw error;
  }
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchWithTlsFallback = async (
  url: string,
  options: RequestInit = {},
  allowInsecureFallback: boolean = true,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
) => {
  try {
    return await fetchWithTimeout(url, options, timeoutMs);
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
    const { base_url, username, password, api_token, use_ssl = true, port } = integration;
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
      configuredPort: port,
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

      if (port) {
        try {
          const urlWithConfiguredPort = new URL(baseApiUrl);
          urlWithConfiguredPort.port = String(port);
          baseApiUrl = normalizeUrlNoTrailingSlash(urlWithConfiguredPort.toString());
        } catch (portError) {
          console.warn('Could not apply configured port to base URL:', portError);
        }
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
      let loginResponse: Response | null = null;
      let lastConnectionError = '';
      let lastConnectionErrorWasTls = false;

      const controllerCandidates = buildLocalControllerCandidates(baseApiUrl, use_ssl ?? true, port);
      const loginEndpoints = [
        '/api/auth/login',
        '/api/login',
        '/proxy/network/api/auth/login',
        '/proxy/network/api/login',
      ];

      console.log('=== UNIFI CONTROLLER CONNECTION DIAGNOSTICS ===');
      console.log('Controller candidates:', controllerCandidates);
      console.log('Username provided:', !!username);
      console.log('Password provided:', !!password);
      console.log('Use SSL configured:', use_ssl);
      console.log('Configured port:', port);
      console.log('Ignore SSL configured:', requestBody.ignore_ssl);

      const loginBody = JSON.stringify({
        username: normalizedUsername,
        password: normalizedPassword,
        remember: true,
        rememberMe: true,
      });

      const loginHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Lovable-UniFi-Integration/1.0',
      };

      const loginStartedAt = Date.now();
      let attempts = 0;
      const maxLoginAttempts = Math.min(
        MAX_LOGIN_ATTEMPTS,
        Math.max(controllerCandidates.length * loginEndpoints.length, 8),
      );

      for (const candidateBaseUrl of controllerCandidates) {
        const allowTlsFallback = candidateBaseUrl.startsWith('https://');

        for (const loginEndpoint of loginEndpoints) {
          if (attempts >= maxLoginAttempts || Date.now() - loginStartedAt > MAX_LOGIN_DURATION_MS) {
            console.warn('[UNIFI-LOCAL] Login attempts/time budget exceeded', {
              attempts,
              maxLoginAttempts,
              elapsedMs: Date.now() - loginStartedAt,
            });
            break;
          }

          attempts += 1;
          const candidateLoginUrl = `${candidateBaseUrl}${loginEndpoint}`;

          try {
            console.log('[UNIFI-LOCAL] Testing login URL:', candidateLoginUrl);

            const startTime = Date.now();
            const response = await fetchWithTlsFallback(
              candidateLoginUrl,
              {
                method: 'POST',
                headers: loginHeaders,
                body: loginBody,
              },
              allowTlsFallback,
              5000,
            );
            const responseTime = Date.now() - startTime;

            console.log(`[UNIFI-LOCAL] Login response ${response.status} in ${responseTime}ms for ${candidateLoginUrl}`);

            if (response.status === 404) {
              continue;
            }

            if (response.ok || response.status === 401 || response.status === 403) {
              loginResponse = response;
              activeBaseApiUrl = candidateBaseUrl;
              break;
            }

            const errorBody = await response.text();
            lastConnectionError = `${response.status} em ${candidateLoginUrl}: ${errorBody}`;
            lastConnectionErrorWasTls = false;
          } catch (connectionError) {
            const errorMessage = connectionError instanceof Error ? connectionError.message : String(connectionError);
            lastConnectionError = `${candidateLoginUrl} => ${errorMessage}`;
            lastConnectionErrorWasTls = isTlsCertificateError(connectionError);
            console.warn('[UNIFI-LOCAL] Login attempt failed:', lastConnectionError);
          }
        }

        if (loginResponse || attempts >= maxLoginAttempts || Date.now() - loginStartedAt > MAX_LOGIN_DURATION_MS) {
          break;
        }
      }

      if (!loginResponse) {
        if (lastConnectionErrorWasTls) {
          throw new Error(
            `Falha SSL/TLS na controladora (${baseApiUrl}). Último erro: ${lastConnectionError || 'certificado inválido'}. ` +
            'O Supabase Edge não consegue ignorar certificado autoassinado. Use certificado público válido (cadeia completa) ou endpoint HTTP interno acessível.'
          );
        }

        throw new Error(
          `Falha ao conectar na controladora (${baseApiUrl}). Último erro: ${lastConnectionError || 'sem resposta'}. ` +
          'Verifique URL, porta, protocolo (HTTP/HTTPS), firewall e se a API está exposta.'
        );
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

      const extractSiteIdFromEndpoint = (requestedEndpoint: string) => {
        const match = requestedEndpoint.match(/\/api\/s\/([^\/]+)/);
        return match ? match[1] : '';
      };

      const coerceArrayResponse = (payload: any) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
      };

      const safeNumber = (value: unknown): number | undefined => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const toUnixSeconds = (value: unknown): number | undefined => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value > 1000000000000 ? Math.floor(value / 1000) : Math.floor(value);
        }

        if (typeof value === 'string' && value.trim()) {
          const numericValue = Number(value);
          if (Number.isFinite(numericValue)) {
            return numericValue > 1000000000000 ? Math.floor(numericValue / 1000) : Math.floor(numericValue);
          }

          const parsedDate = Date.parse(value);
          if (!Number.isNaN(parsedDate)) {
            return Math.floor(parsedDate / 1000);
          }
        }

        return undefined;
      };

      const normalizeDeviceType = (device: any) => {
        const rawType = String(
          device.type || device.deviceType || device.model || device.product || device.category || 'unknown'
        ).toLowerCase();

        if (rawType.includes('udm')) return 'udm';
        if (rawType.includes('uxg')) return 'uxg';
        if (rawType.includes('ugw') || rawType.includes('gateway')) return 'ugw';
        if (rawType.includes('usw') || rawType.includes('switch')) return 'usw';
        if (rawType.includes('uap') || rawType.includes('access point') || rawType.includes('ap')) return 'uap';

        return rawType;
      };

      const normalizeSiteManagerDevice = (device: any, siteId: string) => {
        const latestStats = device.latestStatistics || device.statistics || device.stats || {};
        const sysStats = device['sys-stats'] || device.sysStats || {};
        const connectionState = String(
          device.status ||
          device.state ||
          device.connectionState ||
          device.lifecycleState ||
          device.latestConnectionState?.state ||
          ''
        ).toLowerCase();
        const isOnline = Boolean(device.isConnected) || ['online', 'connected', 'ready', 'active'].some((token) => connectionState.includes(token));
        const cpu = safeNumber(sysStats.cpu ?? latestStats.cpuUtilizationPct ?? latestStats.cpu);
        const mem = safeNumber(sysStats.mem ?? latestStats.memoryUtilizationPct ?? latestStats.memory);
        const temperature = safeNumber(sysStats['system-temp'] ?? latestStats.temperatureCelsius ?? latestStats.temperature);
        const model = device.model || device.productModel || device.deviceModel || device.product?.model || 'UniFi Device';
        const mac = String(device.mac || device.macAddress || device.primaryMac || device.id || '');

        return {
          ...device,
          id: String(device.id || mac || `${siteId}-${model}`),
          mac,
          name: device.name || device.hostname || model,
          displayName: device.displayName || device.alias || device.name || device.hostname || model,
          model,
          type: normalizeDeviceType(device),
          ip: device.ip || device.ipAddress || device.latestConnectionState?.ipAddress || '',
          status: isOnline ? 'online' : 'offline',
          adopted: Boolean(device.adopted ?? device.isAdopted ?? true),
          uptime: safeNumber(device.uptime ?? latestStats.uptime ?? latestStats.uptimeSecs),
          version: device.version || device.firmwareVersion || device.firmware?.version || device.firmware?.currentVersion || '',
          siteId: String(device.siteId || device.site_id || siteId),
          connectedClients: safeNumber(device.connectedClients ?? device.connectedClientsCount ?? device.num_sta ?? latestStats.clientCount) || 0,
          'sys-stats': {
            cpu: cpu || 0,
            mem: mem || 0,
            'system-temp': temperature || 0,
          },
        };
      };

      const normalizeSiteManagerClient = (client: any, siteId: string) => {
        const traffic = client.traffic || client.statistics || {};
        const signal = safeNumber(client.signal ?? client.rssi ?? client.latestConnectionState?.signal);
        const lastSeen = toUnixSeconds(client.lastSeen ?? client.lastSeenAt ?? client.updatedAt ?? client.connectedAt);
        const uptime = safeNumber(client.uptime ?? client.connectionDurationSeconds);
        const rxBytes = safeNumber(client.rxBytes ?? client.downloadBytes ?? traffic.rxBytes ?? traffic.downloadBytes) || 0;
        const txBytes = safeNumber(client.txBytes ?? client.uploadBytes ?? traffic.txBytes ?? traffic.uploadBytes) || 0;
        const isWired = Boolean(
          client.isWired ??
          client.wired ??
          String(client.connectionType || client.interfaceType || '').toLowerCase().includes('wired')
        );
        const mac = String(client.mac || client.macAddress || client.id || '');

        return {
          ...client,
          id: String(client.id || mac || `${siteId}-client`),
          mac,
          name: client.name || client.hostname || client.displayName || 'Cliente UniFi',
          hostname: client.hostname || client.name || client.displayName || 'Cliente UniFi',
          ip: client.ip || client.ipAddress || '',
          network: client.network || client.networkName || client.vlanName || client.ssid || 'N/A',
          networkId: client.networkId || client.vlanId || client.ssidId || '',
          accessPointMac: client.accessPointMac || client.apMac || client.accessPointId || '',
          channel: safeNumber(client.channel),
          radio: client.radio || client.band || '',
          signal,
          noise: safeNumber(client.noise),
          rssi: safeNumber(client.rssi ?? signal),
          rxBytes,
          txBytes,
          uptime,
          lastSeen,
          isGuest: Boolean(client.isGuest ?? client.guest),
          isWired,
          oui: client.oui || '',
          userId: client.userId || client.user_id || '',
          siteId: String(client.siteId || client.site_id || siteId),
        };
      };
      
      let siteManagerEndpoint = endpoint;
      const siteIdForFilter = extractSiteIdFromEndpoint(endpoint);
      const isDeviceRequest = endpoint.includes('/stat/device');
      const isClientRequest = endpoint.includes('/stat/sta');
      const isWlanRequest = endpoint.includes('/rest/wlanconf');
      const isAlarmRequest = endpoint.includes('/stat/alarm');
      const isHealthRequest = endpoint.includes('/stat/health');
      
      // Transform local controller endpoints to Site Manager API v1 endpoints
      // IMPORTANT: Site Manager API v1 only has /v1/devices (ALL devices), NOT per-site endpoints
      if (endpoint.includes('/api/self/sites')) {
        siteManagerEndpoint = '/v1/sites';
      } else if (endpoint.includes('/v1/hosts/') && endpoint.includes('/sites')) {
        siteManagerEndpoint = '/v1/sites';
      } else if (siteIdForFilter && isDeviceRequest) {
        // /v1/devices returns ALL devices; we filter by siteId after fetching
        siteManagerEndpoint = '/v1/devices';
      } else if (siteIdForFilter && isClientRequest) {
        // No /v1/clients endpoint exists in Site Manager API v1
        // Use site statistics from /v1/sites instead
        console.log('No clients endpoint in Site Manager API v1, fetching site stats from /v1/sites');
        const sitesResp = await fetch(`${baseApiUrl}/v1/sites`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-KEY': normalizedApiToken,
            'User-Agent': 'Lovable-UniFi-Integration/1.0'
          },
        });
        if (sitesResp.ok) {
          const sitesData = await sitesResp.json();
          const sites = coerceArrayResponse(sitesData);
          const targetSite = sites.find((s: any) => String(s.siteId || s.id) === siteIdForFilter);
          if (targetSite) {
            const counts = targetSite.statistics?.counts || {};
            // Build synthetic client list from site statistics
            const syntheticClients: any[] = [];
            const wifiCount = counts.wifiClient || 0;
            const wiredCount = counts.wiredClient || 0;
            for (let i = 0; i < wifiCount; i++) {
              syntheticClients.push(normalizeSiteManagerClient({
                id: `wifi-client-${siteIdForFilter}-${i}`,
                name: `Cliente Wi-Fi ${i + 1}`,
                hostname: `wifi-client-${i + 1}`,
                isWired: false,
                connectionType: 'wireless',
                siteId: siteIdForFilter,
              }, siteIdForFilter));
            }
            for (let i = 0; i < wiredCount; i++) {
              syntheticClients.push(normalizeSiteManagerClient({
                id: `wired-client-${siteIdForFilter}-${i}`,
                name: `Cliente Cabeado ${i + 1}`,
                hostname: `wired-client-${i + 1}`,
                isWired: true,
                connectionType: 'wired',
                siteId: siteIdForFilter,
              }, siteIdForFilter));
            }
            console.log(`Built ${syntheticClients.length} synthetic clients from site stats (${wifiCount} wifi, ${wiredCount} wired)`);
            return new Response(JSON.stringify({ data: syntheticClients, meta: { synthetic: true, source: 'site-statistics' } }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (siteIdForFilter && isWlanRequest) {
        console.log('WLAN config not available in Site Manager API, returning empty');
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (siteIdForFilter && isAlarmRequest) {
        console.log('No alarm endpoint in Site Manager API, returning empty');
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (siteIdForFilter && isHealthRequest) {
        console.log('No health endpoint in Site Manager API, returning empty');
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (endpoint.includes('/v1/')) {
        siteManagerEndpoint = endpoint;
      } else if (endpoint.includes('/ea/hosts')) {
        siteManagerEndpoint = endpoint.replace('/ea/hosts', '/v1/hosts');
        siteManagerEndpoint = siteManagerEndpoint.replace('/ea/', '/v1/');
      }
      
      console.log('Endpoint mapping:', { original: endpoint, mapped: siteManagerEndpoint, siteIdForFilter });
      
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
          const isDataEndpoint = ['/sites', '/devices', '/clients', '/networks', '/events', '/health', '/wlanconf', '/stat/'].some((p) => endpoint.includes(p) || siteManagerEndpoint.includes(p));
          if (isDataEndpoint) {
            console.log('404 for data endpoint, returning empty response:', siteManagerEndpoint);
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
        const hosts = coerceArrayResponse(responseData);
        
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
          
          console.log('Processed hosts:', finalResponse.data.map((host: any) => ({
            id: host.id,
            name: host.reportedState?.name,
            state: host.reportedState?.state,
            ip: host.ipAddress
          })));
        }
      } else if (siteManagerEndpoint === '/v1/sites') {
        finalResponse = { data: coerceArrayResponse(responseData) };
      } else if (siteManagerEndpoint === '/v1/devices') {
        const allDevices = coerceArrayResponse(responseData);
        // Filter devices by siteId if we have one
        let devices = allDevices;
        if (siteIdForFilter) {
          devices = allDevices.filter((d: any) => {
            const deviceSiteId = String(d.siteId || d.site_id || d.hostSiteId || '');
            return deviceSiteId === siteIdForFilter;
          });
          // If no devices match siteId filter, try matching by hostId
          // (some API versions don't include siteId on devices)
          if (devices.length === 0 && allDevices.length > 0) {
            console.log(`No devices matched siteId=${siteIdForFilter}, showing all ${allDevices.length} devices`);
            devices = allDevices;
          }
        }
        console.log('Devices returned:', { siteId: siteIdForFilter, total: allDevices.length, filtered: devices.length });
        finalResponse = { data: devices.map((device: any) => normalizeSiteManagerDevice(device, siteIdForFilter)) };
      } else if (siteManagerEndpoint.endsWith('/clients')) {
        const clients = coerceArrayResponse(responseData);
        console.log('Site clients returned:', { siteId: siteIdForFilter, count: clients.length });
        finalResponse = { data: clients.map((client: any) => normalizeSiteManagerClient(client, siteIdForFilter)) };
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
      } else if (error.message.includes('Falha SSL/TLS na controladora')) {
        status = 502;
        errorMessage = 'Falha de certificado TLS na controladora local.';
        troubleshooting = 'Use certificado público válido com cadeia completa ou exponha um endpoint HTTP interno confiável para a Edge Function.';
      } else if (error.message.includes('Falha ao conectar na controladora')) {
        status = 502;
        errorMessage = 'Não foi possível conectar à controladora local.';
        troubleshooting = 'Verifique URL, porta/protocolo, firewall e se a API UniFi está acessível externamente.';
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