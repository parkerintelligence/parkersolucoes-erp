import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const PINNED_CA_CERTS: Record<string, string> = {
  'unifi.parkersolucoes.com.br': `-----BEGIN CERTIFICATE-----
MIIDfTCCAmWgAwIBAgIEZq9+szANBgkqhkiG9w0BAQsFADBrMQswCQYDVQQGEwJV
UzERMA8GA1UECAwITmV3IFlvcmsxETAPBgNVBAcMCE5ldyBZb3JrMRYwFAYDVQQK
DA1VYmlxdWl0aSBJbmMuMQ4wDAYDVQQLDAVVbmlGaTEOMAwGA1UEAwwFVW5pRmkw
HhcNMjQwODA0MTMxNDI3WhcNMjYxMTA3MTMxNDI3WjBrMQswCQYDVQQGEwJVUzER
MA8GA1UECAwITmV3IFlvcmsxETAPBgNVBAcMCE5ldyBZb3JrMRYwFAYDVQQKDA1V
YmlxdWl0aSBJbmMuMQ4wDAYDVQQLDAVVbmlGaTEOMAwGA1UEAwwFVW5pRmkwggEi
MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDJLVhku+xEptIgK+gUwwk/KETR
uZ3+gEJUKHXuXUUZlKer1o+PthZc9DLrZNPqRxO26nbINYZo7JO7MPUoPmJHWBv6
rDIQQeDkBxUOhl0VfxVgp62SOpaONxCQoBxObnZ7+yYgJ7UUFLfMS58HrQDd2Wja
xOhOgN9AzYiGZ7UdBEo6VY1lY+OdMYqegJDlV2OpxzB4G58tb6OxkeDVrRdFU92/
PI2MIp87ViaYY0jdpPcSuxi0Aglxu9a6vlMp4TSZF7d7AQJqA76nUAo8qKFxiYrz
M88I3GI7ToPU2CGBUmTfwOC2oOzm/LGd5S1GyVdVFwTXLjYlmjMYVb6vJhcfAgMB
AAGjKTAnMBAGA1UdEQQJMAeCBVVuaUZpMBMGA1UdJQQMMAoGCCsGAQUFBwMBMA0G
CSqGSIb3DQEBCwUAA4IBAQB+LC2L3BXsbCD5Y1NY+pI3DOenAl8/V90G25i8webl
3Z0zDZTUlGVh0abck/kmwyTzC4CrttwQMZILi4EHyNZxBt4k4M7QjC4SMfOJEhYB
pFpf3lHEIjQ0y9k4nUR5xmLMfjgtaiWwLQDwSyyS2FxKbW2sXp/A1JwOY46JIohB
zptdK9t1t7JTSG5a5lRJwiQZzSHdsxpVTsJ7XYYwTtzjfKiOQOfSSEhFz3Urvq1e
zP7T+eVdrqtHBhulKVgkESiadWc6b3riLjCZ+XRYVs9aUXPdAPJUQlXmWkuGPbMh
G8Xsdi9SISUbbJfT8Uzg7b0F0edZRy0YMhbtmHlN/UNY
-----END CERTIFICATE-----`,
};

const TLS_HOST_ALIASES: Record<string, string[]> = {
  'unifi.parkersolucoes.com.br': ['UniFi'],
};

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, '');

const CRLF_BYTES = new Uint8Array([13, 10]);

const findByteSequence = (source: Uint8Array, target: Uint8Array, start = 0) => {
  outer: for (let index = start; index <= source.length - target.length; index += 1) {
    for (let offset = 0; offset < target.length; offset += 1) {
      if (source[index + offset] !== target[offset]) {
        continue outer;
      }
    }

    return index;
  }

  return -1;
};

