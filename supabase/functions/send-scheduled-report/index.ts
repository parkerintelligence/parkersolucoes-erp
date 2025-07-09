import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledReportRequest {
  report_id: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let reportLog = null;

  try {
    const { report_id }: ScheduledReportRequest = await req.json();
    console.log(`🚀 Iniciando envio do relatório: ${report_id}`);
    
    // Buscar configuração do relatório
    const { data: report, error: reportError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', report_id)
      .eq('is_active', true)
      .single();

    if (reportError || !report) {
      console.error('❌ Relatório não encontrado:', reportError);
      throw new Error('Relatório não encontrado ou inativo');
    }

    console.log(`📋 Relatório encontrado: ${report.name} (${report.report_type})`);

    // Criar log inicial
    reportLog = {
      report_id: report_id,
      phone_number: report.phone_number,
      status: 'pending',
      user_id: report.user_id,
      execution_date: new Date().toISOString()
    };

    // Buscar Evolution API integration do usuário
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', report.user_id)
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('❌ Evolution API não configurada:', integrationError);
      throw new Error('Evolution API não configurada para este usuário');
    }

    console.log(`🔌 Integration encontrada: ${integration.name}`);

    // Buscar template da mensagem por ID (novo sistema unificado)
    console.log(`🔍 Buscando template por ID: ${report.report_type}`);
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('id', report.report_type)
      .eq('user_id', report.user_id)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('❌ Template não encontrado:', templateError);
      throw new Error(`Template não encontrado ou inativo: ${report.report_type}`);
    }

    console.log(`📝 Template encontrado: ${template.name} (tipo: ${template.template_type})`);

    // Gerar conteúdo baseado no template
    const message = await generateMessageFromTemplate(template, template.template_type, report.user_id, report.settings);
    console.log(`💬 Mensagem gerada (${message.length} caracteres)`);

    // Atualizar log com conteúdo da mensagem
    reportLog.message_content = message.substring(0, 1000); // Limitar tamanho

    // Enviar mensagem via WhatsApp
    const instanceName = integration.instance_name || 'main_instance';
    const cleanPhoneNumber = report.phone_number.replace(/\D/g, '');
    
    // Testar múltiplos endpoints da Evolution API
    const endpoints = [
      `/message/sendText/${instanceName}`,
      `/sendMessage/${instanceName}`,
      `/${instanceName}/message/sendText`,
      `/${instanceName}/sendMessage`
    ];

    let whatsappSuccess = false;
    let lastError = '';
    let whatsappResponse = null;

    for (const endpoint of endpoints) {
      try {
        const url = `${integration.base_url}${endpoint}`;
        console.log(`🔄 Tentando endpoint: ${url}`);
        
        const whatsappApiResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': integration.api_token || '',
          },
          body: JSON.stringify({
            number: cleanPhoneNumber,
            text: message,
          }),
        });

        console.log(`📡 Resposta do WhatsApp: ${whatsappApiResponse.status}`);

        if (whatsappApiResponse.ok) {
          whatsappResponse = await whatsappApiResponse.json();
          console.log('✅ Mensagem enviada com sucesso via', endpoint);
          whatsappSuccess = true;
          break;
        } else {
          const errorText = await whatsappApiResponse.text();
          lastError = `${whatsappApiResponse.status}: ${errorText}`;
          console.log(`❌ Falha em ${endpoint}: ${lastError}`);
        }
      } catch (error) {
        lastError = error.message;
        console.log(`❌ Erro de rede em ${endpoint}: ${lastError}`);
      }
    }

    const executionTime = Date.now() - startTime;

    if (!whatsappSuccess) {
      // Log de erro
      await supabase.from('scheduled_reports_logs').insert({
        ...reportLog,
        status: 'error',
        message_sent: false,
        error_details: `Falha ao enviar mensagem WhatsApp: ${lastError}`,
        execution_time_ms: executionTime,
        whatsapp_response: { error: lastError }
      });
      
      throw new Error(`Falha ao enviar mensagem WhatsApp: ${lastError}`);
    }

    // Usar a função PostgreSQL para calcular a próxima execução
    const { data: nextExecution, error: nextExecError } = await supabase
      .rpc('calculate_next_execution', {
        cron_expr: report.cron_expression,
        from_time: new Date().toISOString()
      });

    if (nextExecError) {
      console.error('❌ Erro ao calcular próxima execução:', nextExecError);
      throw nextExecError;
    }

    // Atualizar registro de execução
    await supabase
      .from('scheduled_reports')
      .update({
        last_execution: new Date().toISOString(),
        execution_count: (report.execution_count || 0) + 1,
        next_execution: nextExecution
      })
      .eq('id', report_id);

    // Log de sucesso
    await supabase.from('scheduled_reports_logs').insert({
      ...reportLog,
      status: 'success',
      message_sent: true,
      execution_time_ms: executionTime,
      whatsapp_response: whatsappResponse
    });

    console.log(`✅ Relatório enviado com sucesso para ${cleanPhoneNumber}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Relatório enviado com sucesso',
      template_name: template.name,
      template_type: template.template_type,
      phone_number: cleanPhoneNumber,
      next_execution: nextExecution,
      execution_time_ms: executionTime
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    // Log de erro se temos informações do relatório
    if (reportLog) {
      await supabase.from('scheduled_reports_logs').insert({
        ...reportLog,
        status: 'error',
        message_sent: false,
        error_details: error.message,
        execution_time_ms: executionTime
      });
    }

    console.error("❌ Erro na função send-scheduled-report:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Função para gerar mensagem baseada em template
async function generateMessageFromTemplate(template: any, reportType: string, userId: string, settings: any): Promise<string> {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');
  let messageContent = template.body;

  // Substituir variáveis básicas
  messageContent = messageContent
    .replace(/\{\{date\}\}/g, currentDate)
    .replace(/\{\{time\}\}/g, currentTime);

  // Substituir variáveis específicas baseadas no tipo de relatório
  switch (reportType) {
    case 'backup_alert':
      const backupData = await getBackupData(userId, settings);
      messageContent = messageContent
        .replace(/\{\{hours_threshold\}\}/g, backupData.hoursThreshold.toString())
        .replace(/\{\{backup_list\}\}/g, backupData.list)
        .replace(/\{\{total_outdated\}\}/g, backupData.outdatedCount.toString());
      break;

    case 'schedule_critical':
      const scheduleData = await getScheduleData(userId, settings);
      messageContent = messageContent
        .replace(/\{\{schedule_items\}\}/g, scheduleData.items)
        .replace(/\{\{total_items\}\}/g, scheduleData.total.toString())
        .replace(/\{\{critical_count\}\}/g, scheduleData.critical.toString());
      break;

    case 'glpi_summary':
      const glpiData = await getGLPIData(userId, settings);
      messageContent = messageContent
        .replace(/\{\{open_tickets\}\}/g, glpiData.open.toString())
        .replace(/\{\{critical_tickets\}\}/g, glpiData.critical.toString())
        .replace(/\{\{pending_tickets\}\}/g, glpiData.pending.toString())
        .replace(/\{\{ticket_list\}\}/g, glpiData.list);
      break;
  }

  return messageContent;
}

// Funções para obter dados específicos
async function getBackupData(userId: string, settings: any) {
  // Buscar configuração de horas de alerta
  const { data: alertSetting } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('user_id', userId)
    .eq('setting_key', 'ftp_backup_alert_hours')
    .single();

  const alertHours = alertSetting ? parseInt(alertSetting.setting_value) : 48;
  
  // Simular dados de backup (aqui você integraria com sua API FTP real)
  const mockOutdatedBackups = [
    { name: 'backup_servidor1.tar.gz', lastModified: new Date(Date.now() - (72 * 60 * 60 * 1000)) },
    { name: 'backup_bd_principal.sql', lastModified: new Date(Date.now() - (96 * 60 * 60 * 1000)) }
  ];

  let backupList = '';
  if (mockOutdatedBackups.length === 0) {
    backupList = '✅ Todos os backups estão atualizados!';
  } else {
    mockOutdatedBackups.forEach((backup) => {
      const hoursAgo = Math.floor((Date.now() - backup.lastModified.getTime()) / (1000 * 60 * 60));
      backupList += `• ${backup.name} - há ${hoursAgo}h\n`;
    });
  }

  return {
    hoursThreshold: alertHours,
    list: backupList.trim(),
    outdatedCount: mockOutdatedBackups.length
  };
}

async function getScheduleData(userId: string, settings: any) {
  // Buscar itens da agenda críticos (vencimento em 30 dias ou menos)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: criticalItems } = await supabase
    .from('schedule_items')
    .select('title, company, due_date, type')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_date', new Date().toISOString().split('T')[0])
    .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  let itemsList = '';
  let criticalCount = 0;

  if (!criticalItems || criticalItems.length === 0) {
    itemsList = '✅ Nenhum vencimento crítico nos próximos 30 dias!';
  } else {
    criticalItems.forEach((item) => {
      const daysUntil = Math.ceil((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const urgencyIcon = daysUntil <= 7 ? '🔴' : daysUntil <= 15 ? '🟡' : '🟢';
      
      if (daysUntil <= 7) criticalCount++;
      
      itemsList += `${urgencyIcon} ${item.title} - ${item.company} (${daysUntil} dias)\n`;
    });
  }

  return {
    items: itemsList.trim(),
    total: criticalItems?.length || 0,
    critical: criticalCount
  };
}

async function getGLPIData(userId: string, settings: any) {
  // Buscar integração GLPI do usuário
  const { data: glpiIntegration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'glpi')
    .eq('is_active', true)
    .single();

  if (!glpiIntegration) {
    return {
      open: 0,
      critical: 0,
      pending: 0,
      list: 'GLPI não configurado para este usuário.'
    };
  }

  // Simulação de dados do GLPI - aqui você faria a chamada real para a API
  const mockGlpiData = {
    openTickets: Math.floor(Math.random() * 20) + 5,
    criticalTickets: Math.floor(Math.random() * 5),
    pendingTickets: Math.floor(Math.random() * 8) + 2,
    urgentTickets: [
      `#${Math.floor(Math.random() * 9000) + 1000} - Sistema indisponível`,
      `#${Math.floor(Math.random() * 9000) + 1000} - Falha crítica no servidor`
    ]
  };

  const ticketList = mockGlpiData.urgentTickets.join('\n• ');

  return {
    open: mockGlpiData.openTickets,
    critical: mockGlpiData.criticalTickets,
    pending: mockGlpiData.pendingTickets,
    list: ticketList ? `• ${ticketList}` : 'Nenhum chamado urgente'
  };
}

serve(handler);
