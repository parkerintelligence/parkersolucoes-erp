// Ponte Evolution Go <-> Chatwoot
// Direção 1 (entrada): Evolution Go envia mensagens recebidas -> cria/atualiza conversa no Chatwoot
// Direção 2 (saída): Chatwoot envia message_created (outgoing) -> envia pelo WhatsApp via Evolution Go
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendWhatsAppViaConfiguredInstance } from '../_shared/evolutionGo.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const digits = (v: string) => String(v || '').replace(/\D/g, '');

const jidToPhone = (jid: string) => digits(String(jid || '').split('@')[0].split(':')[0]);

/** Extrai telefone + texto de payloads do Evolution Go (nativo whatsmeow) / Evolution API */
function parseEvolutionMessage(payload: any): { phone: string; text: string; name?: string; fromMe: boolean } | null {
  const data = payload?.data ?? payload?.message ?? payload;
  const info = data?.Info ?? data?.info ?? {};
  const key = data?.key ?? payload?.key ?? {};
  const jid =
    key?.remoteJid || data?.remoteJid || data?.chatId || data?.from ||
    info?.Chat || info?.chat || info?.Sender || info?.sender ||
    payload?.from || payload?.sender || payload?.jid || '';
  const phone = jidToPhone(jid);
  if (!phone) return null;
  if (String(jid).includes('@g.us')) return null; // ignora grupos

  const msg = data?.Message ?? data?.message ?? data?.msg ?? {};
  const text =
    (typeof data?.text === 'string' ? data.text : null) ||
    msg?.conversation ||
    msg?.Conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.extendedTextMessage?.Text ||
    msg?.ExtendedTextMessage?.text ||
    msg?.ExtendedTextMessage?.Text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    msg?.documentMessage?.caption ||
    data?.body ||
    payload?.text ||
    '';

  return {
    phone,
    text: String(text || '').trim(),
    name: data?.pushName || info?.PushName || info?.pushName || payload?.pushName || undefined,
    fromMe: Boolean(key?.fromMe ?? data?.fromMe ?? info?.IsFromMe ?? info?.isFromMe ?? false),
  };
}


async function chatwootFetch(baseUrl: string, token: string, path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', api_access_token: token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  let parsed: any = raw;
  try {
    parsed = JSON.parse(raw);
  } catch { /* texto puro */ }
  return { ok: res.ok, status: res.status, data: parsed };
}


