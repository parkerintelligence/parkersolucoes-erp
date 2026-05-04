import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const CRLF_BYTES = new Uint8Array([13, 10]);

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

const readRawHttpResponse = async (connection: Deno.Conn, timeoutMs: number) => {
  const buffer = new Uint8Array(65536);
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
          timeoutId = setTimeout(() => reject(new Error('Tempo esgotado aguardando resposta do Wazuh')), remainingMs);
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

    if (headerEnd === -1) {
      const decoder = new TextDecoder();
      const partialStr = decoder.decode(concatUint8Arrays(chunks));
      headerEnd = partialStr.indexOf('\r\n\r\n');

      if (headerEnd !== -1) {
        const { headers } = parseRawHeaders(partialStr.slice(0, headerEnd));
        const contentLengthHeader = headers.get('content-length');
        contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : null;
        isChunked = headers.get('transfer-encoding')?.toLowerCase().includes('chunked') ?? false;
        headerByteLength = new TextEncoder().encode(partialStr.slice(0, headerEnd + 4)).length;
      }
    }

    if (headerEnd !== -1) {
      const bodyBytes = totalBytes - headerByteLength;

      if (contentLength !== null && bodyBytes >= contentLength) {
        break;
      }

      if (isChunked) {
        const decoder = new TextDecoder();
        const tail = decoder.decode(concatUint8Arrays(chunks));
        if (tail.includes('\r\n0\r\n\r\n')) {
          break;
        }
      }
    }
  }

  if (chunks.length === 0) {
    throw new Error('O servidor Wazuh não retornou dados');
  }

  return new TextDecoder().decode(concatUint8Arrays(chunks));
};

