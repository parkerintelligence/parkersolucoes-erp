import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, '');

// For local controllers, bypass self-signed certs
const fetchLocal = async (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
  const hostname = new URL(url).hostname;
  const isHttps = url.startsWith('https://');

  // Strategy 1: For HTTPS, use dangerouslyIgnoreCertificateErrors (the ONLY way to bypass self-signed in Deno)
  if (isHttps) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), timeoutMs);
      const client = Deno.createHttpClient({
        dangerouslyIgnoreCertificateErrors: [hostname],
      } as any);
      const resp = await fetch(url, {
        ...options,
        signal: ctrl.signal,
        client,
      } as any);
      clearTimeout(tid);
      return resp;
    } catch (e) {
      throw e;
    }
  }

  // Strategy 2: For HTTP, standard fetch
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(tid);
    return resp;
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
};

console.log("UniFi proxy function starting...");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: authError } = await userSupabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'User not found'}`);
    }

    const requestBody = await req.json();
    const { method, endpoint, integrationId, data: postData } = requestBody;

    console.log('UniFi request:', { method, endpoint, integrationId });

    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('type', 'unifi')
      .or(`user_id.eq.${user.id},is_global.eq.true`)
      .maybeSingle();

    if (integrationError || !integration) {
      throw new Error('UniFi integration not found');
    }

    if (!integration.is_active) {
      throw new Error('UniFi integration is not active');
    }

    const { base_url, username, password, api_token, use_ssl, port } = integration;
    const baseUrl = typeof base_url === 'string' ? normalizeUrl(base_url) : '';
    const user_ = typeof username === 'string' ? username.trim() : '';
    const pass_ = typeof password === 'string' ? password.trim() : '';
    const token_ = typeof api_token === 'string' ? api_token.trim() : '';

    const hasLocal = !!(baseUrl && user_ && pass_);
    const hasCloud = !!token_;
    const isLocalEndpoint = typeof endpoint === 'string' && endpoint.startsWith('/api/');
    const useLocal = hasLocal && (isLocalEndpoint || !hasCloud);

    console.log('Mode:', useLocal ? 'LOCAL' : 'CLOUD', { baseUrl, hasLocal, hasCloud, endpoint });

    if (!useLocal && !hasCloud) {
      throw new Error('Configuração UniFi incompleta. Necessário: (base_url + username + password) para local OU (api_token) para cloud.');
    }

    // ===================== LOCAL CONTROLLER =====================
    if (useLocal) {
      // Build candidate URLs to try
      const candidates: string[] = [];
      const addCandidate = (url: string) => {
        const normalized = normalizeUrl(url);
        if (!candidates.includes(normalized)) candidates.push(normalized);
      };

      // Build candidate URLs - keep it focused to avoid timeout
      const candidates: string[] = [];
      const addCandidate = (url: string) => {
        const normalized = normalizeUrl(url);
        if (!candidates.includes(normalized)) candidates.push(normalized);
      };

      // Priority 1: Exact URL as configured (user knows best)
      addCandidate(baseUrl);
      
      // Priority 2: If configured as HTTPS and fails, the controller might also listen on same port via HTTP redirect
      // But UniFi controllers ALWAYS use HTTPS, so add HTTPS variants first
      const parsed = new URL(baseUrl);
      const urlPort = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
      
      // Priority 2: Common UniFi HTTPS ports if not the configured one
      for (const commonPort of ['8443', '8445', '443']) {
        if (commonPort !== urlPort) {
          const u = new URL(baseUrl);
          u.port = commonPort;
          u.protocol = 'https:';
          addCandidate(normalizeUrl(u.toString()));
        }
      }

      console.log('Local controller candidates:', candidates);

      // Login endpoints to try - /api/auth/login is for UniFi OS (UDM/UDR), /api/login is for legacy controllers
      const loginPaths = ['/api/auth/login', '/api/login'];
      
      const loginBody = JSON.stringify({
        username: user_,
        password: pass_,
        remember: true,
        rememberMe: true,
      });

      const loginHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      let loginResponse: Response | null = null;
      let activeBase = '';
      let lastError = '';
      const startTime = Date.now();
      const MAX_TIME = 28000;

      for (const candidate of candidates) {
        if (Date.now() - startTime > MAX_TIME) break;
        
        for (const loginPath of loginPaths) {
          if (Date.now() - startTime > MAX_TIME) break;
          
          const loginUrl = `${candidate}${loginPath}`;
          console.log(`[LOCAL] Trying: ${loginUrl}`);

          try {
            const resp = await fetchLocal(loginUrl, {
              method: 'POST',
              headers: loginHeaders,
              body: loginBody,
            }, 8000);

            console.log(`[LOCAL] ${loginUrl} => ${resp.status}`);

            if (resp.status === 404) {
              await resp.text();
              continue;
            }

            if (resp.ok) {
              loginResponse = resp;
              activeBase = candidate;
              break;
            }

            if (resp.status === 401 || resp.status === 403) {
              const body = await resp.text();
              throw new Error(`Credenciais inválidas (${resp.status}): ${body}`);
            }

            const body = await resp.text();
            lastError = `${resp.status}: ${body}`;
            console.log(`[LOCAL] Response body: ${body.substring(0, 200)}`);
          } catch (e) {
            if (e instanceof Error && e.message.startsWith('Credenciais')) throw e;
            lastError = e instanceof Error ? e.message : String(e);
            console.warn(`[LOCAL] Failed: ${loginUrl} => ${lastError}`);
          }
        }
        if (loginResponse) break;
      }

      if (!loginResponse) {
        throw new Error(`Falha ao conectar na controladora local. Tentativas: ${candidates.join(', ')}. Último erro: ${lastError}`);
      }

      // Extract cookies and CSRF token
      const headerWithSetCookie = loginResponse.headers as Headers & { getSetCookie?: () => string[] };
      const cookieList = headerWithSetCookie.getSetCookie?.() || [];
      const cookies = cookieList.length > 0
        ? cookieList.map((c) => c.split(';')[0]).join('; ')
        : (loginResponse.headers.get('set-cookie') || '');
      const csrfToken = loginResponse.headers.get('x-csrf-token') || '';
      
      console.log(`[LOCAL] Login OK at ${activeBase}, cookies: ${!!cookies}, csrf: ${!!csrfToken}`);

      // Make the actual API request
      const apiHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (cookies) apiHeaders['Cookie'] = cookies;
      if (csrfToken) apiHeaders['X-CSRF-Token'] = csrfToken;

      const apiBody = (postData && ['POST', 'PUT', 'PATCH'].includes(method))
        ? JSON.stringify(postData)
        : undefined;

      let apiUrl = `${activeBase}${endpoint}`;
      console.log(`[LOCAL] API request: ${method || 'GET'} ${apiUrl}`);

      let apiResponse = await fetchLocal(apiUrl, {
        method: method || 'GET',
        headers: apiHeaders,
        body: apiBody,
      });

      // If 404, try with /proxy/network prefix (UniFi OS)
      if (apiResponse.status === 404 && !endpoint.startsWith('/proxy/network')) {
        await apiResponse.text();
        const prefixed = `/proxy/network${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        apiUrl = `${activeBase}${prefixed}`;
        console.log(`[LOCAL] Retrying with prefix: ${apiUrl}`);
        
        apiResponse = await fetchLocal(apiUrl, {
          method: method || 'GET',
          headers: apiHeaders,
          body: apiBody,
        });
      }

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        
        // For data endpoints, return empty instead of error on 404
        if (apiResponse.status === 404 && (endpoint.includes('/stat/') || endpoint.includes('/rest/'))) {
          return new Response(JSON.stringify({ data: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`UniFi API error ${apiResponse.status}: ${errorText}`);
      }

      const responseData = await apiResponse.json();
      console.log(`[LOCAL] Response keys: ${Object.keys(responseData)}, data length: ${Array.isArray(responseData?.data) ? responseData.data.length : 'N/A'}`);

      // Normalize response
      let finalResponse;
      if (responseData?.data !== undefined) {
        finalResponse = responseData;
      } else if (Array.isArray(responseData)) {
        finalResponse = { data: responseData };
      } else {
        finalResponse = { data: responseData };
      }

      return new Response(JSON.stringify(finalResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===================== CLOUD / SITE MANAGER API =====================
    else {
      const baseApiUrl = 'https://api.ui.com';
      
      const siteManagerHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': token_,
      };

      const coerceArray = (payload: any) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.dataExpand)) return payload.dataExpand;
        return [];
      };

      const safeNumber = (v: unknown): number | undefined => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const toUnix = (v: unknown): number | undefined => {
        if (typeof v === 'number' && Number.isFinite(v)) return v > 1e12 ? Math.floor(v / 1000) : Math.floor(v);
        if (typeof v === 'string' && v.trim()) {
          const n = Number(v);
          if (Number.isFinite(n)) return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
          const d = Date.parse(v);
          if (!isNaN(d)) return Math.floor(d / 1000);
        }
        return undefined;
      };

      // Extract siteId from endpoint
      const siteMatch = endpoint.match(/\/api\/s\/([^\/]+)/) || endpoint.match(/\/sites\/([^\/]+)/);
      const siteId = siteMatch ? siteMatch[1] : '';
      const hostMatch = endpoint.match(/\/hosts\/([^\/]+)/);
      const hostId = hostMatch ? hostMatch[1] : '';

      // Determine request type
      const isDevice = endpoint.includes('/stat/device') || endpoint.includes('/devices');
      const isClient = endpoint.includes('/stat/sta') || endpoint.includes('/clients');
      const isNetwork = endpoint.includes('/rest/wlanconf') || endpoint.includes('/rest/networkconf') || endpoint.includes('/networks') || endpoint.includes('/wlans');
      const isAlarm = endpoint.includes('/stat/alarm') || endpoint.includes('/alarms') || endpoint.includes('/alerts');
      const isHealth = endpoint.includes('/stat/health') || endpoint.includes('/health');
      const isSites = endpoint.includes('/self/sites') || endpoint === '/v1/sites';

      // Build candidate cloud endpoints
      const cloudEndpoints: string[] = [];
      
      if (isSites) {
        cloudEndpoints.push('/v1/sites');
      } else if (isDevice && siteId) {
        // Try site-specific first, then global with host filter
        cloudEndpoints.push(`/v1/sites/${siteId}/devices`);
        const q = new URLSearchParams({ pageSize: '500' });
        cloudEndpoints.push(`/v1/devices?${q.toString()}`);
      } else if (isClient && siteId) {
        cloudEndpoints.push(`/v1/sites/${siteId}/clients?limit=500`);
        cloudEndpoints.push(`/v1/sites/${siteId}/clients`);
      } else if (isNetwork && siteId) {
        cloudEndpoints.push(`/v1/sites/${siteId}/networks`);
        cloudEndpoints.push(`/v1/sites/${siteId}/wlans`);
      } else if (isAlarm && siteId) {
        cloudEndpoints.push(`/v1/sites/${siteId}/alarms`);
        cloudEndpoints.push(`/v1/sites/${siteId}/alerts`);
        cloudEndpoints.push(`/v1/sites/${siteId}/events`);
      } else if (isHealth && siteId) {
        cloudEndpoints.push(`/v1/sites/${siteId}/health`);
      } else if (endpoint.startsWith('/v1/') || endpoint.startsWith('/ea/')) {
        cloudEndpoints.push(endpoint);
      } else {
        cloudEndpoints.push(endpoint);
      }

      const requestOptions: RequestInit = {
        method: method || 'GET',
        headers: siteManagerHeaders,
      };
      if (postData && ['POST', 'PUT', 'PATCH'].includes(method)) {
        requestOptions.body = JSON.stringify(postData);
      }

      let apiResponse: Response | null = null;
      let resolvedEndpoint = '';

      for (const ep of cloudEndpoints) {
        const url = `${baseApiUrl}${ep}`;
        console.log(`[CLOUD] Trying: ${url}`);
        const resp = await fetch(url, requestOptions);
        
        if (resp.ok) {
          apiResponse = resp;
          resolvedEndpoint = ep;
          break;
        }

        const errText = await resp.text();
        console.warn(`[CLOUD] ${ep} => ${resp.status}: ${errText.substring(0, 200)}`);
        
        if (resp.status === 401) throw new Error('API Token inválido ou expirado.');
        if (resp.status === 403) throw new Error('API Token sem permissões.');
        if (resp.status !== 404) throw new Error(`Cloud API error: ${resp.status} - ${errText}`);
      }

      if (!apiResponse) {
        return new Response(JSON.stringify({ data: [], meta: { cloudDetailUnavailable: true } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const responseData = await apiResponse.json();
      const items = coerceArray(responseData);
      
      console.log(`[CLOUD] ${resolvedEndpoint} => ${items.length} items`);

      // Normalize based on type
      const normalizeDevice = (d: any) => {
        const state = String(d.status || d.state || d.connectionState || '').toLowerCase();
        const isOnline = Boolean(d.isConnected) || ['online','connected','ready','active'].some(t => state.includes(t));
        const sysStats = d['sys-stats'] || d.sysStats || d.latestStatistics || {};
        return {
          ...d,
          id: String(d.id || d.mac || ''),
          mac: String(d.mac || d.macAddress || d.primaryMac || ''),
          name: d.name || d.hostname || d.model || 'UniFi Device',
          displayName: d.displayName || d.alias || d.name || d.hostname || d.model || 'Device',
          model: d.model || d.productModel || 'UniFi',
          type: String(d.type || d.deviceType || d.model || 'unknown').toLowerCase(),
          ip: d.ip || d.ipAddress || d.latestConnectionState?.ipAddress || '',
          status: isOnline ? 'online' : 'offline',
          state: isOnline ? 1 : 0,
          adopted: Boolean(d.adopted ?? d.isAdopted ?? true),
          uptime: safeNumber(d.uptime ?? sysStats.uptime),
          version: d.version || d.firmwareVersion || '',
          siteId: String(d.siteId || d.site_id || siteId),
          connectedClients: safeNumber(d.connectedClients ?? d.num_sta) || 0,
          'sys-stats': { cpu: safeNumber(sysStats.cpu ?? sysStats.cpuUtilizationPct) || 0, mem: safeNumber(sysStats.mem ?? sysStats.memoryUtilizationPct) || 0 },
        };
      };

      const normalizeClient = (c: any) => {
        const isWired = Boolean(c.isWired ?? c.wired ?? String(c.connectionType || c.type || '').toLowerCase().includes('wired'));
        return {
          ...c,
          id: String(c.id || c.mac || ''),
          mac: String(c.mac || c.macAddress || ''),
          name: c.name || c.hostname || c.displayName || 'Client',
          hostname: c.hostname || c.name || '',
          ip: c.ip || c.ipAddress || '',
          network: c.network || c.networkName || c.ssid || 'N/A',
          isWired, is_wired: isWired,
          isGuest: Boolean(c.isGuest ?? c.guest),
          signal: safeNumber(c.signal ?? c.rssi),
          rssi: safeNumber(c.rssi ?? c.signal),
          uptime: safeNumber(c.uptime),
          lastSeen: toUnix(c.lastSeen ?? c.lastSeenAt),
          rxBytes: safeNumber(c.rxBytes ?? c.downloadBytes) || 0,
          txBytes: safeNumber(c.txBytes ?? c.uploadBytes) || 0,
          siteId: String(c.siteId || c.site_id || siteId),
        };
      };

      const normalizeNetwork = (n: any) => ({
        ...n,
        id: String(n.id || n._id || n.name || ''),
        name: n.name || n.ssid || 'Network',
        purpose: n.purpose || n.type || n.networkGroup || 'corporate',
        enabled: Boolean(n.enabled ?? n.isEnabled ?? true),
        networkgroup: n.networkgroup || n.networkGroup || n.purpose || '',
        siteId: String(n.siteId || siteId),
      });

      const normalizeAlarm = (a: any) => ({
        ...a,
        id: String(a.id || a._id || ''),
        message: a.message || a.description || a.text || 'Alert',
        datetime: toUnix(a.time ?? a.timestamp ?? a.createdAt) || Math.floor(Date.now() / 1000),
        archived: Boolean(a.archived ?? a.isArchived ?? false),
        siteId: String(a.siteId || siteId),
      });

      let finalData;
      if (resolvedEndpoint === '/v1/hosts') {
        const hosts = items;
        if (hosts.length === 0) {
          return new Response(JSON.stringify({ data: [], meta: { empty_response: true } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        finalData = hosts.map((h: any) => ({
          id: h.id || h.hardwareId,
          hardwareId: h.hardwareId || h.hardware_id,
          type: h.reportedState?.host_type === 0 ? 'network-server' : (h.type || 'unknown'),
          ipAddress: h.reportedState?.ipAddrs?.[0] || h.ipAddress || 'unknown',
          owner: h.owner || false,
          isBlocked: h.isBlocked ?? false,
          registrationTime: h.registrationTime,
          lastConnectionStateChange: h.lastConnectionStateChange,
          userData: h.userData,
          reportedState: h.reportedState,
          sitesCount: 0,
          isValid: true,
        }));
      } else if (isDevice) {
        finalData = items
          .filter((d: any) => !siteId || String(d.siteId || d.site_id || d.hostSiteId || '') === siteId || resolvedEndpoint.includes(`/sites/${siteId}/`))
          .map((d: any) => normalizeDevice(d));
      } else if (isClient) {
        finalData = items.map((c: any) => normalizeClient(c));
      } else if (isNetwork) {
        finalData = items.map((n: any) => normalizeNetwork(n));
      } else if (isAlarm) {
        finalData = items.map((a: any) => normalizeAlarm(a));
      } else {
        finalData = items;
      }

      return new Response(JSON.stringify({ data: finalData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in unifi-proxy:', error);
    
    let status = 400;
    let errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('Authorization header')) {
      status = 401;
    } else if (errorMessage.includes('Falha ao conectar') || errorMessage.includes('SSL/TLS')) {
      status = 502;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage, details: errorMessage, timestamp: new Date().toISOString() }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
