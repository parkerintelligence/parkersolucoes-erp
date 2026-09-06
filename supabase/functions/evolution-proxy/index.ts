import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { listGoInstances, normalizeEvolutionBaseUrl, resolveInstanceToken, sendWhatsAppText } from "../_shared/evolutionGo.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const parseJson = (raw: string) => {
  try { return JSON.parse(raw); } catch { return raw; }
};

const unwrap = (payload: any) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload);

const statusFromGo = (inst: any) => {
  const connected = inst?.connected ?? inst?.Connected;
  if (connected === true) return 'open';
  if (connected === false) return 'close';
  return 'unknown';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { integrationId, endpoint, method = 'GET' } = payload;
    const body = payload.body ?? payload.data;
    console.log(`🔄 Evolution Go Proxy: ${method} ${endpoint}`, { integrationId, hasBody: !!body });

    if (!integrationId || !endpoint) {
      return json({ error: 'integrationId and endpoint are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: integration, error: dbError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (dbError || !integration) {
      console.error('Integration not found:', dbError);
      return json({ error: 'Integration not found' }, 404);
    }

    const baseUrl = normalizeEvolutionBaseUrl(integration.base_url || '');
    const globalKey = integration.api_token || '';

    if (!baseUrl || !globalKey) {
      return json({ error: 'Integration missing base_url or api_token' }, 400);
    }

    const goFetch = async (path: string, httpMethod: string, token: string, payload?: unknown) => {
      const url = `${baseUrl}${path}`;
      console.log(`📡 Evolution Go: ${httpMethod} ${url}`);
      const res = await fetch(url, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json', apikey: token },
        body: payload && httpMethod !== 'GET' && httpMethod !== 'DELETE' ? JSON.stringify(payload) : undefined,
      });
      const raw = await res.text();
      const contentType = res.headers.get('content-type') || '';
      console.log(`📥 ${res.status} ${raw.substring(0, 500)}`);
      if (res.ok && contentType.includes('text/html')) {
        return {
          status: 502,
          ok: false,
          data: { error: 'A URL configurada aponta para o painel web, não para a API do Evolution Go.' },
          raw,
        };
      }
      return { status: res.status, ok: res.ok, data: unwrap(parseJson(raw)), raw };
    };

    const nameFromEndpoint = (prefix: string) =>
      decodeURIComponent(endpoint.replace(prefix, '').split('?')[0] || '');

    // ---- Listar instâncias ----
    if (endpoint.startsWith('/instance/fetchInstances') || endpoint.startsWith('/instance/all')) {
      const list = await listGoInstances(baseUrl, globalKey);
      const normalized = list.map((inst: any) => ({
        instanceName: inst?.name ?? inst?.instanceName,
        instanceId: inst?.id,
        connectionStatus: statusFromGo(inst),
        status: statusFromGo(inst),
        ownerJid: inst?.jid || '',
        token: inst?.token,
        createdAt: inst?.createdAt,
      }));
      return json(normalized);
    }

    // ---- Criar instância ----
    if (endpoint.startsWith('/instance/create')) {
      const name = (body as any)?.instanceName || (body as any)?.name;
      if (!name || typeof name !== 'string') {
        return json({ error: 'Nome da instância é obrigatório.' }, 400);
      }
      const normalizedName = name.trim();
      const existingInstances = await listGoInstances(baseUrl, globalKey);
      const existing = existingInstances.find(
        (item: any) => String(item?.name ?? item?.instanceName ?? '').toLowerCase() === normalizedName.toLowerCase(),
      );
      if (existing) {
        const existingToken = existing.token || globalKey;
        const status = await goFetch('/instance/status', 'GET', existingToken);
        const info = status.data as any;
        const isOpen = status.ok && info?.Connected === true && info?.LoggedIn === true;
        if (isOpen) {
          return json({
            instance: { instanceName: normalizedName, instanceId: existing.id, status: 'open' },
            state: 'open',
            alreadyExisted: true,
            base64: null,
          });
        }
        await goFetch('/instance/connect', 'POST', existingToken, {});
        const qr = await goFetch('/instance/qr', 'GET', existingToken);
        const qrCode = (qr.data as any)?.Qrcode || (qr.data as any)?.qrcode || null;
        return json({
          instance: { instanceName: normalizedName, instanceId: existing.id, status: 'connecting' },
          state: 'connecting',
          alreadyExisted: true,
          base64: qrCode,
        });
      }
      const requestedToken = (body as any)?.token;
      const generatedToken = crypto.randomUUID().replaceAll('-', '');
      const instanceToken = typeof requestedToken === 'string' && requestedToken.trim()
        ? requestedToken.trim()
        : generatedToken;
      const created = await goFetch('/instance/create', 'POST', globalKey, { name: normalizedName, token: instanceToken });
      if (!created.ok) return json(created.data, created.status);

      const effectiveToken = (created.data as any)?.token || instanceToken;
      await goFetch('/instance/connect', 'POST', effectiveToken, {});
      const qr = await goFetch('/instance/qr', 'GET', effectiveToken);
      const qrCode = (qr.data as any)?.Qrcode || (qr.data as any)?.qrcode || null;

      return json({
        instance: { instanceName: name, instanceId: (created.data as any)?.id, status: 'connecting' },
        token: effectiveToken,
        base64: qrCode,
      });
    }

    // ---- Conectar / QR ----
    if (endpoint.startsWith('/instance/connect/')) {
      const name = nameFromEndpoint('/instance/connect/');
      const token = await resolveInstanceToken(baseUrl, globalKey, name);
      const status = await goFetch('/instance/status', 'GET', token);
      if (!status.ok) return json(status.data, status.status);
      const isOpen = (status.data as any)?.Connected === true && (status.data as any)?.LoggedIn === true;
      if (isOpen) return json({ instance: { instanceName: name, state: 'open' }, state: 'open' });

      await goFetch('/instance/connect', 'POST', token, {});
      const qr = await goFetch('/instance/qr', 'GET', token);
      const qrCode = (qr.data as any)?.Qrcode || (qr.data as any)?.qrcode || null;
      return json({ base64: qrCode, instance: { instanceName: name, state: 'connecting' }, state: 'connecting' });
    }

    // ---- Código de pareamento (conectar por código) ----
    if (endpoint.startsWith('/instance/pair/')) {
      const name = nameFromEndpoint('/instance/pair/');
      const phone = String((body as any)?.phone || integration.phone_number || '').replace(/\D/g, '');
      if (!phone) return json({ error: 'Informe o número do WhatsApp (DDD + número) para gerar o código.' }, 400);
      const token = await resolveInstanceToken(baseUrl, globalKey, name);

      // Já conectado? Não há o que parear.
      const preStatus = await goFetch('/instance/status', 'GET', token);
      const preInfo = preStatus.data as any;
      if (preStatus.ok && preInfo?.Connected === true && preInfo?.LoggedIn === true) {
        return json({ state: 'open', instance: { instanceName: name, state: 'open' }, alreadyConnected: true });
      }

      const extractCode = (d: any) =>
        d?.pairCode || d?.PairCode || d?.pairingCode || d?.PairingCode || d?.LinkingCode ||
        d?.linkingCode || d?.code || d?.Code || null;

      type Attempt = { path: string; method: string; body?: unknown };
      const attempts: Attempt[] = [
        { path: '/instance/pair', method: 'POST', body: { phone } },
        { path: '/instance/pairphone', method: 'POST', body: { phone } },
        { path: '/instance/paircode', method: 'POST', body: { phone } },
        { path: `/instance/pair?phone=${encodeURIComponent(phone)}`, method: 'GET' },
      ];

      const errText = (d: any) => String(d?.error ?? d?.message ?? '').toLowerCase();

      const runAttempts = async () => {
        const tried: string[] = [];
        let last: { status: number; data: any } = { status: 502, data: null };
        for (const attempt of attempts) {
          try {
            const r = await goFetch(attempt.path, attempt.method, token, attempt.body);
            tried.push(`${attempt.method} ${attempt.path} → ${r.status}`);
            const code = extractCode(r.data);
            if (r.ok && code) return { code, tried, last };
            if (r.status !== 404) last = { status: r.status, data: r.data };
          } catch (e) {
            console.error('Pair attempt failed:', e);
            tried.push(`${attempt.method} ${attempt.path} → exception`);
          }
        }
        return { code: null as string | null, tried, last };
      };

      let result = await runAttempts();
      if (result.code) return json({ pairingCode: result.code, phone });

      // Sessão antiga travada ("already authenticated" / websocket caído): limpa e tenta 1x
      const msg = errText(result.last.data);
      if (msg.includes('already authenticated') || msg.includes('websocket')) {
        await goFetch('/instance/logout', 'DELETE', token);
        await new Promise((r) => setTimeout(r, 1500));
        await goFetch('/instance/connect', 'POST', token, {});
        await new Promise((r) => setTimeout(r, 1500));
        result = await runAttempts();
        if (result.code) return json({ pairingCode: result.code, phone });
      }

      console.log('Pair attempts:', result.tried.join(' | '));
      const finalMsg = errText(result.last.data);
      return json({
        error: finalMsg.includes('already authenticated')
          ? 'Esta instância já está autenticada no WhatsApp. Clique em Desconectar e depois gere o código novamente.'
          : 'Não foi possível gerar o código de pareamento agora. Use o QR Code.',
        details: result.last.data ?? 'Nenhuma rota de pareamento disponível no servidor.',
        tried: result.tried,
      }, 409);


    }

    // ---- Estado da conexão ----
    if (endpoint.startsWith('/instance/connectionState/') || endpoint.startsWith('/instance/status')) {
      const name = endpoint.startsWith('/instance/connectionState/')
        ? nameFromEndpoint('/instance/connectionState/')
        : (integration.instance_name || '');
      const token = await resolveInstanceToken(baseUrl, globalKey, name);
      const status = await goFetch('/instance/status', 'GET', token);
      if (!status.ok) return json(status.data, status.status);
      const info = status.data as any;
      const state = info?.Connected === true ? (info?.LoggedIn === false ? 'connecting' : 'open') : 'close';
      return json({ instance: { instanceName: name, state }, state, raw: info });
    }

    // ---- Logout ----
    if (endpoint.startsWith('/instance/logout/')) {
      const name = nameFromEndpoint('/instance/logout/');
      const token = await resolveInstanceToken(baseUrl, globalKey, name);
      const result = await goFetch('/instance/logout', 'DELETE', token);
      return json(result.data, result.status);
    }

    // ---- Excluir ----
    if (endpoint.startsWith('/instance/delete/')) {
      const name = nameFromEndpoint('/instance/delete/');
      const list = await listGoInstances(baseUrl, globalKey);
      const found = list.find((i: any) => String(i?.name ?? '').toLowerCase() === name.toLowerCase());
      const instanceId = found?.id || name;
      const result = await goFetch(`/instance/delete/${encodeURIComponent(instanceId)}`, 'DELETE', globalKey);
      return json(result.data, result.status);
    }

    // ---- Enviar texto ----
    if (endpoint.startsWith('/message/sendText/') || endpoint.startsWith('/send/text')) {
      const name = endpoint.startsWith('/message/sendText/')
        ? nameFromEndpoint('/message/sendText/')
        : (integration.instance_name || '');
      const result = await sendWhatsAppText(integration, (body as any)?.number, (body as any)?.text, name);
      return json(result.data, result.ok ? 200 : result.status);
    }
    // ---- Foto de perfil (nunca falha: devolve null quando o servidor demora) ----
    if (endpoint.startsWith('/user/avatar')) {
      const token = await resolveInstanceToken(baseUrl, globalKey, integration.instance_name);
      try {
        const result = await goFetch(endpoint, method, token, body);
        if (!result.ok) return json({ url: null, unavailable: true });
        return json(result.data);
      } catch (e) {
        console.log('avatar lookup falhou:', (e as Error).message);
        return json({ url: null, unavailable: true });
      }
    }


    // ---- Passthrough para qualquer outro endpoint do Evolution Go ----
    const token = await resolveInstanceToken(baseUrl, globalKey, integration.instance_name);
    const result = await goFetch(endpoint, method, token, body);
    return json(result.data, result.status);
  } catch (error) {
    console.error('Evolution Go proxy error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