const decodeChunkedBody = (body: Uint8Array) => {
  let cursor = 0;
  const decodedChunks: Uint8Array[] = [];
  const decoder = new TextDecoder();

  while (cursor < body.length) {
    const sizeLineEnd = findByteSequence(body, CRLF_BYTES, cursor);
    if (sizeLineEnd === -1) {
      return decodedChunks.length > 0 ? concatUint8Arrays(decodedChunks) : body;
    }

    const sizeLine = decoder.decode(body.slice(cursor, sizeLineEnd)).trim();
    const sizeHex = sizeLine.split(';', 1)[0];
    const size = Number.parseInt(sizeHex, 16);

    if (!Number.isFinite(size)) {
      return decodedChunks.length > 0 ? concatUint8Arrays(decodedChunks) : body;
    }

    cursor = sizeLineEnd + CRLF_BYTES.length;

    if (size === 0) {
      return concatUint8Arrays(decodedChunks);
    }

    if (cursor + size > body.length) {
      return decodedChunks.length > 0 ? concatUint8Arrays(decodedChunks) : body;
    }

    decodedChunks.push(body.slice(cursor, cursor + size));
    cursor += size;

    if (body[cursor] === 13 && body[cursor + 1] === 10) {
      cursor += CRLF_BYTES.length;
    }
  }

  return decodedChunks.length > 0 ? concatUint8Arrays(decodedChunks) : body;
};

const parseRawHeaders = (headerText: string) => {
  const lines = headerText.split('\r\n');
  const [statusLine, ...headerLines] = lines;
  const headers = new Headers();

  for (const line of headerLines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    headers.append(key, value);
  }

  return { statusLine, headers };
};

const readRawHttpResponse = async (
  connection: Deno.Conn,
  timeoutMs: number,
) => {
  const buffer = new Uint8Array(65536); // 64KB buffer for large responses
  const startedAt = Date.now();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let headerEnd = -1;
  let contentLength: number | null = null;
  let isChunked = false;
  let headerByteLength = 0;

  const readWithTimeout = async (remainingMs: number) => {
    let timeoutId: number | undefined;
    try {
      return await Promise.race([
        connection.read(buffer),
        new Promise<null>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Tempo esgotado aguardando resposta da controladora local')), remainingMs);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  while (Date.now() - startedAt < timeoutMs) {
    const remainingMs = Math.max(1, timeoutMs - (Date.now() - startedAt));
    const bytesRead = await readWithTimeout(remainingMs);

    if (bytesRead === null) break;

    const chunk = buffer.slice(0, bytesRead);
    chunks.push(chunk);
    totalBytes += bytesRead;

    // Check for header end if not found yet
    if (headerEnd === -1) {
      const decoder = new TextDecoder();
      const partialStr = decoder.decode(concatUint8Arrays(chunks));
      headerEnd = partialStr.indexOf('\r\n\r\n');
      if (headerEnd !== -1) {
        const { headers } = parseRawHeaders(partialStr.slice(0, headerEnd));
        const contentLengthHeader = headers.get('content-length');
        contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : null;
        isChunked = headers.get('transfer-encoding')?.toLowerCase().includes('chunked') ?? false;
        // Calculate header byte length (header text + \r\n\r\n separator)
        headerByteLength = new TextEncoder().encode(partialStr.slice(0, headerEnd + 4)).length;
      }
    }

    if (headerEnd !== -1) {
      const bodyBytes = totalBytes - headerByteLength;

      if (contentLength !== null && bodyBytes >= contentLength) {
        break;
      }

      if (isChunked) {
        // Check for chunked terminator in the last few bytes
        const decoder = new TextDecoder();
        const tail = decoder.decode(concatUint8Arrays(chunks));
        if (tail.includes('\r\n0\r\n\r\n')) {
          break;
        }
      }
    }
  }

  if (chunks.length === 0) {
    throw new Error('A controladora local não retornou dados');
  }

  const decoder = new TextDecoder();
  return decoder.decode(concatUint8Arrays(chunks));
};

const concatUint8Arrays = (arrays: Uint8Array[]): Uint8Array => {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
};

const extractCookies = (headers: Headers) => {
  const headerWithSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const setCookieEntries = headerWithSetCookie.getSetCookie?.() || [];
  const rawHeader = headers.get('set-cookie');

  if (rawHeader) {
    setCookieEntries.push(
      ...rawHeader
        .split(/,(?=\s*[^;,=\s]+=[^;,]+)/)
        .map((value) => value.trim())
        .filter(Boolean)
    );
  }

  const cookies: Record<string, string> = {};
  for (const cookieEntry of setCookieEntries) {
    const pair = cookieEntry.split(';')[0]?.trim();
    if (!pair) continue;
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) continue;
    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (name) cookies[name] = value;
  }

  return {
    cookies,
    cookieHeader: Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; '),
  };
};

const responseFromRawHttp = (rawResponse: string) => {
  const splitIndex = rawResponse.indexOf('\r\n\r\n');
  if (splitIndex === -1) {
    throw new Error('Resposta HTTP inválida da controladora local');
  }

  const head = rawResponse.slice(0, splitIndex);
  const body = rawResponse.slice(splitIndex + 4);
  const { statusLine, headers } = parseRawHeaders(head);
  const statusMatch = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})\s*(.*)$/i);

  if (!statusMatch) {
    throw new Error(`Status HTTP inválido da controladora local: ${statusLine}`);
  }

  const responseHeaders = new Headers(headers);
  const bodyBytes = new TextEncoder().encode(body);
  const parsedBody = responseHeaders.get('transfer-encoding')?.toLowerCase().includes('chunked')
    ? decodeChunkedBody(bodyBytes)
    : bodyBytes;

  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('content-length');

  return new Response(new TextDecoder().decode(parsedBody), {
    status: Number(statusMatch[1]),
    statusText: statusMatch[2] || '',
    headers: responseHeaders,
  });
};

