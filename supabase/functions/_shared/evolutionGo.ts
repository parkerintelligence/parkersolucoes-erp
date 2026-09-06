// Helper compartilhado para falar com o Evolution Go (com fallback para Evolution API legada)

export interface EvolutionIntegration {
  base_url: string;
  api_token?: string | null;
  instance_name?: string | null;
  user_token?: string | null;
}

const trimUrl = (url: string) => url.replace(/\/$/, '');

const parseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

/** Lista instâncias do Evolution Go */
export async function listGoInstances(baseUrl: string, globalKey: string): Promise<any[]> {
  const res = await fetch(`${trimUrl(baseUrl)}/instance/all`, {
    headers: { apikey: globalKey, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return [];
  const json = parseJson(await res.text());
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.instances)) return json.instances;
  return [];
}

/** No Evolution Go cada instância tem seu próprio token, usado no header apikey */
export async function resolveInstanceToken(
  baseUrl: string,
  globalKey: string,
  instanceName?: string | null,
): Promise<string> {
  if (!instanceName) return globalKey;
  try {
    const list = await listGoInstances(baseUrl, globalKey);
    const found = list.find(
      (i: any) =>
        String(i?.name ?? i?.instanceName ?? '').toLowerCase() === String(instanceName).toLowerCase(),
    );
    return found?.token || globalKey;
  } catch {
    return globalKey;
  }
}

export interface SendTextResult {
  ok: boolean;
  status: number;
  raw: string;
  data: unknown;
  usedInstance: string;
  mode: 'evolution_go' | 'evolution_api';
}

/** Envia texto pelo Evolution Go; se o servidor for a Evolution API antiga, usa o endpoint legado */
export async function sendWhatsAppText(
  integration: EvolutionIntegration,
  number: string,
  text: string,
  instanceNameOverride?: string | null,
): Promise<SendTextResult> {
  const baseUrl = trimUrl(integration.base_url || '');
  const globalKey = integration.api_token || '';
  const instanceName = instanceNameOverride || integration.instance_name || '';

  const instanceToken =
    integration.user_token || (await resolveInstanceToken(baseUrl, globalKey, instanceName));

  let res = await fetch(`${baseUrl}/send/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: instanceToken },
    body: JSON.stringify({ number, text }),
  });
  let raw = await res.text();
  let mode: 'evolution_go' | 'evolution_api' = 'evolution_go';

  if (!res.ok && (res.status === 404 || res.status === 405)) {
    console.log('↩️ [Evolution] /send/text indisponível, usando endpoint legado /message/sendText');
    res = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: globalKey },
      body: JSON.stringify({ number, text }),
    });
    raw = await res.text();
    mode = 'evolution_api';
  }

  return {
    ok: res.ok,
    status: res.status,
    raw,
    data: parseJson(raw),
    usedInstance: instanceName,
    mode,
  };
}

/**
 * Retorna a ÚNICA integração WhatsApp (Evolution Go) configurada em Administração.
 * Prioriza a integração global ativa; cai para qualquer ativa.
 */
export async function getWhatsAppIntegration(supabaseAdmin: any): Promise<
  (EvolutionIntegration & { id: string; name?: string; phone_number?: string | null }) | null
> {
  const { data, error } = await supabaseAdmin
    .from('integrations')
    .select('id, name, base_url, api_token, instance_name, user_token, phone_number, is_global')
    .eq('type', 'evolution_api')
    .eq('is_active', true)
    .order('is_global', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ [Evolution] Erro ao buscar integração WhatsApp:', error.message);
    return null;
  }
  return (data && data[0]) || null;
}

/** Envia texto usando a instância única configurada em Administração */
export async function sendWhatsAppViaConfiguredInstance(
  supabaseAdmin: any,
  number: string,
  text: string,
): Promise<SendTextResult & { integrationId?: string; error?: string }> {
  const integration = await getWhatsAppIntegration(supabaseAdmin);
  if (!integration) {
    return {
      ok: false,
      status: 404,
      raw: '',
      data: null,
      usedInstance: '',
      mode: 'evolution_go',
      error: 'Nenhuma integração WhatsApp ativa configurada em Administração',
    };
  }
  const result = await sendWhatsAppText(integration, number, text);
  return { ...result, integrationId: integration.id };
}
