import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("UniFi Connection Test function starting...");

serve(async (req) => {
  console.log(`Received ${req.method} request to unifi-test`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { test_config } = requestBody;
    
    if (!test_config) {
      throw new Error('test_config is required');
    }
    
    const { base_url, username, password, use_ssl = true } = test_config;
    
    if (!base_url || !username || !password) {
      throw new Error('base_url, username, and password are required');
    }

    console.log('Testing UniFi connection:', { 
      base_url, 
      username: !!username, 
      password: !!password, 
      use_ssl 
    });

    // Try different connection strategies
    const strategies = [
      { name: 'HTTPS', url: base_url },
      { name: 'HTTP Fallback', url: base_url.replace('https://', 'http://') }
    ];

    let lastError = null;

    for (const strategy of strategies) {
      try {
        console.log(`Trying strategy: ${strategy.name} with URL: ${strategy.url}`);
        
        const loginUrl = `${strategy.url}/api/login`;
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'UniFi-Connection-Test/1.0'
          },
          body: JSON.stringify({
            username: username,
            password: password,
            remember: true
          })
        });

        console.log(`Strategy ${strategy.name} response:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (response.ok) {
          // Test successful with this strategy
          const result = {
            success: true,
            strategy: strategy.name,
            url: strategy.url,
            message: `Conexão bem-sucedida usando ${strategy.name}`,
            recommended_config: {
              use_ssl: strategy.url.startsWith('https://'),
              ignore_ssl: strategy.name.includes('SSL'),
              working_url: strategy.url
            }
          };
          
          console.log('Connection test successful:', result);
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await response.text();
          lastError = `${strategy.name}: HTTP ${response.status} - ${errorText}`;
          console.log(`Strategy ${strategy.name} failed:`, lastError);
        }
      } catch (error) {
        lastError = `${strategy.name}: ${error.message}`;
        console.log(`Strategy ${strategy.name} error:`, error);
      }
    }

    // All strategies failed
    throw new Error(`Todas as estratégias falharam. Último erro: ${lastError}`);

  } catch (error) {
    console.error('Error in unifi-test function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Analyze error for troubleshooting
    let troubleshooting = [];
    
    if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
      troubleshooting.push('Problema de certificado SSL detectado');
      troubleshooting.push('A controladora UniFi usa certificados auto-assinados por padrão');
      troubleshooting.push('Acesse a controladora pelo navegador e aceite o certificado');
    }
    
    if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      troubleshooting.push('Problema de conectividade de rede');
      troubleshooting.push('Verifique se a controladora está acessível');
      troubleshooting.push('Confirme se a URL e porta estão corretas');
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('credentials')) {
      troubleshooting.push('Problema de autenticação');
      troubleshooting.push('Verifique se o usuário e senha estão corretos');
      troubleshooting.push('Confirme se o usuário tem permissões de administrador');
    }

    if (troubleshooting.length === 0) {
      troubleshooting.push('Verifique a configuração da controladora');
      troubleshooting.push('Teste acesso manual via navegador');
      troubleshooting.push('Confirme se a controladora está online');
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        troubleshooting: troubleshooting,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});