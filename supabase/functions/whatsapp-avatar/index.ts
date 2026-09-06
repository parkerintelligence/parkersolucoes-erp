import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getWhatsAppIntegration,
  normalizeEvolutionBaseUrl,
  resolveInstanceToken,
} from "../_shared/evolutionGo.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h para fotos encontradas
const NEGATIVE_TTL_MS = 1000 * 60 * 30; // 30min quando não há foto / falhou

const extractUrl = (payload: any): string | null => {
  if (!payload) return null;
  if (typeof payload === 'string') return payload.startsWith('http') ? payload : null;
  const d = payload.data ?? payload;
  const candidates = [
    d?.URL, d?.url, d?.Url,
    d?.ProfilePictureUrl, d?.profilePictureUrl,
    d?.PictureUrl, d?.pictureUrl,
    d?.Avatar, d?.avatar,
    d?.Picture, d?.picture,
  ];
  const found = candidates.find((v) => typeof v === 'string' && v.startsWith('http'));
  return found || null;
};

const fetchAvatar = async (
  baseUrl: string,
  token: string,
  phone: string,
): Promise<{ url: string | null; retryable: boolean }> => {
  // O servidor Evolution Go às vezes demora ("info query timed out"): tentamos algumas vezes.
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${baseUrl}/user/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: token },
        body: JSON.stringify({ number: phone, preview: false }),
        signal: controller.signal,
      });
      const raw = await res.text();
      let parsed: any = raw;
      try { parsed = JSON.parse(raw); } catch { /* texto puro */ }
      const url = extractUrl(parsed);
      if (url) return { url, retryable: false };
      const message = String(parsed?.error || parsed?.message || raw || '').toLowerCase();
      if (message.includes('does not have a profile picture') || message.includes('not found')) {
        return { url: null, retryable: false };
      }
    } catch (_e) {
      // timeout / rede: tenta de novo
    } finally {
      clearTimeout(timer);
    }
  }
  return { url: null, retryable: true };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawPhones: unknown = body?.phones ?? (body?.phone ? [body.phone] : []);
    if (!Array.isArray(rawPhones)) {
      return json({ error: 'phones deve ser uma lista' }, 400);
    }

    const phones = Array.from(
      new Set(
        rawPhones
          .map((p) => String(p || '').replace(/\D/g, ''))
          .filter((p) => p.length >= 10),
      ),
    ).slice(0, 25);

    if (phones.length === 0) return json({ avatars: {} });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cached } = await admin
      .from('whatsapp_avatars')
      .select('phone, avatar_url, has_photo, checked_at')
      .in('phone', phones);

    const now = Date.now();
    const result: Record<string, string | null> = {};
    const pending: string[] = [];

    for (const phone of phones) {
      const row = (cached || []).find((c: any) => c.phone === phone);
      if (row) {
        const age = now - new Date(row.checked_at).getTime();
        const ttl = row.has_photo && row.avatar_url ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
        if (age < ttl) {
          result[phone] = row.avatar_url || null;
          continue;
        }
        if (row.avatar_url) result[phone] = row.avatar_url; // mostra o antigo enquanto revalida
      }
      pending.push(phone);
    }

    if (pending.length > 0) {
      const integration = await getWhatsAppIntegration(admin);
      const baseUrl = normalizeEvolutionBaseUrl(integration?.base_url || '');
      const globalKey = integration?.api_token || '';

      if (baseUrl && globalKey) {
        const token = await resolveInstanceToken(baseUrl, globalKey, integration?.instance_name);
        const batches: string[][] = [];
        for (let i = 0; i < pending.length; i += 5) batches.push(pending.slice(i, i + 5));

        for (const batch of batches) {
          const settled = await Promise.all(
            batch.map(async (phone) => ({ phone, ...(await fetchAvatar(baseUrl, token, phone)) })),
          );
          const rows = settled
            .filter((s) => !s.retryable || s.url)
            .map((s) => ({
              phone: s.phone,
              avatar_url: s.url,
              has_photo: !!s.url,
              checked_at: new Date().toISOString(),
            }));
          if (rows.length > 0) {
            await admin.from('whatsapp_avatars').upsert(rows, { onConflict: 'phone' });
          }
          for (const s of settled) {
            if (s.url) result[s.phone] = s.url;
            else if (!(s.phone in result)) result[s.phone] = null;
          }
        }
      }
    }

    return json({ avatars: result });
  } catch (error) {
    console.error('whatsapp-avatar error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
