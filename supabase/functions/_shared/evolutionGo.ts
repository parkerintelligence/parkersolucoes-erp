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
