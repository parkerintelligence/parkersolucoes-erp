import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body first
    const { endpoint, method = 'GET', body } = await req.json();

    console.log('📥 Request:', { endpoint, method });

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Campo obrigatório: endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Usuário autenticado:', user.email);

    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('type', 'mikrotik')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error('❌ Integração não encontrada:', integrationError);
      return new Response(JSON.stringify({ error: 'Integração MikroTik não configurada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Integração encontrada:', integration.name);
    
    console.log(`🔄 MikroTik API: ${method} ${endpoint}`);

    const mikrotikUrl = `${integration.base_url}/rest${endpoint}`;
    const auth = btoa(`${integration.username}:${integration.password}`);

    const mikrotikResponse = await fetch(mikrotikUrl, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await mikrotikResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log(`📊 Status: ${mikrotikResponse.status}`);

    return new Response(JSON.stringify(responseData), {
      status: mikrotikResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
