import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Iniciando diagnóstico completo do sistema Bacula');

    // Buscar integração Bacula
    const { data: baculaIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('is_active', true)
      .single();

    if (!baculaIntegration) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Integração Bacula não encontrada' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const diagnostic = {
      timestamp: new Date().toISOString(),
      integration: {
        name: baculaIntegration.name,
        base_url: baculaIntegration.base_url,
        username: baculaIntegration.username,
        is_active: baculaIntegration.is_active
      },
      connectivity: {},
      endpoints: {},
      recommendations: []
    };

    const auth = btoa(`${baculaIntegration.username}:${baculaIntegration.password}`);
    const baseUrl = baculaIntegration.base_url.replace(/\/$/, '');

    // 1. Teste de conectividade básica
    console.log('🔄 Testando conectividade básica...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const basicResponse = await fetch(baseUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      diagnostic.connectivity.basic = {
        status: 'success',
        http_status: basicResponse.status,
        response_time: 'fast',
        reachable: true
      };
      
      console.log(`✅ Conectividade básica: ${basicResponse.status}`);
    } catch (error) {
      diagnostic.connectivity.basic = {
        status: 'failed',
        error: error.message,
        reachable: false
      };
      
      diagnostic.recommendations.push('Verificar conectividade de rede com o servidor Bacula');
      console.error('❌ Falha na conectividade básica:', error.message);
    }

    // 2. Teste de autenticação
    console.log('🔄 Testando autenticação...');
    const authEndpoints = [
      '/api/v2/config/api/info',
      '/api/v1/config/api/info',
      '/api/v2/info'
    ];

    let authSuccess = false;
    for (const endpoint of authEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const authResponse = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (authResponse.ok) {
          diagnostic.connectivity.authentication = {
            status: 'success',
            endpoint: endpoint,
            http_status: authResponse.status
          };
          authSuccess = true;
          console.log(`✅ Autenticação bem-sucedida: ${endpoint}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Falha no endpoint de auth ${endpoint}:`, error.message);
      }
    }

    if (!authSuccess) {
      diagnostic.connectivity.authentication = {
        status: 'failed',
        error: 'Credenciais inválidas ou endpoints indisponíveis'
      };
      diagnostic.recommendations.push('Verificar credenciais de autenticação (usuário/senha)');
    }

    // 3. Teste de endpoints de jobs
    console.log('🔄 Testando endpoints de jobs...');
    const jobEndpoints = [
      '/api/v2/jobs?limit=10',
      '/api/v1/jobs?limit=10',
      '/api/v2/jobs?age=86400&limit=10',
      '/api/jobs?limit=10'
    ];

    let jobEndpointWorking = false;
    for (const endpoint of jobEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const startTime = Date.now();
        const jobResponse = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (jobResponse.ok) {
          try {
            const jobData = await jobResponse.json();
            const jobCount = Array.isArray(jobData) ? jobData.length : 
                           jobData.jobs?.length || 
                           jobData.output?.length || 
                           jobData.result?.length || 0;
            
            diagnostic.endpoints[endpoint] = {
              status: 'success',
              http_status: jobResponse.status,
              response_time_ms: responseTime,
              job_count: jobCount,
              data_structure: Object.keys(jobData).join(', ')
            };
            
            jobEndpointWorking = true;
            console.log(`✅ Endpoint de jobs funcionando: ${endpoint} (${jobCount} jobs)`);
            break;
          } catch (parseError) {
            diagnostic.endpoints[endpoint] = {
              status: 'failed',
              http_status: jobResponse.status,
              error: 'Falha no parse JSON',
              response_time_ms: responseTime
            };
          }
        } else {
          diagnostic.endpoints[endpoint] = {
            status: 'failed',
            http_status: jobResponse.status,
            error: jobResponse.statusText,
            response_time_ms: responseTime
          };
        }
      } catch (error) {
        diagnostic.endpoints[endpoint] = {
          status: 'error',
          error: error.message
        };
        console.log(`❌ Erro no endpoint ${endpoint}:`, error.message);
      }
    }

    if (!jobEndpointWorking) {
      diagnostic.recommendations.push('Nenhum endpoint de jobs está funcionando - verificar versão da API Bacula');
    }

    // 4. Análise de versão da API
    console.log('🔄 Detectando versão da API...');
    const versionEndpoints = [
      '/api/v2/config/api/info',
      '/api/v1/config/api/info',
      '/web/api/v2/config/api/info'
    ];

    for (const endpoint of versionEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const versionResponse = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          diagnostic.api_version = {
            endpoint: endpoint,
            data: versionData,
            detected_version: endpoint.includes('v2') ? 'v2' : 'v1'
          };
          console.log(`✅ Versão da API detectada: ${endpoint}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Falha no endpoint de versão ${endpoint}:`, error.message);
      }
    }

    // 5. Recomendações finais
    const workingEndpoints = Object.values(diagnostic.endpoints).filter(e => e.status === 'success').length;
    
    if (workingEndpoints === 0) {
      diagnostic.recommendations.push('CRÍTICO: Nenhum endpoint está funcionando');
      diagnostic.recommendations.push('Verificar se o serviço BaculaWeb está executando');
      diagnostic.recommendations.push('Confirmar URL base da integração');
    } else if (workingEndpoints < 2) {
      diagnostic.recommendations.push('Poucos endpoints funcionando - verificar configuração da API');
    }

    if (!diagnostic.connectivity.authentication || diagnostic.connectivity.authentication.status === 'failed') {
      diagnostic.recommendations.push('CRÍTICO: Falha na autenticação - verificar credenciais');
    }

    // Status geral
    diagnostic.overall_status = 
      diagnostic.connectivity.basic?.status === 'success' &&
      diagnostic.connectivity.authentication?.status === 'success' &&
      workingEndpoints > 0 ? 'healthy' : 'critical';

    console.log(`🏁 Diagnóstico concluído. Status: ${diagnostic.overall_status}`);
    console.log(`📊 Endpoints funcionando: ${workingEndpoints}`);
    console.log(`💡 Recomendações: ${diagnostic.recommendations.length}`);

    return new Response(JSON.stringify(diagnostic), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Falha no diagnóstico',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});