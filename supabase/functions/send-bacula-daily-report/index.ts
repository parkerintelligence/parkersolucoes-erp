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
    let template = null;
    let templateError = null;

    // Primeiro tentar buscar por ID (se report_id for fornecido)
    if (report_id) {
      const { data: reportConfig } = await supabase
        .from('scheduled_reports')
        .select('report_type')
        .eq('id', report_id)
        .single();

      if (reportConfig?.report_type) {
        // Verificar se é UUID (novo formato) ou string (formato antigo)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportConfig.report_type);
        
        if (isUUID) {
          // Buscar por ID
          const result = await supabase
            .from('whatsapp_message_templates')
            .select('*')
            .eq('id', reportConfig.report_type)
            .eq('is_active', true)
            .single();
          template = result.data;
          templateError = result.error;
        }
      }
    }

    // Fallback: buscar por nome se não encontrou por ID
    if (!template) {
      const result = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('name', 'Relatório Diário de Erros Bacula')
        .eq('is_active', true)
        .single();
      template = result.data;
      templateError = result.error;
    }

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
          endpoint: 'jobs/last24h'
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
      } else if (baculaData?.data && Array.isArray(baculaData.data)) {
        allJobs = baculaData.data;
      }

      console.log(`📊 Total de jobs encontrados: ${allJobs.length}`);

      // Filtrar jobs com erro das últimas 24 horas
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      const failedJobs = allJobs.filter(job => {
        const jobDate = new Date(job.starttime || job.schedtime || job.endtime);
        const isRecent = jobDate >= twentyFourHoursAgo;
        const hasError = job.jobstatus === 'E' || job.jobstatus === 'f' || job.jobstatus === 'A';
        return isRecent && hasError;
      });

      const successJobs = allJobs.filter(job => {
        const jobDate = new Date(job.starttime || job.schedtime || job.endtime);
        const isRecent = jobDate >= twentyFourHoursAgo;
        const isSuccess = job.jobstatus === 'T';
        return isRecent && isSuccess;
      });

      const totalRecentJobs = failedJobs.length + successJobs.length;

      console.log(`📊 Encontrados ${failedJobs.length} jobs com erro`);

      // Preparar dados para o template
      const reportData = {
        date: now.toISOString().split('T')[0],
        totalJobs: totalRecentJobs,
        errorCount: failedJobs.length,
        errorRate: totalRecentJobs > 0 ? Math.round((failedJobs.length / totalRecentJobs) * 100) : 0,
        hasErrors: failedJobs.length > 0,
        errorJobs: failedJobs.map(job => ({
          name: job.name || job.jobname || 'N/A',
          client: job.client || job.clientname || 'N/A', 
          level: job.jobstatus === 'E' ? 'Erro' : job.jobstatus === 'f' ? 'Falha Fatal' : 'Cancelado',
          startTime: job.starttime ? new Date(job.starttime).toLocaleString('pt-BR') : 'N/A',
          bytes: job.jobbytes ? `${(parseInt(job.jobbytes) / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
          files: job.jobfiles || '0'
        })),
        timestamp: new Date().toLocaleString('pt-BR')
      };

      // Processar template com dados
      let message = template.body;
      
      // Substituir variáveis simples
      message = message.replace(/\{\{date\}\}/g, reportData.date);
      message = message.replace(/\{\{totalJobs\}\}/g, reportData.totalJobs.toString());
      message = message.replace(/\{\{errorCount\}\}/g, reportData.errorCount.toString());
      message = message.replace(/\{\{errorRate\}\}/g, reportData.errorRate.toString());
      message = message.replace(/\{\{timestamp\}\}/g, reportData.timestamp);

      // Processar condicionais e loops
      if (reportData.hasErrors) {
        // Manter seção de erros
        message = message.replace(/\{\{#if hasErrors\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '$1');
        
        // Processar lista de jobs com erro
        const jobsSection = message.match(/\{\{#each errorJobs\}\}([\s\S]*?)\{\{\/each\}\}/);
        if (jobsSection) {
          const jobTemplate = jobsSection[1];
          const jobsText = reportData.errorJobs.map(job => {
            return jobTemplate
              .replace(/\{\{name\}\}/g, job.name)
              .replace(/\{\{client\}\}/g, job.client)
              .replace(/\{\{level\}\}/g, job.level)
              .replace(/\{\{startTime\}\}/g, job.startTime)
              .replace(/\{\{bytes\}\}/g, job.bytes)
              .replace(/\{\{files\}\}/g, job.files);
          }).join('\n');
          
          message = message.replace(/\{\{#each errorJobs\}\}[\s\S]*?\{\{\/each\}\}/, jobsText);
        }
      } else {
        // Mostrar seção de "sem erros"
        message = message.replace(/\{\{#if hasErrors\}\}[\s\S]*?\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
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
          totalJobs: totalRecentJobs,
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