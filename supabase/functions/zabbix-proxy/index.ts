
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, params, integrationId } = await req.json();
    
    console.log('Zabbix proxy request:', { method, integrationId });

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configuração do Zabbix
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('base_url, api_token')
      .eq('id', integrationId)
      .eq('type', 'zabbix')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('Erro ao buscar integração:', integrationError);
      return new Response(JSON.stringify({ 
        error: 'Integração Zabbix não encontrada ou inativa' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar URL da API
    let apiUrl = integration.base_url.replace(/\/$/, '');
    if (!apiUrl.endsWith('/api_jsonrpc.php')) {
      apiUrl = apiUrl + '/api_jsonrpc.php';
    }

    console.log('URL da API Zabbix:', apiUrl);

    // Preparar requisição para o Zabbix
    const requestBody = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      auth: integration.api_token,
      id: 1,
    };

    console.log('Fazendo requisição para:', apiUrl);

    // Fazer requisição para o Zabbix com timeout e headers corretos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Zabbix-Proxy/1.0',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro HTTP:', { 
          status: response.status, 
          statusText: response.statusText,
          errorText: errorText.substring(0, 500)
        });
        
        return new Response(JSON.stringify({
          error: `Erro HTTP ${response.status}: ${response.statusText}`,
          details: errorText.substring(0, 500)
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('Resposta do Zabbix:', { 
        hasResult: !!data.result, 
        hasError: !!data.error,
        resultLength: Array.isArray(data.result) ? data.result.length : 'N/A'
      });
      
      if (data.error) {
        console.error('Erro da API Zabbix:', data.error);
        return new Response(JSON.stringify({
          error: `Erro da API Zabbix: ${data.error.message || 'Erro desconhecido'}`,
          code: data.error.code || 'N/A'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ result: data.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Timeout na requisição para o Zabbix');
        return new Response(JSON.stringify({
          error: 'Timeout na conexão com o Zabbix (30s)',
          details: 'Verifique se o servidor está acessível'
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.error('Erro na requisição fetch:', fetchError);
      return new Response(JSON.stringify({
        error: 'Erro de conectividade com o Zabbix',
        details: fetchError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Erro na edge function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
