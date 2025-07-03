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

    let message = '';
    
    // Gerar mensagem baseada no tipo de relatório
    switch (report.report_type) {
      case 'backup_alert':
        message = await generateBackupAlertReport(report.user_id, report.settings);
        break;
      case 'schedule_critical':
        message = await generateScheduleCriticalReport(report.user_id, report.settings);
        break;
      case 'glpi_summary':
        message = await generateGLPISummaryReport(report.user_id, report.settings);
        break;
      default:
        throw new Error('Tipo de relatório não suportado');
    }

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

async function generateBackupAlertReport(userId: string, settings: any): Promise<string> {
  // Buscar configuração de horas de alerta
  const { data: alertSetting } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('user_id', userId)
    .eq('setting_key', 'ftp_backup_alert_hours')
    .single();

  const alertHours = alertSetting ? parseInt(alertSetting.setting_value) : 48;
  const cutoffTime = new Date(Date.now() - (alertHours * 60 * 60 * 1000));

  // Simular dados de backup (aqui você integraria com sua API FTP real)
  const outdatedBackups = [
    { name: 'backup_servidor1', lastModified: new Date(Date.now() - (72 * 60 * 60 * 1000)) },
    { name: 'backup_bd_principal', lastModified: new Date(Date.now() - (96 * 60 * 60 * 1000)) }
  ];

  let message = `🚨 *RELATÓRIO AUTOMÁTICO - BACKUPS*\n\n`;
  
  if (outdatedBackups.length === 0) {
    message += `✅ *Todos os backups estão atualizados!*\n`;
    message += `📊 Verificação: últimas ${alertHours} horas\n`;
  } else {
    message += `⚠️ *${outdatedBackups.length} backup(s) desatualizado(s):*\n\n`;
    
    outdatedBackups.forEach((backup, index) => {
      const hoursAgo = Math.floor((Date.now() - backup.lastModified.getTime()) / (1000 * 60 * 60));
      message += `${index + 1}. 📁 *${backup.name}*\n`;
      message += `   ⏰ Há ${hoursAgo} horas\n\n`;
    });
  }

  message += `🕒 Relatório gerado: ${new Date().toLocaleString('pt-BR')}`;
  return message;
}

async function generateScheduleCriticalReport(userId: string, settings: any): Promise<string> {
  // Buscar itens da agenda críticos (vencimento em 30 dias ou menos)
  const { data: criticalItems } = await supabase
    .from('schedule_items')
    .select('title, company, due_date, type')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_date', new Date().toISOString().split('T')[0])
    .lte('due_date', new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  let message = `📅 *RELATÓRIO AUTOMÁTICO - VENCIMENTOS CRÍTICOS*\n\n`;
  
  if (!criticalItems || criticalItems.length === 0) {
    message += `✅ *Nenhum vencimento crítico nos próximos 30 dias!*\n`;
  } else {
    message += `⚠️ *${criticalItems.length} item(ns) com vencimento crítico:*\n\n`;
    
    criticalItems.forEach((item, index) => {
      const daysUntil = Math.ceil((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const urgencyIcon = daysUntil <= 7 ? '🔴' : daysUntil <= 15 ? '🟡' : '🟢';
      
      message += `${index + 1}. ${urgencyIcon} *${item.title}*\n`;
      message += `   🏢 ${item.company}\n`;
      message += `   📋 ${item.type}\n`;
      message += `   📅 Vence em ${daysUntil} dias\n\n`;
    });
  }

  message += `🕒 Relatório gerado: ${new Date().toLocaleString('pt-BR')}`;
  return message;
}

async function generateGLPISummaryReport(userId: string, settings: any): Promise<string> {
  // Buscar integração GLPI do usuário
  const { data: glpiIntegration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'glpi')
    .eq('is_active', true)
    .single();

  if (!glpiIntegration) {
    return `❌ *RELATÓRIO GLPI*\n\nGLPI não configurado para este usuário.`;
  }

  // Simular dados do GLPI (aqui você faria a chamada real para a API do GLPI)
  const glpiSummary = {
    openTickets: 15,
    newTickets: 3,
    assignedTickets: 8,
    pendingTickets: 4,
    urgentTickets: 2
  };

  let message = `🎫 *RELATÓRIO AUTOMÁTICO - GLPI*\n\n`;
  message += `📊 *Resumo dos Chamados:*\n\n`;
  message += `🔓 Chamados abertos: *${glpiSummary.openTickets}*\n`;
  message += `🆕 Novos chamados: *${glpiSummary.newTickets}*\n`;
  message += `👤 Atribuídos a você: *${glpiSummary.assignedTickets}*\n`;
  message += `⏳ Pendentes: *${glpiSummary.pendingTickets}*\n`;
  message += `🚨 Urgentes: *${glpiSummary.urgentTickets}*\n\n`;

  if (glpiSummary.urgentTickets > 0) {
    message += `⚠️ *Atenção:* Há ${glpiSummary.urgentTickets} chamado(s) urgente(s) pendente(s)!\n\n`;
  }

  message += `🕒 Relatório gerado: ${new Date().toLocaleString('pt-BR')}`;
  return message;
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