const responseFromRawHttp = (rawResponse: string) => {
  const splitIndex = rawResponse.indexOf('\r\n\r\n');
  if (splitIndex === -1) {
    throw new Error('Resposta HTTP inválida do Wazuh');
  }

  const head = rawResponse.slice(0, splitIndex);
  const body = rawResponse.slice(splitIndex + 4);
  const { statusLine, headers } = parseRawHeaders(head);
  const statusMatch = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})\s*(.*)$/i);

  if (!statusMatch) {
    throw new Error(`Status HTTP inválido do Wazuh: ${statusLine}`);
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

const buildTlsHostnameCandidates = (url: string) => {
  const hostname = new URL(url).hostname;
  return [hostname, 'localhost', '127.0.0.1']
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
};

const openLocalTlsConnection = async (parsedUrl: URL) => {
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
        alpnProtocols: ['http/1.1'],
        unsafelyDisableHostnameVerification: true,
      });

      console.log(`[WAZUH-LOCAL] TLS handshake OK using hostname: ${tlsHostname}`);
      return tlsConnection;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[WAZUH-LOCAL] TLS handshake failed using hostname ${tlsHostname}: ${lastError}`);

      try {
        tcpConnection?.close();
      } catch (_) {
        // no-op
      }
    }
  }

  throw new Error(lastError || `Falha no handshake TLS com ${parsedUrl.hostname}`);
};

const fetchLocalTlsSocket = async (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
  const parsedUrl = new URL(url);
  const connection = await openLocalTlsConnection(parsedUrl);
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

    await connection.write(encoder.encode(rawRequest));
    const rawResponse = await readRawHttpResponse(connection, timeoutMs);
    return responseFromRawHttp(rawResponse);
  } finally {
    try {
      connection.close();
    } catch (_) {
      // no-op
    }
  }
};

const fetchWazuh = async (url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> => {
  if (url.startsWith('https://')) {
    try {
      const hostname = new URL(url).hostname;
      const httpClient = Deno.createHttpClient({
        unsafelyIgnoreCertificateErrors: [hostname],
      });
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), timeoutMs);

      try {
        const response = await fetch(url, { ...options, signal: ctrl.signal, client: httpClient } as any);
        clearTimeout(tid);
        return response;
      } catch (fetchError) {
        clearTimeout(tid);
        throw fetchError;
      }
    } catch (clientErr) {
      const errMsg = clientErr instanceof Error ? clientErr.message : String(clientErr);
      if (errMsg.includes('certificate') || errMsg.includes('hostname') || errMsg.includes('NotValidForName') || errMsg.includes('tls')) {
        console.log(`[WAZUH-LOCAL] HTTPS fetch failed (${errMsg}), falling back to raw TLS socket`);
        return await fetchLocalTlsSocket(url, options, timeoutMs);
      }
      throw clientErr;
    }
  }

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
};

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
    const { method, endpoint, integrationId, action } = requestBody;

    console.log('Wazuh proxy request:', { method, endpoint, integrationId, action, userId: user.id });

    // ========== HEALTH-CHECK ACTION (pre-save, no DB required) ==========
    if (action === 'health-check') {
      const { base_url: hcUrl, username: hcUser, password: hcPass, api_token: hcToken } = requestBody;
      console.log('🩺 Health-check requested for:', hcUrl);

      if (!hcUrl) {
        return new Response(JSON.stringify({ success: false, error: 'URL é obrigatória' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (!hcToken && (!hcUser || !hcPass)) {
        return new Response(JSON.stringify({ success: false, error: 'Informe usuário/senha ou API token' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const normalizeHcUrl = (rawUrl: string, protocol: 'http' | 'https') => {
        const trimmed = rawUrl.trim().replace(/\/+$/, '');
        const hasProto = /^https?:\/\//i.test(trimmed);
        const withProto = hasProto ? trimmed : `${protocol}://${trimmed}`;
        const parsed = new URL(withProto);
        if (!parsed.port) parsed.port = '55000';
        parsed.protocol = `${protocol}:`;
        return parsed.toString().replace(/\/+$/, '');
      };

      const buildCandidates = (rawUrl: string) => {
        const trimmed = rawUrl.trim();
        if (/^https?:\/\//i.test(trimmed)) {
          const parsed = new URL(trimmed);
          const primary = parsed.protocol.replace(':', '') as 'http' | 'https';
          const secondary = primary === 'https' ? 'http' : 'https';
          return [normalizeHcUrl(trimmed, primary), normalizeHcUrl(trimmed, secondary)];
        }
        return [normalizeHcUrl(trimmed, 'https'), normalizeHcUrl(trimmed, 'http')];
      };

      const candidates = [...new Set(buildCandidates(hcUrl))];
      const results: Array<{
        url: string;
        protocol: string;
        reachable: boolean;
        tlsValid: boolean;
        authOk: boolean;
        managerInfo: any | null;
        error: string | null;
        errorType: string | null;
      }> = [];

      for (const candidate of candidates) {
        const protocol = candidate.startsWith('https') ? 'HTTPS' : 'HTTP';
        const result = {
          url: candidate,
          protocol,
          reachable: false,
          tlsValid: protocol === 'HTTP',
          authOk: false,
          managerInfo: null as any,
          error: null as string | null,
          errorType: null as string | null,
        };

        try {
          // Step 1: Auth
          const authUrl = `${candidate}/security/user/authenticate?raw=true`;
          let authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

          if (hcToken) {
            authHeaders['Authorization'] = `Bearer ${hcToken}`;
          } else {
            authHeaders['Authorization'] = `Basic ${btoa(`${hcUser}:${hcPass}`)}`;
          }

          const authResp = await fetchWazuh(authUrl, {
            method: 'GET',
            headers: authHeaders,
          }, 12000);

          result.reachable = true;
          result.tlsValid = true;

          const authText = await authResp.text();

          if (!authResp.ok) {
            result.error = `Auth HTTP ${authResp.status}: ${authText.substring(0, 200)}`;
            result.errorType = authResp.status === 401 ? 'auth_invalid' : 'auth_error';
            results.push(result);
            continue;
          }

          // Parse token
          let token = authText.trim();
          if (token.startsWith('{') || token.startsWith('[')) {
            const parsed = JSON.parse(token);
            token = parsed?.data?.token || parsed?.token || '';
          }
          if (!token) {
            result.error = 'Resposta de autenticação não contém token';
            result.errorType = 'auth_no_token';
            results.push(result);
            continue;
          }

          result.authOk = true;

          // Step 2: Manager info
          try {
            const infoResp = await fetchWazuh(`${candidate}/manager/info`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            }, 10000);
            if (infoResp.ok) {
              const infoData = await infoResp.json();
              result.managerInfo = infoData?.data?.affected_items?.[0] || infoData?.data || infoData;
            } else {
              await infoResp.text();
            }
          } catch (_) { /* manager info is optional */ }

          results.push(result);
          break; // success, no need to try next candidate
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result.reachable = !msg.includes('ECONNREFUSED') && !msg.includes('timeout');
          
          if (msg.includes('certificate') || msg.includes('UnknownIssuer') || msg.includes('self-signed') || msg.includes('NotValidForName')) {
            result.tlsValid = false;
            result.reachable = true;
            result.errorType = 'tls_invalid';
            result.error = msg.includes('NotValidForName')
              ? 'Certificado HTTPS não é válido para este hostname (SAN mismatch)'
              : 'Certificado SSL autoassinado ou emissor desconhecido';
          } else if (msg.includes('connection closed') || msg.includes('message completed')) {
            result.reachable = true;
            result.errorType = 'protocol_mismatch';
            result.error = `Servidor fechou a conexão ${protocol} — provavelmente espera o outro protocolo`;
          } else if (msg.includes('timeout') || msg.includes('AbortError')) {
            result.errorType = 'timeout';
            result.error = 'Timeout ao conectar (>12s)';
          } else {
            result.errorType = 'network';
            result.error = msg.substring(0, 300);
          }
          results.push(result);
        }
      }

      const success = results.some(r => r.authOk);
      const working = results.find(r => r.authOk);

      return new Response(JSON.stringify({
        success,
        results,
        summary: success
          ? `✅ Conexão OK via ${working!.protocol} em ${working!.url}${working!.managerInfo ? ` — Wazuh ${working!.managerInfo.version || ''}` : ''}`
          : `❌ Falha em todos os candidatos: ${results.map(r => `${r.protocol}: ${r.error}`).join(' | ')}`,
        recommendation: !success
          ? results.some(r => r.errorType === 'tls_invalid')
            ? 'Instale um certificado SSL válido (Let\'s Encrypt) ou use um reverse proxy Nginx/Caddy com HTTPS válido.'
            : results.some(r => r.errorType === 'protocol_mismatch')
            ? 'O servidor espera um protocolo diferente. Tente alternar entre http:// e https:// na URL.'
            : results.some(r => r.errorType === 'auth_invalid')
            ? 'Credenciais inválidas. Verifique usuário e senha do Wazuh API.'
            : 'Verifique se o servidor Wazuh está acessível e a porta está aberta.'
          : null,
      }), {
        status: success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== NORMAL PROXY FLOW ==========
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
    const targetHostname = new URL(originalBaseUrl).hostname;

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
      const hostname = new URL(baseUrl).hostname;

      if (status === 401 || normalizedMessage.includes('invalid credentials') || normalizedMessage.includes('unauthorized')) {
        return `Authentication failed on ${protocol}: invalid username/password or API token`;
      }

      if (
        normalizedMessage.includes('certificate not valid for name') ||
        normalizedMessage.includes('not valid for name') ||
        normalizedMessage.includes('only valid for dnsname("localhost")') ||
        normalizedMessage.includes('only valid for dnsname')
      ) {
        return `HTTPS certificate hostname mismatch. The certificate presented by the Wazuh server is not valid for ${hostname}; it appears to be issued only for localhost.`;
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
          const authResponse = await fetchWazuh(authUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json'
            }
          }, 15000);

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
            `1️⃣ Corrija o certificado HTTPS do Wazuh para incluir ${targetHostname} no CN/SAN. O certificado atual parece estar válido apenas para localhost.`,
            '2️⃣ Se quiser usar HTTPS no Supabase Edge Functions, o certificado precisa ser válido e confiável publicamente (por exemplo, Let\'s Encrypt).',
            '3️⃣ Como alternativa, exponha um HTTP real na porta 55000 e salve a URL com http://, sem redirecionamento para HTTPS.',
            '4️⃣ Revise usuário/senha ou configure um API token válido após corrigir o certificado/protocolo.',
            `5️⃣ Teste no servidor: curl -u usuario:senha -k https://${targetHostname}:55000/security/user/authenticate?raw=true`
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

    const apiResponse = await fetchWazuh(apiUrl, {
      method: method || 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      }
    }, 30000);

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