import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  step: string;
  status: 'success' | 'failed' | 'warning';
  message: string;
  details?: any;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const { run_diagnostic = true, phone_number } = body;

    const results: TestResult[] = [];
    
    console.log('🔍 Iniciando teste de conexão Bacula...');

    // Step 1: Check Bacula integration
    results.push({
      step: 'bacula_integration',
      status: 'success',
      message: 'Verificando integração Bacula...'
    });

    const { data: baculaIntegration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('is_active', true)
      .single();

    if (integrationError || !baculaIntegration) {
      results.push({
        step: 'bacula_integration',
        status: 'failed',
        message: 'Integração Bacula não encontrada ou inativa',
        error: integrationError?.message || 'Integration not found'
      });
    } else {
      results.push({
        step: 'bacula_integration',
        status: 'success',
        message: `Integração encontrada: ${baculaIntegration.name}`,
        details: {
          name: baculaIntegration.name,
          base_url: baculaIntegration.base_url,
          username: baculaIntegration.username
        }
      });
    }

    // Step 2: Test Bacula connectivity
    if (baculaIntegration) {
      results.push({
        step: 'bacula_connectivity',
        status: 'success',
        message: 'Testando conectividade com Bacula...'
      });

      try {
        const connectionResponse = await supabase.functions.invoke('bacula-proxy', {
          body: {
            endpoint: 'test',
            params: {}
          },
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        });

        if (connectionResponse.error) {
          results.push({
            step: 'bacula_connectivity',
            status: 'failed',
            message: 'Falha na conectividade com Bacula',
            error: connectionResponse.error.message,
            details: connectionResponse.error
          });
        } else {
          results.push({
            step: 'bacula_connectivity',
            status: 'success',
            message: 'Conectividade com Bacula OK'
          });
        }
      } catch (error) {
        results.push({
          step: 'bacula_connectivity',
          status: 'failed',
          message: 'Erro ao testar conectividade',
          error: error.message
        });
      }

      // Step 3: Test jobs retrieval
      results.push({
        step: 'bacula_jobs',
        status: 'success',
        message: 'Testando recuperação de jobs...'
      });

      try {
        const jobsResponse = await supabase.functions.invoke('bacula-proxy', {
          body: {
            endpoint: 'jobs/last24h',
            params: { limit: 10 }
          },
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        });

        if (jobsResponse.error) {
          results.push({
            step: 'bacula_jobs',
            status: 'failed',
            message: 'Falha ao recuperar jobs',
            error: jobsResponse.error.message
          });
        } else {
          const jobsCount = jobsResponse.data?.jobs?.length || 0;
          results.push({
            step: 'bacula_jobs',
            status: 'success',
            message: `${jobsCount} jobs recuperados com sucesso`,
            details: {
              jobsCount,
              stats: jobsResponse.data?.stats
            }
          });
        }
      } catch (error) {
        results.push({
          step: 'bacula_jobs',
          status: 'failed',
          message: 'Erro ao recuperar jobs',
          error: error.message
        });
      }
    }

    // Step 4: Test WhatsApp integration (if phone number provided)
    if (phone_number) {
      results.push({
        step: 'whatsapp_integration',
        status: 'success',
        message: 'Verificando integração WhatsApp...'
      });

      const { data: whatsappIntegration } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'evolution_api')
        .eq('is_active', true)
        .single();

      if (whatsappIntegration) {
        results.push({
          step: 'whatsapp_integration',
          status: 'success',
          message: 'Integração WhatsApp encontrada',
          details: {
            instance_name: whatsappIntegration.instance_name
          }
        });

        // Test message sending
        try {
          const testMessage = `🔧 *TESTE DE CONECTIVIDADE BACULA*\n\n` +
            `⏰ Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n` +
            `✅ Sistema operacional e pronto para relatórios automáticos`;

          await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              instanceName: whatsappIntegration.instance_name,
              phoneNumber: phone_number,
              message: testMessage
            }
          });

          results.push({
            step: 'whatsapp_test',
            status: 'success',
            message: 'Mensagem de teste enviada com sucesso'
          });
        } catch (error) {
          results.push({
            step: 'whatsapp_test',
            status: 'failed',
            message: 'Falha ao enviar mensagem de teste',
            error: error.message
          });
        }
      } else {
        results.push({
          step: 'whatsapp_integration',
          status: 'failed',
          message: 'Integração WhatsApp não encontrada'
        });
      }
    }

    // Generate summary
    const successfulSteps = results.filter(r => r.status === 'success').length;
    const failedSteps = results.filter(r => r.status === 'failed').length;
    const warningSteps = results.filter(r => r.status === 'warning').length;

    const summary = {
      totalSteps: results.length,
      successful: successfulSteps,
      failed: failedSteps,
      warnings: warningSteps,
      success: failedSteps === 0,
      score: Math.round((successfulSteps / results.length) * 100)
    };

    console.log('✅ Teste concluído:', summary);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      phone_number,
      run_diagnostic,
      results,
      summary,
      recommendations: failedSteps > 0 ? [
        'Verifique as credenciais da integração Bacula',
        'Confirme se o servidor Bacula está acessível',
        'Teste a conectividade de rede',
        'Verifique os logs do servidor Bacula'
      ] : [
        'Todas as verificações passaram com sucesso',
        'Sistema pronto para relatórios automáticos'
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno no teste',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});