const resolvePinnedCaCert = (url: string) => {
  try {
    return PINNED_CA_CERTS[new URL(url).hostname] || null;
  } catch {
    return null;
  }
};

const buildTlsHostnameCandidates = (url: string) => {
  const hostname = new URL(url).hostname;
  // Try cert-matching aliases FIRST (e.g. "UniFi" matches the cert SAN),
  // then fall back to the actual hostname with unsafelyDisableHostnameVerification.
  const aliases = TLS_HOST_ALIASES[hostname] || [];
  return ['UniFi', ...aliases, hostname]
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
};

const openLocalTlsConnection = async (
  parsedUrl: URL,
  caCert?: string | null,
) => {
  const tlsHostnameCandidates = buildTlsHostnameCandidates(parsedUrl.toString());
  let lastError = '';

  for (const tlsHostname of tlsHostnameCandidates) {
    let tcpConnection: Deno.TcpConn | null = null;

    try {
      tcpConnection = await Deno.connect({
        hostname: parsedUrl.hostname,
        port: Number(parsedUrl.port || '443'),
      });

      const tlsConnection = await Deno.startTls(tcpConnection, {
        hostname: tlsHostname,
        caCerts: caCert ? [caCert] : undefined,
        alpnProtocols: ['http/1.1'],
        unsafelyDisableHostnameVerification: true,
      });

      console.log(`[LOCAL] TLS handshake OK using hostname: ${tlsHostname}`);
      return tlsConnection;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[LOCAL] TLS handshake failed using hostname ${tlsHostname}: ${lastError}`);

      try {
        tcpConnection?.close();
      } catch (_) {
        // no-op
      }
    }
  }

  throw new Error(lastError || `Falha no handshake TLS com ${parsedUrl.hostname}`);
};

const fetchLocalTlsSocket = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000,
  caCert?: string | null,
): Promise<Response> => {
  const parsedUrl = new URL(url);
  const connection = await openLocalTlsConnection(parsedUrl, caCert);

  const encoder = new TextEncoder();

  try {
    const method = options.method || 'GET';
    const headers = new Headers(options.headers || {});
    const body = typeof options.body === 'string' ? options.body : options.body ? String(options.body) : '';

    if (!headers.has('Host')) headers.set('Host', parsedUrl.host);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (!headers.has('Accept-Encoding')) headers.set('Accept-Encoding', 'identity');
    if (!headers.has('Connection')) headers.set('Connection', 'close');
    if (body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (body && !headers.has('Content-Length')) headers.set('Content-Length', String(encoder.encode(body).length));

    const path = `${parsedUrl.pathname}${parsedUrl.search}` || '/';
    let rawRequest = `${method} ${path} HTTP/1.1\r\n`;
    headers.forEach((value, key) => {
      rawRequest += `${key}: ${value}\r\n`;
    });
    rawRequest += `\r\n${body}`;

    console.log(`[LOCAL-SOCKET] Writing request to ${parsedUrl.host}${path}...`);
    await connection.write(encoder.encode(rawRequest));
    console.log(`[LOCAL-SOCKET] Write OK, reading response...`);
    const rawResponse = await readRawHttpResponse(connection, timeoutMs);
    console.log(`[LOCAL-SOCKET] Read OK, response length: ${rawResponse.length}`);
    return responseFromRawHttp(rawResponse);
  } finally {
    try {
      connection.close();
    } catch (_) {
      // no-op
    }
  }
};

// For local controllers, try Deno.createHttpClient with pinned CA cert first.
// Fall back to raw TLS socket only if the HTTP client approach fails.
const fetchLocal = async (url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> => {
  const isHttps = url.startsWith('https://');

  if (isHttps) {
    const pinnedCaCert = resolvePinnedCaCert(url);
    
    // Try Deno.createHttpClient with pinned CA cert - handles HTTP protocol properly
    try {
      const clientOptions: any = {};
      if (pinnedCaCert) {
        clientOptions.caCerts = [pinnedCaCert];
      }
      const httpClient = Deno.createHttpClient(clientOptions);
      
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const resp = await fetch(url, { ...options, signal: ctrl.signal, client: httpClient } as any);
        clearTimeout(tid);
        return resp;
      } catch (fetchErr) {
        clearTimeout(tid);
        throw fetchErr;
      }
    } catch (clientErr) {
      const errMsg = clientErr instanceof Error ? clientErr.message : String(clientErr);
      // If it's a cert/hostname error, fall back to raw TLS socket
      if (errMsg.includes('certificate') || errMsg.includes('hostname') || errMsg.includes('NotValidForName') || errMsg.includes('tls')) {
        console.log(`[LOCAL] Deno.createHttpClient failed (${errMsg}), falling back to raw TLS socket`);
        return await fetchLocalTlsSocket(url, options, timeoutMs, pinnedCaCert);
      }
      throw clientErr;
    }
  }

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

const buildLocalEndpointVariants = (endpoint: string) => {
  const variants = [endpoint];

   if (endpoint.startsWith('/api/') && !endpoint.startsWith('/proxy/network/')) {
    variants.push(`/proxy/network${endpoint}`);
  }

  if (endpoint === '/api/self/sites') {
    variants.push('/api/stat/sites');
    variants.push('/proxy/network/api/self/sites');
    variants.push('/proxy/network/api/stat/sites');
  }

  if (endpoint.includes('/rest/wlanconf')) {
    variants.push(endpoint.replace('/rest/wlanconf', '/rest/networkconf'));
  }

  if (endpoint.includes('/rest/networkconf')) {
    variants.push(endpoint.replace('/rest/networkconf', '/rest/wlanconf'));
  }

  return variants.filter((value, index, array) => array.indexOf(value) === index);
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
    const { method, endpoint, integrationId, data: postData, test_config: testConfig, ignore_ssl: ignoreSsl } = requestBody;

    console.log('UniFi request:', { method, endpoint, integrationId });

    let integration: Record<string, any> | null = null;

    if (!testConfig) {
      const { data, error: integrationError } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('type', 'unifi')
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .maybeSingle();

      if (integrationError || !data) {
        throw new Error('UniFi integration not found');
      }

      if (!data.is_active) {
        throw new Error('UniFi integration is not active');
      }

      integration = data;
    }

    const { base_url, username, password, api_token, use_ssl, port } = integration ?? testConfig ?? {};
    const baseUrl = typeof base_url === 'string' ? normalizeUrl(base_url) : '';
    const user_ = typeof username === 'string' ? username.trim() : '';
    const pass_ = typeof password === 'string' ? password.trim() : '';
    const token_ = typeof api_token === 'string' ? api_token.trim() : '';

    const hasLocal = !!(baseUrl && user_ && pass_);
    const hasCloud = !testConfig && !!token_;
    const isLocalEndpoint = typeof endpoint === 'string' && endpoint.startsWith('/api/');
    const useLocal = hasLocal && (isLocalEndpoint || !hasCloud);

    console.log('Mode:', useLocal ? 'LOCAL' : 'CLOUD', { baseUrl, hasLocal, hasCloud, endpoint });

    if (!useLocal && !hasCloud) {
      throw new Error('Configuração UniFi incompleta. Necessário: (base_url + username + password) para local OU (api_token) para cloud.');
    }

    // ===================== LOCAL CONTROLLER =====================
    if (useLocal) {
      const candidates: string[] = [];
      const addCandidate = (url: string) => {
        const normalized = normalizeUrl(url);
        if (!candidates.includes(normalized)) candidates.push(normalized);
      };

      const parsedBaseUrl = new URL(baseUrl);
      const preferHttps = parsedBaseUrl.protocol === 'https:' || use_ssl !== false;
      const basePort = parsedBaseUrl.port || (preferHttps ? '443' : '80');
      const configPort = String(port ?? '').trim();

      // 1) URL exata configurada pelo usuário
      addCandidate(baseUrl);

      // 2) Mesma origem com a porta do campo port, se diferente
      if (configPort && configPort !== basePort) {
        const urlWithConfigPort = new URL(baseUrl);
        urlWithConfigPort.port = configPort;
        addCandidate(urlWithConfigPort.toString());
      }

      const hasExplicitPort = Boolean(parsedBaseUrl.port || configPort);
      const allowPortFanout = Boolean(testConfig) || !hasExplicitPort;

      // 3) Portas comuns do UniFi apenas quando a porta não foi explicitamente configurada
      if (allowPortFanout) {
        for (const commonPort of ['8445', '8443', '443']) {
          if (commonPort !== basePort && commonPort !== configPort) {
            const candidate = new URL(baseUrl);
            candidate.protocol = 'https:';
            candidate.port = commonPort;
            addCandidate(candidate.toString());
          }
        }

        // 4) Fallback HTTP apenas quando estamos em modo diagnóstico/autodescoberta
        for (const fallbackPort of ['8080', '80']) {
          const candidate = new URL(baseUrl);
          candidate.protocol = 'http:';
          candidate.port = fallbackPort;
          addCandidate(candidate.toString());
        }
      }

      console.log('Local controller candidates:', candidates);

      const loginPaths = ['/api/login', '/api/auth/login', '/proxy/network/api/login', '/proxy/network/api/auth/login'];
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
      const maxDurationMs = testConfig ? 28000 : 12000;

      for (const candidate of candidates) {
        if (Date.now() - startTime > maxDurationMs) break;

        for (const loginPath of loginPaths) {
          if (Date.now() - startTime > maxDurationMs) break;

          const loginUrl = `${candidate}${loginPath}`;
          console.log(`[LOCAL] Trying: ${loginUrl}`);

          try {
            const response = await fetchLocal(loginUrl, {
              method: 'POST',
              headers: loginHeaders,
              body: loginBody,
            }, 7000);

            console.log(`[LOCAL] ${loginUrl} => ${response.status}`);

            if (response.status === 404) {
              await response.text();
              continue;
            }

            if (response.ok) {
              loginResponse = response;
              activeBase = candidate;
              break;
            }

            const bodyText = await response.text();

            if ((response.status === 401 || response.status === 403) && loginPath === '/api/login' && !bodyText.includes('NoSiteContext')) {
              throw new Error(`Credenciais inválidas (${response.status}): ${bodyText}`);
            }

            lastError = `${response.status}: ${bodyText}`;
            console.log(`[LOCAL] Response body: ${bodyText.substring(0, 200)}`);
          } catch (error) {
            if (error instanceof Error && error.message.startsWith('Credenciais inválidas')) throw error;
            lastError = error instanceof Error ? error.message : String(error);
            console.warn(`[LOCAL] Failed: ${loginUrl} => ${lastError}`);
          }
        }

        if (loginResponse) break;
      }

      if (!loginResponse || !activeBase) {
        throw new Error(`Falha ao conectar na controladora local. Tentativas: ${candidates.join(', ')}. Último erro: ${lastError || 'sem resposta da controladora'}`);
      }

      const { cookieHeader: cookies, cookies: sessionCookies } = extractCookies(loginResponse.headers);
      const csrfToken = loginResponse.headers.get('x-csrf-token') || sessionCookies.csrf_token || '';

      console.log(`[LOCAL] Login OK at ${activeBase}, cookies: ${!!cookies}, csrf: ${!!csrfToken}`);

      const apiHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (cookies) apiHeaders['Cookie'] = cookies;
      if (csrfToken) apiHeaders['X-CSRF-Token'] = csrfToken;

      console.log(`[LOCAL] Login mode ssl=${preferHttps} ignore_ssl=${Boolean(ignoreSsl)} activeBase=${activeBase}`);

      const apiBody = postData && ['POST', 'PUT', 'PATCH'].includes(method || '')
        ? JSON.stringify(postData)
        : undefined;

      const endpointVariants = buildLocalEndpointVariants(endpoint);

      let apiResponse: Response | null = null;
      let resolvedEndpoint = endpoint;

      for (const endpointVariant of endpointVariants) {
        const apiUrl = `${activeBase}${endpointVariant}`;
        console.log(`[LOCAL] API request: ${method || 'GET'} ${apiUrl}`);

        // Use longer timeout for data-heavy endpoints
        const isHeavyEndpoint = apiUrl.includes('/stat/sta') || apiUrl.includes('/stat/device') || apiUrl.includes('/rest/networkconf');
        const apiTimeout = isHeavyEndpoint ? 25000 : 10000;
        
        const response = await fetchLocal(apiUrl, {
          method: method || 'GET',
          headers: apiHeaders,
          body: apiBody,
        }, apiTimeout);

        if (response.ok) {
          apiResponse = response;
          resolvedEndpoint = endpointVariant;
          break;
        }

        if (response.status === 404) {
          await response.text();
          continue;
        }

        apiResponse = response;
        resolvedEndpoint = endpointVariant;
        break;
      }

      if (!apiResponse) {
        throw new Error(`UniFi API error: endpoint não encontrado para ${endpoint}`);
      }

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();

        if (apiResponse.status === 404 && (endpoint.includes('/stat/') || endpoint.includes('/rest/'))) {
          return new Response(JSON.stringify({ data: [], meta: { resolvedEndpoint } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        throw new Error(`UniFi API error ${apiResponse.status}: ${errorText}`);
      }

      // Read as text first and sanitize control characters that corrupt JSON from raw TLS socket
      let responseText = await apiResponse.text();
      // Remove control characters (except \n, \r, \t) that break JSON.parse
      responseText = responseText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error(`[LOCAL] JSON parse error, text length: ${responseText.length}, first 200 chars: ${responseText.substring(0, 200)}`);
        throw new Error(`Erro ao interpretar resposta da controladora: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      }
      console.log(`[LOCAL] Response keys: ${Object.keys(responseData ?? {})}, data length: ${Array.isArray(responseData?.data) ? responseData.data.length : 'N/A'}`);

      const finalResponse = responseData?.data !== undefined
        ? responseData
        : Array.isArray(responseData)
          ? { data: responseData, meta: { resolvedEndpoint } }
          : { data: responseData, meta: { resolvedEndpoint } };

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
