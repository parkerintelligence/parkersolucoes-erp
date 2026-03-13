import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchMikrotik(baseUrl: string, auth: string, endpoint: string, method: string = 'GET', body?: any) {
  const url = `${baseUrl}/rest${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000),
  });

  if (response.status === 401) {
    throw new Error('AUTH_FAILED');
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { endpoint, method = 'GET', body, clientId, batch } = requestBody;

    // Validate clientId
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Campo obrigatório: clientId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', clientId)
      .eq('type', 'mikrotik')
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Integração MikroTik não configurada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mikrotikAuth = btoa(`${integration.username}:${integration.password}`);
    
    // Build base URL with port if not already included
    let baseUrl = integration.base_url?.replace(/\/+$/, '') || '';
    if (integration.port) {
      try {
        const urlObj = new URL(baseUrl);
        // Only add port if not already specified in the URL
        if (!urlObj.port && urlObj.hostname) {
          urlObj.port = String(integration.port);
          baseUrl = urlObj.toString().replace(/\/+$/, '');
        }
      } catch {
        // If URL parsing fails, try simple append
        if (!baseUrl.match(/:\d+$/)) {
          baseUrl = baseUrl + ':' + integration.port;
        }
      }
    }
    
    console.log(`🔗 MikroTik: ${integration.name} → ${baseUrl}`);

    // === BATCH MODE: Multiple endpoints in one call ===
    if (batch && Array.isArray(batch)) {
      console.log(`📦 Batch mode: ${batch.length} endpoints`);
      
      const results: Record<string, { data?: any; error?: string }> = {};
      
      // Execute sequentially to avoid overwhelming the MikroTik device
      for (const item of batch) {
        const ep = typeof item === 'string' ? item : item.endpoint;
        const m = typeof item === 'string' ? 'GET' : (item.method || 'GET');
        const b = typeof item === 'string' ? undefined : item.body;
        
        try {
          const data = await fetchMikrotik(baseUrl, mikrotikAuth, ep, m, b);
          results[ep] = { data };
          console.log(`  ✅ ${ep}`);
        } catch (err: any) {
          if (err.message === 'AUTH_FAILED') {
            // Auth failure — return immediately, no point continuing
            return new Response(JSON.stringify({ 
              error: 'Falha na autenticação com MikroTik. Verifique usuário, senha e se a API REST está habilitada.',
              authFailed: true 
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          const isTimeout = err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('timed out');
          const errorMsg = isTimeout 
            ? `Timeout ao conectar com ${baseUrl}` 
            : err.message;
          results[ep] = { error: errorMsg };
          console.error(`  ❌ ${ep}: ${errorMsg}`);

          // If first request times out, all will too — abort early
          if (isTimeout) {
            console.error('⚠️ Timeout detectado — abortando batch (MikroTik inacessível)');
            for (const remaining of batch) {
              const repEp = typeof remaining === 'string' ? remaining : remaining.endpoint;
              if (!results[repEp]) {
                results[repEp] = { error: errorMsg };
              }
            }
            
            return new Response(JSON.stringify({ 
              results,
              timeout: true,
              error: `Não foi possível conectar com o MikroTik em ${baseUrl}. Verifique se o dispositivo está acessível e a API REST está habilitada.`
            }), {
              status: 504,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SINGLE MODE: Original behavior ===
    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Campo obrigatório: endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔄 Single: ${method} ${endpoint}`);

    try {
      const data = await fetchMikrotik(baseUrl, mikrotikAuth, endpoint, method, body);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      if (err.message === 'AUTH_FAILED') {
        return new Response(JSON.stringify({ 
          error: 'Falha na autenticação com MikroTik.',
          authFailed: true 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isTimeout = err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('timed out');
      return new Response(JSON.stringify({ 
        error: isTimeout 
          ? `Timeout ao conectar com ${baseUrl}. Verifique se o dispositivo está acessível.`
          : err.message,
        timeout: isTimeout,
      }), {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
