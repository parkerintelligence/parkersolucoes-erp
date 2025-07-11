import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { test, phone_number, report_id } = await req.json().catch(() => ({}));

    console.log('🔄 Iniciando processamento do relatório diário do Bacula');

    // Buscar template do WhatsApp para relatórios Bacula
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('name', 'Relatório Diário de Erros Bacula')
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error('❌ Erro ao buscar template:', templateError);
      throw new Error('Template de WhatsApp não encontrado');
    }

    // Se for teste, usar número específico
    let targetPhones = [];
    if (test && phone_number) {
      targetPhones = [phone_number];
    } else if (report_id) {
      // Buscar configuração específica do relatório
      const { data: reportConfig, error: reportError } = await supabase
        .from('scheduled_reports')
        .select('phone_number, user_id')
        .eq('id', report_id)
        .eq('is_active', true)
        .single();

      if (reportError || !reportConfig) {
        throw new Error('Configuração do relatório não encontrada');
      }

      targetPhones = [reportConfig.phone_number];
    } else {
      // Buscar usuários ativos para envio automático
      const { data: users, error: usersError } = await supabase
        .from('scheduled_reports')
        .select('phone_number, user_id')
        .eq('report_type', template.id)
        .eq('is_active', true);

      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError);
        throw new Error('Erro ao buscar usuários');
      }

      targetPhones = users?.map(u => u.phone_number) || [];
    }

    if (targetPhones.length === 0) {
      console.log('⚠️ Nenhum destinatário encontrado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhum destinatário configurado' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar integração ativa do Evolution API
    const { data: evolutionIntegration, error: evolutionError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .single();

    if (evolutionError || !evolutionIntegration) {
      console.error('❌ Integração Evolution API não encontrada:', evolutionError);
      throw new Error('Integração Evolution API não configurada');
    }

    // Buscar integração ativa do Bacula
    const { data: baculaIntegration, error: baculaError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'bacula')
      .eq('is_active', true)
      .single();

    if (baculaError || !baculaIntegration) {
      console.error('❌ Integração Bacula não encontrada:', baculaError);
      throw new Error('Integração Bacula não configurada');
    }

    // Buscar jobs com erro do dia anterior
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`📅 Buscando jobs com erro do dia: ${yesterdayStr}`);

    try {
      // Fazer requisição para a API do Bacula via proxy
      const { data: baculaData, error: baculaRequestError } = await supabase.functions.invoke('bacula-proxy', {
        body: { 
          endpoint: 'jobs/last24h',
          integration_id: baculaIntegration.id 
        }
      });

      if (baculaRequestError) {
        console.error('❌ Erro ao buscar dados do Bacula:', baculaRequestError);
        throw new Error('Erro ao conectar com Bacula');
      }

      // Extrair e filtrar jobs com erro
      let allJobs = [];
      if (baculaData?.output && Array.isArray(baculaData.output)) {
        allJobs = baculaData.output;
      } else if (baculaData?.result && Array.isArray(baculaData.result)) {
        allJobs = baculaData.result;
      } else if (Array.isArray(baculaData)) {
        allJobs = baculaData;
      }

      // Filtrar jobs com erro do dia anterior
      const failedJobs = allJobs.filter(job => {
        const jobDate = new Date(job.starttime || job.schedtime || job.endtime);
        const isYesterday = jobDate.toISOString().split('T')[0] === yesterdayStr;
        const hasError = job.jobstatus === 'E' || job.jobstatus === 'f';
        return isYesterday && hasError;
      });

      console.log(`📊 Encontrados ${failedJobs.length} jobs com erro`);

      // Preparar dados para o template
      const reportData = {
        date: yesterdayStr,
        total_errors: failedJobs.length,
        has_errors: failedJobs.length > 0,
        failed_jobs: failedJobs.map(job => ({
          name: job.name || job.jobname || 'N/A',
          client: job.client || job.clientname || 'N/A',
          status_description: job.jobstatus === 'E' ? 'Erro' : 'Falha Fatal',
          start_time: job.starttime ? new Date(job.starttime).toLocaleString('pt-BR') : 'N/A',
          job_id: job.jobid || job.id || 'N/A'
        })),
        timestamp: new Date().toLocaleString('pt-BR')
      };

      // Processar template com dados
      let message = template.body;
      
      // Substituir variáveis simples
      message = message.replace(/\{\{date\}\}/g, reportData.date);
      message = message.replace(/\{\{total_errors\}\}/g, reportData.total_errors.toString());
      message = message.replace(/\{\{timestamp\}\}/g, reportData.timestamp);

      // Processar condicionais e loops (simplificado)
      if (reportData.has_errors) {
        // Manter seção de erros
        message = message.replace(/\{\{#if has_errors\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '$1');
        
        // Processar lista de jobs
        const jobsSection = message.match(/\{\{#each failed_jobs\}\}([\s\S]*?)\{\{\/each\}\}/);
        if (jobsSection) {
          const jobTemplate = jobsSection[1];
          const jobsText = reportData.failed_jobs.map(job => {
            return jobTemplate
              .replace(/\{\{name\}\}/g, job.name)
              .replace(/\{\{client\}\}/g, job.client)
              .replace(/\{\{status_description\}\}/g, job.status_description)
              .replace(/\{\{start_time\}\}/g, job.start_time)
              .replace(/\{\{job_id\}\}/g, job.job_id);
          }).join('\n');
          
          message = message.replace(/\{\{#each failed_jobs\}\}[\s\S]*?\{\{\/each\}\}/, jobsText);
        }
      } else {
        // Mostrar seção de "sem erros"
        message = message.replace(/\{\{#if has_errors\}\}[\s\S]*?\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      }

      // Enviar mensagem para cada destinatário
      const results = [];
      for (const phoneNumber of targetPhones) {
        console.log(`📱 Enviando para: ${phoneNumber}`);
        
        try {
          const response = await fetch(`${evolutionIntegration.base_url}/message/sendText/${evolutionIntegration.instance_name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionIntegration.api_token || ''
            },
            body: JSON.stringify({
              number: phoneNumber,
              text: message
            })
          });

          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }

          const responseData = await response.json();
          
          results.push({
            phone: phoneNumber,
            success: true,
            response: responseData
          });

          console.log(`✅ Mensagem enviada para ${phoneNumber}`);

        } catch (error) {
          console.error(`❌ Erro ao enviar para ${phoneNumber}:`, error);
          results.push({
            phone: phoneNumber,
            success: false,
            error: error.message
          });
        }
      }

      console.log('✅ Processamento concluído');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Relatório processado com sucesso',
          results,
          jobsWithError: failedJobs.length,
          recipients: targetPhones.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('❌ Erro ao buscar dados do Bacula:', error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erro ao processar relatório', 
          error: error.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor', 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});