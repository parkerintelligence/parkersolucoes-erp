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
    const { endpoint, method = 'GET', body, clientId } = await req.json();

    console.log('📥 Request:', { endpoint, method, clientId });

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Campo obrigatório: endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Campo obrigatório: clientId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with the user's token for authenticated requests
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
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
      .eq('id', clientId)
      .eq('type', 'mikrotik')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      console.error('❌ Integração não encontrada:', integrationError);
      return new Response(JSON.stringify({ error: 'Integração MikroTik não configurada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Integração encontrada:', integration.name);
    console.log('🔗 Base URL:', integration.base_url);
    console.log('👤 Username:', integration.username);
    
    console.log(`🔄 MikroTik API: ${method} ${endpoint}`);

    const mikrotikUrl = `${integration.base_url}/rest${endpoint}`;
    console.log('📍 URL completa:', mikrotikUrl);
    console.log('🔑 Tentando autenticar como:', integration.username);
    console.log('🔐 Senha começa com:', integration.password?.substring(0, 3) + '***');
    
    const auth = btoa(`${integration.username}:${integration.password}`);
    console.log('📦 Authorization header criado');

    let mikrotikResponse;
    try {
      mikrotikResponse = await fetch(mikrotikUrl, {
        method,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      });
      
      console.log('📊 Status da resposta:', mikrotikResponse.status);
      console.log('📋 Headers da resposta:', Object.fromEntries(mikrotikResponse.headers.entries()));
      
    } catch (fetchError: any) {
      console.error('❌ Erro ao conectar com MikroTik:', fetchError.message);
      
      if (fetchError.name === 'TimeoutError' || fetchError.message?.includes('timeout')) {
        return new Response(JSON.stringify({ 
          error: 'Timeout ao conectar com MikroTik',
          details: `Não foi possível conectar com ${mikrotikUrl} em 10 segundos. Verifique se o endereço está correto e acessível.`
        }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Erro de conexão com MikroTik',
        details: fetchError.message,
        url: mikrotikUrl
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (mikrotikResponse.status === 401) {
      console.error('❌ MikroTik retornou 401 - Credenciais inválidas ou sem permissões');
      console.log('💡 Verifique: usuário tem permissão "api" ou "full" no MikroTik');
      console.log('💡 Verifique: serviço www ou www-ssl está habilitado');
    }

    const responseText = await mikrotikResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log(`📊 Status: ${mikrotikResponse.status}`);

    if (mikrotikResponse.status === 401) {
      return new Response(JSON.stringify({ 
        error: 'Falha na autenticação com MikroTik. Verifique usuário, senha e se a API REST está habilitada no MikroTik.',
        details: 'O servidor MikroTik retornou 401 Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