// Remove sufixos de navegação (/app, /dashboard, /accounts/1...) do endereço do Chatwoot
function normalizeChatwootUrl(url: string) {
  let u = String(url || '').trim().replace(/\/+$/, '');
  u = u.replace(/\/(app|dashboard)(\/.*)?$/i, '');
  u = u.replace(/\/api\/v1.*$/i, '');
  return u.replace(/\/+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || req.headers.get('x-bridge-token') || '';
    if (!token) return json({ error: 'token ausente' }, 401);

    const { data: config } = await supabase
      .from('chatwoot_bridge_config')
      .select('*')
      .eq('webhook_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (!config) return json({ error: 'token inválido ou ponte desativada' }, 401);

    const payload = await req.json().catch(() => ({}));
    console.log('📥 [bridge] evento recebido:', JSON.stringify(payload).slice(0, 800));

    const isChatwootEvent =
      typeof payload?.event === 'string' && payload.event.startsWith('message_') && 'message_type' in payload;

    // ---------- Chatwoot -> WhatsApp ----------
    if (isChatwootEvent) {
      if (payload.event !== 'message_created' || payload.message_type !== 'outgoing' || payload.private) {
        return json({ ignored: true });
      }
      const sender = payload?.conversation?.meta?.sender ?? payload?.sender ?? {};
      const phone = digits(sender?.phone_number || sender?.identifier || '');
      const text = String(payload?.content || '').trim();
      if (!phone || !text) return json({ ignored: true, reason: 'sem telefone ou conteúdo' });

      const result = await sendWhatsAppViaConfiguredInstance(supabase, phone, text);
      await supabase
        .from('chatwoot_bridge_config')
        .update({
          last_outbound_at: new Date().toISOString(),
          last_error: result.ok ? null : result.error || result.raw?.slice(0, 300) || 'falha no envio',
        })
        .eq('id', config.id);

      return json({ direction: 'chatwoot_to_whatsapp', ok: result.ok, status: result.status }, result.ok ? 200 : 502);
    }

    // ---------- Evolution Go -> Chatwoot ----------
    const parsed = parseEvolutionMessage(payload);
    if (!parsed || parsed.fromMe || !parsed.text) return json({ ignored: true });

    const { data: chatwoot } = await supabase
      .from('integrations')
      .select('base_url, api_token')
      .eq('type', 'chatwoot')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!chatwoot?.base_url || !chatwoot?.api_token) {
      return json({ error: 'Integração Chatwoot não configurada em Administração' }, 400);
    }
    if (!config.account_id || !config.inbox_id) {
      return json({ error: 'Ponte não configurada: caixa de entrada ausente' }, 400);
    }

    const base = normalizeChatwootUrl(chatwoot.base_url);
    const key = chatwoot.api_token;
    const acc = config.account_id;
    const inboxId = Number(config.inbox_id);

    // 1. localizar contato pelo telefone
    let contactId: number | null = null;
    let sourceId: string | null = null;

    const search = await chatwootFetch(
      base, key,
      `/api/v1/accounts/${acc}/contacts/search?q=${encodeURIComponent(parsed.phone)}`,
    );
    const found = (search.data?.payload ?? [])[0];
    if (found) {
      contactId = found.id;
      sourceId = (found.contact_inboxes ?? []).find((ci: any) => ci?.inbox?.id === inboxId)?.source_id ?? null;
    }

    // 2. criar contato caso não exista
    if (!contactId) {
      const created = await chatwootFetch(base, key, `/api/v1/accounts/${acc}/contacts`, 'POST', {
        inbox_id: inboxId,
        name: parsed.name || parsed.phone,
        phone_number: `+${parsed.phone}`,
        identifier: parsed.phone,
      });
      const contact = created.data?.payload?.contact ?? created.data?.payload ?? created.data;
      contactId = contact?.id ?? null;
      sourceId = created.data?.payload?.contact_inbox?.source_id ?? contact?.contact_inboxes?.[0]?.source_id ?? null;
      if (!contactId) return json({ error: 'Falha ao criar contato no Chatwoot', details: created.data }, 502);
    }

    if (!sourceId) {
      const ci = await chatwootFetch(base, key, `/api/v1/accounts/${acc}/contacts/${contactId}/contact_inboxes`, 'POST', {
        inbox_id: inboxId,
      });
      sourceId = ci.data?.source_id ?? ci.data?.payload?.source_id ?? parsed.phone;
    }

    // 3. conversa aberta existente ou nova
    let conversationId: number | null = null;
    const convs = await chatwootFetch(base, key, `/api/v1/accounts/${acc}/contacts/${contactId}/conversations`);
    const list = convs.data?.payload ?? [];
    const openConv = list.find(
      (c: any) => Number(c?.inbox_id) === inboxId && c?.status !== 'resolved',
    ) ?? list.find((c: any) => Number(c?.inbox_id) === inboxId);
    if (openConv) conversationId = openConv.id ?? openConv.messages?.[0]?.conversation_id ?? null;

    if (!conversationId) {
      const newConv = await chatwootFetch(base, key, `/api/v1/accounts/${acc}/conversations`, 'POST', {
        source_id: sourceId,
        inbox_id: inboxId,
        contact_id: contactId,
      });
      conversationId = newConv.data?.id ?? null;
      if (!conversationId) return json({ error: 'Falha ao criar conversa no Chatwoot', details: newConv.data }, 502);
    }

    // 4. registrar a mensagem recebida
    const message = await chatwootFetch(
      base, key,
      `/api/v1/accounts/${acc}/conversations/${conversationId}/messages`,
      'POST',
      { content: parsed.text, message_type: 'incoming', private: false, source_id: sourceId },
    );

    await supabase
      .from('chatwoot_bridge_config')
      .update({
        last_inbound_at: new Date().toISOString(),
        last_error: message.ok ? null : JSON.stringify(message.data).slice(0, 300),
      })
      .eq('id', config.id);

    return json(
      { direction: 'whatsapp_to_chatwoot', ok: message.ok, conversationId, contactId },
      message.ok ? 200 : 502,
    );
  } catch (error) {
    console.error('❌ [bridge] erro:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
