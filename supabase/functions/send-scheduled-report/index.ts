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

  try {
    const { report_id }: ScheduledReportRequest = await req.json();
    
    // Buscar configuração do relatório
    const { data: report, error: reportError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', report_id)
      .eq('is_active', true)
      .single();

    if (reportError || !report) {
      throw new Error('Relatório não encontrado ou inativo');
    }

    // Buscar Evolution API integration do usuário
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', report.user_id)
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      throw new Error('Evolution API não configurada para este usuário');
    }

    // Buscar template da mensagem
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('template_type', report.report_type)
      .eq('user_id', report.user_id)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template não encontrado para o tipo: ${report.report_type}`);
    }

    // Gerar conteúdo baseado no template
    const message = await generateMessageFromTemplate(template, report.report_type, report.user_id, report.settings);

    // Enviar mensagem via WhatsApp
    const instanceName = integration.instance_name || 'main_instance';
    const whatsappResponse = await fetch(`${integration.base_url}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': integration.api_token || '',
      },
      body: JSON.stringify({
        number: report.phone_number.replace(/\D/g, ''),
        text: message,
      }),
    });

    if (!whatsappResponse.ok) {
      throw new Error('Falha ao enviar mensagem WhatsApp');
    }

    // Atualizar registro de execução
    await supabase
      .from('scheduled_reports')
      .update({
        last_execution: new Date().toISOString(),
        execution_count: report.execution_count + 1,
        next_execution: calculateNextExecution(report.cron_expression)
      })
      .eq('id', report_id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Relatório enviado com sucesso',
      report_type: report.report_type 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-scheduled-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
  let messageContent = template.body;

  // Substituir variáveis do template baseadas no tipo de relatório
  switch (reportType) {
    case 'backup_alert':
      const backupData = await getBackupData(userId, settings);
      messageContent = messageContent
        .replace(/\{\{date\}\}/g, currentDate)
        .replace(/\{\{hours_threshold\}\}/g, backupData.hoursThreshold.toString())
        .replace(/\{\{backup_list\}\}/g, backupData.list);
      break;

    case 'schedule_critical':
      const scheduleData = await getScheduleData(userId, settings);
      messageContent = messageContent
        .replace(/\{\{date\}\}/g, currentDate)
        .replace(/\{\{schedule_items\}\}/g, scheduleData.items)
        .replace(/\{\{total_items\}\}/g, scheduleData.total.toString());
      break;

    case 'glpi_summary':
      const glpiData = await getGLPIData(userId, settings);
      messageContent = messageContent
        .replace(/\{\{date\}\}/g, currentDate)
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
  const outdatedBackups = [
    { name: 'backup_servidor1', lastModified: new Date(Date.now() - (72 * 60 * 60 * 1000)) },
    { name: 'backup_bd_principal', lastModified: new Date(Date.now() - (96 * 60 * 60 * 1000)) }
  ];

  let backupList = '';
  if (outdatedBackups.length === 0) {
    backupList = '✅ Todos os backups estão atualizados!';
  } else {
    outdatedBackups.forEach((backup, index) => {
      const hoursAgo = Math.floor((Date.now() - backup.lastModified.getTime()) / (1000 * 60 * 60));
      backupList += `• ${backup.name} - há ${hoursAgo} horas\n`;
    });
  }

  return {
    hoursThreshold: alertHours,
    list: backupList.trim()
  };
}

async function getScheduleData(userId: string, settings: any) {
  // Buscar itens da agenda críticos (vencimento em 30 dias ou menos)
  const { data: criticalItems } = await supabase
    .from('schedule_items')
    .select('title, company, due_date, type')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_date', new Date().toISOString().split('T')[0])
    .lte('due_date', new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  let itemsList = '';
  if (!criticalItems || criticalItems.length === 0) {
    itemsList = '✅ Nenhum vencimento crítico nos próximos 30 dias!';
  } else {
    criticalItems.forEach((item, index) => {
      const daysUntil = Math.ceil((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const urgencyIcon = daysUntil <= 7 ? '🔴' : daysUntil <= 15 ? '🟡' : '🟢';
      
      itemsList += `${urgencyIcon} ${item.title} - ${item.company} (${daysUntil} dias)\n`;
    });
  }

  return {
    items: itemsList.trim(),
    total: criticalItems?.length || 0
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

  // Simular dados do GLPI (aqui você faria a chamada real para a API do GLPI)
  const glpiSummary = {
    openTickets: 15,
    criticalTickets: 2,
    pendingTickets: 4,
    urgentTickets: ['#1234 - Sistema fora do ar', '#1235 - Falha de segurança']
  };

  const ticketList = glpiSummary.urgentTickets.join('\n• ');

  return {
    open: glpiSummary.openTickets,
    critical: glpiSummary.criticalTickets,
    pending: glpiSummary.pendingTickets,
    list: ticketList ? `• ${ticketList}` : 'Nenhum chamado urgente'
  };
}


function calculateNextExecution(cronExpression: string): string {
  // Implementação simplificada para agendamentos diários
  const now = new Date();
  const [minute, hour] = cronExpression.split(' ').map(Number);
  
  const nextExec = new Date();
  nextExec.setHours(hour, minute, 0, 0);
  
  // Se o horário já passou hoje, agendar para amanhã
  if (nextExec <= now) {
    nextExec.setDate(nextExec.getDate() + 1);
  }
  
  return nextExec.toISOString();
}

serve(handler);