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

    const body = await req.json().catch(() => ({}));
    const { phone_number, run_diagnostic = true, send_report = true } = body;

    if (!phone_number) {
      return new Response(JSON.stringify({ 
        error: 'Número de telefone é obrigatório para teste' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🧪 Iniciando teste completo do relatório Bacula para: ${phone_number}`);

    const testResults = {
      timestamp: new Date().toISOString(),
      phone_number,
      steps: [],
      diagnostic: null,
      report_sent: false,
      success: false
    };

    // Passo 1: Diagnóstico do sistema (opcional)
    if (run_diagnostic) {
      console.log('🔍 Executando diagnóstico...');
      try {
        const diagnosticResponse = await supabase.functions.invoke('bacula-diagnostic');
        
        if (diagnosticResponse.error) {
          throw new Error(diagnosticResponse.error.message);
        }

        testResults.diagnostic = diagnosticResponse.data;
        testResults.steps.push({
          step: 'diagnostic',
          status: 'success',
          message: `Status geral: ${diagnosticResponse.data.overall_status}`,
          details: diagnosticResponse.data.recommendations
        });

        console.log(`✅ Diagnóstico concluído: ${diagnosticResponse.data.overall_status}`);
      } catch (error) {
        testResults.steps.push({
          step: 'diagnostic',
          status: 'failed',
          message: `Falha no diagnóstico: ${error.message}`,
          error: error.message
        });
        console.error('❌ Falha no diagnóstico:', error);
      }
    }

    // Passo 2: Envio do relatório (opcional)
    if (send_report) {
      console.log('📤 Enviando relatório de teste...');
      try {
        const reportResponse = await supabase.functions.invoke('send-bacula-daily-report', {
          body: {
            test_mode: true,
            phone_number: phone_number
          }
        });

        if (reportResponse.error) {
          throw new Error(reportResponse.error.message);
        }

        testResults.report_sent = true;
        testResults.steps.push({
          step: 'send_report',
          status: 'success',
          message: 'Relatório enviado com sucesso',
          details: reportResponse.data
        });

        console.log('✅ Relatório enviado com sucesso');
      } catch (error) {
        testResults.steps.push({
          step: 'send_report',
          status: 'failed',
          message: `Falha no envio: ${error.message}`,
          error: error.message
        });
        console.error('❌ Falha no envio do relatório:', error);
      }
    }

    // Passo 3: Teste de conectividade com proxy Bacula
    console.log('🔌 Testando proxy Bacula...');
    try {
      const proxyResponse = await supabase.functions.invoke('bacula-proxy', {
        body: {
          endpoint: 'test',
          params: {}
        },
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        }
      });

      if (proxyResponse.error) {
        throw new Error(proxyResponse.error.message);
      }

      testResults.steps.push({
        step: 'proxy_test',
        status: 'success',
        message: 'Proxy Bacula funcionando',
        details: {
          endpoint_used: proxyResponse.data.endpoint,
          response_time: proxyResponse.data.response_time_ms
        }
      });

      console.log('✅ Proxy Bacula funcionando');
    } catch (error) {
      testResults.steps.push({
        step: 'proxy_test',
        status: 'failed',
        message: `Falha no proxy: ${error.message}`,
        error: error.message
      });
      console.error('❌ Falha no proxy Bacula:', error);
    }

    // Passo 4: Teste de jobs das últimas 24h
    console.log('📊 Testando busca de jobs...');
    try {
      const jobsResponse = await supabase.functions.invoke('bacula-proxy', {
        body: {
          endpoint: 'jobs/last24h',
          params: { limit: 10 }
        },
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        }
      });

      if (jobsResponse.error) {
        throw new Error(jobsResponse.error.message);
      }

      const jobsData = jobsResponse.data.data;
      const jobCount = Array.isArray(jobsData) ? jobsData.length : 
                     jobsData?.jobs?.length || 
                     jobsData?.output?.length || 0;

      testResults.steps.push({
        step: 'jobs_test',
        status: 'success',
        message: `${jobCount} jobs encontrados`,
        details: {
          job_count: jobCount,
          data_structure: Object.keys(jobsData || {}).join(', '),
          endpoint_used: jobsResponse.data.endpoint
        }
      });

      console.log(`✅ Jobs encontrados: ${jobCount}`);
    } catch (error) {
      testResults.steps.push({
        step: 'jobs_test',
        status: 'failed',
        message: `Falha na busca de jobs: ${error.message}`,
        error: error.message
      });
      console.error('❌ Falha na busca de jobs:', error);
    }

    // Avaliação final
    const successfulSteps = testResults.steps.filter(step => step.status === 'success').length;
    const totalSteps = testResults.steps.length;
    testResults.success = successfulSteps === totalSteps;

    console.log(`🏁 Teste concluído: ${successfulSteps}/${totalSteps} passos bem-sucedidos`);

    // Criar relatório de teste
    const testReport = {
      ...testResults,
      summary: {
        total_steps: totalSteps,
        successful_steps: successfulSteps,
        success_rate: Math.round((successfulSteps / totalSteps) * 100),
        overall_status: testResults.success ? 'SUCESSO' : 'FALHA PARCIAL',
        critical_issues: testResults.steps
          .filter(step => step.status === 'failed')
          .map(step => step.message)
      },
      recommendations: []
    };

    // Adicionar recomendações baseadas nos resultados
    if (!testResults.success) {
      if (testResults.steps.find(s => s.step === 'proxy_test' && s.status === 'failed')) {
        testReport.recommendations.push('Verificar conectividade com servidor Bacula');
      }
      if (testResults.steps.find(s => s.step === 'jobs_test' && s.status === 'failed')) {
        testReport.recommendations.push('Verificar API Bacula e endpoints de jobs');
      }
      if (testResults.steps.find(s => s.step === 'send_report' && s.status === 'failed')) {
        testReport.recommendations.push('Verificar integração WhatsApp Evolution API');
      }
    }

    // Salvar log do teste
    await supabase
      .from('scheduled_reports_logs')
      .insert({
        phone_number: phone_number,
        execution_date: new Date().toISOString(),
        status: testResults.success ? 'success' : 'error',
        message_sent: testResults.report_sent,
        message_content: `Teste executado: ${successfulSteps}/${totalSteps} passos bem-sucedidos`,
        whatsapp_response: testReport,
        user_id: '5754f42b-507c-4461-9ff0-ccd095c7be93' // ID do usuário master
      });

    return new Response(JSON.stringify(testReport), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Falha no teste do relatório',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});