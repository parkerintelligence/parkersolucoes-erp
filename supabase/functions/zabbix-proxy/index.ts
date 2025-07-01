
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
    console.log('=== Zabbix Proxy Request Started ===');
    
    const body = await req.json();
    const { method, params, integrationId } = body;
    
    console.log('Request body:', { 
      method, 
      integrationId,
      paramsKeys: params ? Object.keys(params) : 'no params'
    });

    if (!method || !integrationId) {
      console.error('Missing required fields:', { method: !!method, integrationId: !!integrationId });
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios: method e integrationId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ 
        error: 'Configuração do servidor incompleta' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configuração do Zabbix
    console.log('Fetching integration with ID:', integrationId);
    
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('base_url, api_token')
      .eq('id', integrationId)
      .eq('type', 'zabbix')
      .eq('is_active', true)
      .single();

    if (integrationError) {
      console.error('Database error:', integrationError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao buscar configuração da integração',
        details: integrationError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!integration) {
      console.error('Integration not found or inactive');
      return new Response(JSON.stringify({ 
        error: 'Integração Zabbix não encontrada ou inativa' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Integration found:', {
      base_url: integration.base_url,
      hasApiToken: !!integration.api_token,
      tokenLength: integration.api_token?.length || 0
    });

    // Preparar URL da API - permitir HTTP para desenvolvimento
    let apiUrl = integration.base_url.replace(/\/$/, '');
    if (!apiUrl.endsWith('/api_jsonrpc.php')) {
      apiUrl = apiUrl + '/api_jsonrpc.php';
    }

    // Converter HTTPS para HTTP se necessário para desenvolvimento
    if (apiUrl.startsWith('https://') && !integration.base_url.includes('localhost')) {
      console.log('Converting HTTPS to HTTP for development...');
      const httpUrl = apiUrl.replace('https://', 'http://');
      console.log('Testing HTTP URL:', httpUrl);
      apiUrl = httpUrl;
    }

    console.log('Final API URL:', apiUrl);

    // Preparar requisição para o Zabbix
    const requestBody = {
      jsonrpc: '2.0',
      method: method,
      params: params || {},
      auth: integration.api_token,
      id: 1,
    };

    console.log('Zabbix request:', {
      jsonrpc: requestBody.jsonrpc,
      method: requestBody.method,
      paramsCount: Object.keys(requestBody.params).length,
      hasAuth: !!requestBody.auth,
      id: requestBody.id
    });

    // Teste de conectividade básica primeiro
    console.log('Testing basic connectivity...');
    
    try {
      const testUrl = new URL(apiUrl);
      console.log('Testing DNS resolution for:', testUrl.hostname);
      
      // Teste básico de conectividade
      const connectivityTest = await fetch(`${testUrl.protocol}//${testUrl.host}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      }).catch(e => {
        console.log('Basic connectivity test failed:', e.message);
        return null;
      });
      
      if (connectivityTest) {
        console.log('Basic connectivity OK, status:', connectivityTest.status);
      }
    } catch (connectivityError) {
      console.log('Connectivity test error:', connectivityError.message);
    }

    // Fazer requisição para o Zabbix com timeout e headers corretos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout triggered');
      controller.abort();
    }, 30000);

    try {
      console.log('Making request to Zabbix...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Zabbix-Proxy/1.0',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 500));

      if (!response.ok) {
        console.error('HTTP Error details:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 1000)
        });
        
        return new Response(JSON.stringify({
          error: `Erro HTTP ${response.status}: ${response.statusText}`,
          details: responseText.substring(0, 500)
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', responseText);
        
        return new Response(JSON.stringify({
          error: 'Resposta inválida do Zabbix (não é JSON válido)',
          details: responseText.substring(0, 200)
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Parsed response:', { 
        hasResult: !!data.result, 
        hasError: !!data.error,
        resultType: typeof data.result,
        resultLength: Array.isArray(data.result) ? data.result.length : 'N/A'
      });
      
      if (data.error) {
        console.error('Zabbix API Error:', data.error);
        return new Response(JSON.stringify({
          error: `Erro da API Zabbix: ${data.error.message || 'Erro desconhecido'}`,
          code: data.error.code || 'N/A',
          details: JSON.stringify(data.error)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Success! Returning result...');
      return new Response(JSON.stringify({ result: data.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      });
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return new Response(JSON.stringify({
          error: 'Timeout na conexão com o Zabbix (30s)',
          details: 'Verifique se o servidor está acessível e respondendo',
          troubleshooting: {
            dns_check: 'Execute: nslookup seu-servidor-zabbix.com',
            port_check: 'Execute: telnet seu-servidor-zabbix.com 80',
            firewall: 'Verifique se as portas 80/443 estão abertas',
            network: 'Teste a conectividade da rede local'
          }
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Diagnóstico detalhado de erro de conectividade
      let diagnosticInfo = {
        error_type: fetchError.name,
        error_message: fetchError.message,
        url_tested: apiUrl,
        timestamp: new Date().toISOString()
      };
      
      if (fetchError.message.includes('ENOTFOUND')) {
        diagnosticInfo = { 
          ...diagnosticInfo, 
          issue: 'DNS Resolution Failed',
          solution: 'Verifique se o hostname está correto e acessível'
        };
      } else if (fetchError.message.includes('ECONNREFUSED')) {
        diagnosticInfo = { 
          ...diagnosticInfo, 
          issue: 'Connection Refused',
          solution: 'Verifique se o serviço Zabbix está rodando na porta correta'
        };
      } else if (fetchError.message.includes('certificate')) {
        diagnosticInfo = { 
          ...diagnosticInfo, 
          issue: 'SSL Certificate Error',
          solution: 'Use HTTP ao invés de HTTPS ou configure certificado válido'
        };
      }
      
      return new Response(JSON.stringify({
        error: 'Erro de conectividade com o Zabbix',
        details: fetchError.message,
        diagnostic: diagnosticInfo
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('=== Edge Function Error ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message,
      type: error.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
