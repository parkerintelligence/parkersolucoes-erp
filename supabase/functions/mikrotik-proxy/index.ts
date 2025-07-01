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
    console.log('=== Mikrotik Proxy Request Started ===');
    
    const body = await req.json();
    const { endpoint, integrationId } = body;
    
    console.log('Request body:', { 
      endpoint, 
      integrationId
    });

    if (!endpoint || !integrationId) {
      console.error('Missing required fields:', { endpoint: !!endpoint, integrationId: !!integrationId });
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios: endpoint e integrationId' 
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

    // Buscar configuração do Mikrotik
    console.log('Fetching integration with ID:', integrationId);
    
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('base_url, username, password, port')
      .eq('id', integrationId)
      .eq('type', 'mikrotik')
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
        error: 'Integração Mikrotik não encontrada ou inativa' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Integration found:', {
      base_url: integration.base_url,
      hasUsername: !!integration.username,
      hasPassword: !!integration.password,
      port: integration.port || 8728
    });

    // Preparar URL da API REST do Mikrotik
    let apiUrl = integration.base_url.replace(/\/$/, '');
    if (!apiUrl.includes('/rest')) {
      apiUrl = apiUrl + '/rest' + endpoint;
    } else {
      apiUrl = apiUrl + endpoint;
    }

    console.log('Final API URL:', apiUrl);

    // Preparar autenticação básica
    const auth = btoa(`${integration.username}:${integration.password}`);

    // Fazer requisição para o Mikrotik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout triggered');
      controller.abort();
    }, 15000);

    try {
      console.log('Making request to Mikrotik...');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Mikrotik-Proxy/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const responseText = await response.text();
      console.log('Response text length:', responseText.length);

      if (!response.ok) {
        console.error('HTTP Error details:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500)
        });
        
        return new Response(JSON.stringify({
          error: `Erro HTTP ${response.status}: ${response.statusText}`,
          details: responseText.substring(0, 200)
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
          error: 'Resposta inválida do Mikrotik (não é JSON válido)',
          details: responseText.substring(0, 200)
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Parsed response:', { 
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A'
      });

      console.log('Success! Returning result...');
      return new Response(JSON.stringify({ result: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message
      });
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return new Response(JSON.stringify({
          error: 'Timeout na conexão com o Mikrotik (15s)',
          details: 'Verifique se o servidor está acessível e respondendo'
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        error: 'Erro de conectividade com o Mikrotik',
        details: fetchError.message,
        type: fetchError.name
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('=== Edge Function Error ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message
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