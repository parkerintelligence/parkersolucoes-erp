// Configura automaticamente a caixa de entrada do Chatwoot para a instância do Evolution Go
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getWhatsAppIntegration } from '../_shared/evolutionGo.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function chatwootFetch(baseUrl: string, token: string, path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', api_access_token: token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  let data: any = raw;
  try {
    data = JSON.parse(raw);
  } catch { /* texto puro */ }
  return { ok: res.ok, status: res.status, data };
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

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    // Autenticação do usuário logado
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Não autenticado' }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData?.user) return json({ error: 'Não autenticado' }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'status';

    const { data: existing } = await admin
      .from('chatwoot_bridge_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const buildWebhookUrl = (token: string) =>
      `${SUPABASE_URL}/functions/v1/chatwoot-bridge?token=${token}`;

    if (action === 'status') {
      return json({
        config: existing ?? null,
        webhookUrl: existing ? buildWebhookUrl(existing.webhook_token) : null,
      });
    }

    if (action === 'disable') {
      if (existing) {
        await admin.from('chatwoot_bridge_config').update({ is_active: false }).eq('id', existing.id);
      }
      return json({ ok: true });
    }

    if (action !== 'setup') return json({ error: 'Ação inválida' }, 400);

    // Integrações necessárias
    const evolution = await getWhatsAppIntegration(admin);
    if (!evolution) return json({ error: 'Configure e ative o WhatsApp (Evolution Go) antes.' }, 400);

    const { data: chatwoot } = await admin
      .from('integrations')
      .select('id, base_url, api_token')
      .eq('type', 'chatwoot')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!chatwoot?.base_url || !chatwoot?.api_token) {
      return json({ error: 'Configure e ative a integração Chatwoot antes.' }, 400);
    }

    const base = normalizeChatwootUrl(chatwoot.base_url);
    const key = chatwoot.api_token;

    // Conta do Chatwoot
    let accountId = body?.accountId ? String(body.accountId) : existing?.account_id || null;
    if (!accountId) {
      const profile = await chatwootFetch(base, key, '/api/v1/profile');
      if (!profile.ok) {
        return json({ error: 'Não foi possível conectar ao Chatwoot com esse token.', details: profile.data }, 502);
      }
      accountId = String(profile.data?.account_id ?? profile.data?.accounts?.[0]?.id ?? '');
      if (!accountId) return json({ error: 'Não foi possível identificar a conta no Chatwoot.' }, 502);
    }

    const webhookToken =
      existing?.webhook_token || crypto.randomUUID().replace(/-/g, '');
    const webhookUrl = buildWebhookUrl(webhookToken);
    const inboxName = body?.inboxName || `WhatsApp ${evolution.instance_name || 'Evolution Go'}`;

    // Procurar caixa de entrada existente
    const inboxes = await chatwootFetch(base, key, `/api/v1/accounts/${accountId}/inboxes`);
    if (!inboxes.ok) {
      return json({ error: 'Falha ao listar caixas de entrada do Chatwoot.', details: inboxes.data }, 502);
    }
    const list = inboxes.data?.payload ?? [];
    let inbox = list.find((i: any) => String(i?.name).toLowerCase() === String(inboxName).toLowerCase());

    if (inbox) {
      // Atualiza o endereço de retorno para a ponte
      await chatwootFetch(base, key, `/api/v1/accounts/${accountId}/inboxes/${inbox.id}`, 'PATCH', {
        channel: { webhook_url: webhookUrl },
      });
    } else {
      const created = await chatwootFetch(base, key, `/api/v1/accounts/${accountId}/inboxes`, 'POST', {
        name: inboxName,
        channel: { type: 'api', webhook_url: webhookUrl },
      });
      if (!created.ok) {
        return json({ error: 'Falha ao criar a caixa de entrada no Chatwoot.', details: created.data }, 502);
      }
      inbox = created.data;
    }

    const record = {
      evolution_integration_id: evolution.id,
      chatwoot_integration_id: chatwoot.id,
      instance_name: evolution.instance_name || null,
      account_id: String(accountId),
      inbox_id: String(inbox?.id ?? ''),
      inbox_identifier: inbox?.inbox_identifier ?? inbox?.channel?.inbox_identifier ?? null,
      webhook_token: webhookToken,
      is_active: true,
      last_error: null,
    };

    const saved = existing
      ? await admin.from('chatwoot_bridge_config').update(record).eq('id', existing.id).select().maybeSingle()
      : await admin.from('chatwoot_bridge_config').insert(record).select().maybeSingle();

    if (saved.error) return json({ error: saved.error.message }, 500);

    return json({
      ok: true,
      config: saved.data,
      webhookUrl,
      inboxName,
      instructions:
        'Cole este endereço na variável de webhook do servidor Evolution Go (WEBHOOK_URL / WEBHOOK_GLOBAL_URL) e reinicie o serviço.',
    });
  } catch (error) {
    console.error('❌ [chatwoot-bridge-setup] erro:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
