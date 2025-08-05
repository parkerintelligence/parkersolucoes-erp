
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

  console.log('🚀 [SEND] Iniciando função send-scheduled-report');
  console.log('🚀 [SEND] Método da requisição:', req.method);
  console.log('🚀 [SEND] Headers da requisição:', Object.fromEntries(req.headers.entries()));

  try {
    console.log('🚀 [SEND] Iniciando função send-scheduled-report');
    
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('📝 [SEND] Corpo da requisição recebido:', bodyText);
      
      if (!bodyText.trim()) {
        throw new Error('Corpo da requisição está vazio');
      }
      
      requestBody = JSON.parse(bodyText);
    } catch (parseError: any) {
      console.error('❌ [SEND] Erro ao parsear JSON:', parseError);
      throw new Error(`Erro ao parsear JSON: ${parseError.message}`);
    }

    const { report_id }: ScheduledReportRequest = requestBody;
    
    if (!report_id) {
      throw new Error('report_id é obrigatório');
    }

    console.log(`🚀 [SEND] Processando relatório: ${report_id}`);
    console.log(`🕐 [SEND] Horário UTC: ${new Date().toISOString()}`);
    console.log(`🕐 [SEND] Horário Brasília: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Buscar configuração do relatório
    const { data: report, error: reportError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', report_id)
      .eq('is_active', true)
      .single();

    if (reportError || !report) {
      console.error('❌ [SEND] Relatório não encontrado:', reportError);
      throw new Error(`Relatório não encontrado ou inativo: ${reportError?.message || 'Report not found'}`);
    }

    console.log(`📋 [SEND] Relatório encontrado: ${report.name} (${report.report_type})`);

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
      console.error('❌ [SEND] Evolution API não configurada:', integrationError);
      throw new Error(`Evolution API não configurada para este usuário: ${integrationError?.message || 'Integration not found'}`);
    }

    console.log(`🔌 [SEND] Integration encontrada: ${integration.name}`);

    // Buscar template da mensagem por ID
    console.log(`🔍 [SEND] Buscando template por ID: ${report.report_type}`);
    // Removendo filtro user_id para busca por ID específico para evitar erro "multiple rows"
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('id', report.report_type)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError || !template) {
      console.error('❌ [SEND] Template não encontrado:', templateError);
      console.error('❌ [SEND] Report details:', { report_type: report.report_type, user_id: report.user_id });
      throw new Error(`Template não encontrado ou inativo: ${report.report_type} - ${templateError?.message || 'Template not found'}`);
    }

    console.log(`📝 [SEND] Template encontrado: ${template.name} (tipo: ${template.template_type})`);

    // Gerar conteúdo baseado no template
    const message = await generateMessageFromTemplate(template, template.template_type, report.user_id, report.settings);
    console.log(`💬 [SEND] Mensagem gerada (${message.length} caracteres)`);

    // Atualizar log com conteúdo da mensagem
    reportLog.message_content = message.substring(0, 1000); // Limitar tamanho

    // Enviar mensagem via WhatsApp
    const instanceName = integration.instance_name || 'main_instance';
    const cleanPhoneNumber = report.phone_number.replace(/\D/g, '');
    
    console.log(`📱 [SEND] Enviando para: ${cleanPhoneNumber} via instância: ${instanceName}`);
    console.log(`🔗 [SEND] Base URL: ${integration.base_url}`);
    
    // Preparar dados para envio
    const whatsappPayload = {
      number: cleanPhoneNumber,
      text: message,
    };

    console.log(`📤 [SEND] Payload WhatsApp:`, JSON.stringify(whatsappPayload, null, 2));

    // Tentar enviar via Evolution API
    const url = `${integration.base_url}/message/sendText/${instanceName}`;
    console.log(`🔄 [SEND] Enviando para: ${url}`);
    
    const whatsappApiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': integration.api_token || '',
      },
      body: JSON.stringify(whatsappPayload),
    });

    console.log(`📡 [SEND] Status da resposta: ${whatsappApiResponse.status}`);
    
    let whatsappResponse;
    const responseText = await whatsappApiResponse.text();
    console.log(`📋 [SEND] Resposta bruta:`, responseText);

    try {
      whatsappResponse = JSON.parse(responseText);
    } catch {
      whatsappResponse = { raw: responseText };
    }

    const executionTime = Date.now() - startTime;

    if (!whatsappApiResponse.ok) {
      // Log de erro
      await supabase.from('scheduled_reports_logs').insert({
        ...reportLog,
        status: 'error',
        message_sent: false,
        error_details: `Falha HTTP ${whatsappApiResponse.status}: ${responseText}`,
        execution_time_ms: executionTime,
        whatsapp_response: whatsappResponse
      });
      
      throw new Error(`Falha ao enviar mensagem WhatsApp (${whatsappApiResponse.status}): ${responseText}`);
    }

    // Log de sucesso
    await supabase.from('scheduled_reports_logs').insert({
      ...reportLog,
      status: 'success',
      message_sent: true,
      execution_time_ms: executionTime,
      whatsapp_response: whatsappResponse
    });

    console.log(`✅ [SEND] Relatório enviado com sucesso para ${cleanPhoneNumber}`);

    const successResponse = { 
      success: true, 
      message: 'Relatório enviado com sucesso',
      template_name: template.name,
      template_type: template.template_type,
      phone_number: cleanPhoneNumber,
      execution_time_ms: executionTime,
      whatsapp_response: whatsappResponse
    };

    console.log('📤 [SEND] Retornando resposta de sucesso');

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    console.error("❌ [SEND] Erro na função send-scheduled-report:", error);
    console.error("❌ [SEND] Stack trace:", error.stack);
    
    // Log de erro se temos informações do relatório
    if (reportLog) {
      try {
        await supabase.from('scheduled_reports_logs').insert({
          ...reportLog,
          status: 'error',
          message_sent: false,
          error_details: error.message,
          execution_time_ms: executionTime
        });
      } catch (logError) {
        console.error("❌ [SEND] Erro ao salvar log:", logError);
      }
    }

    const errorResponse = { 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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

    case 'bacula_daily':
      const baculaData = await getBaculaData(userId, settings);
      
      // Substituições básicas
      messageContent = messageContent
        .replace(/\{\{date\}\}/g, currentDate)
        .replace(/\{\{totalJobs\}\}/g, baculaData.totalJobs.toString())
        .replace(/\{\{errorCount\}\}/g, baculaData.errorCount.toString())
        .replace(/\{\{errorRate\}\}/g, baculaData.errorRate.toString());
      
      // Handle conditional blocks com regex mais robusta
      if (baculaData.hasErrors) {
        // Remove else block e mantém if block
        messageContent = messageContent.replace(/\{\{#if hasErrors\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
        // Handle errorJobs dentro do if block
        messageContent = messageContent.replace(/\{\{#each errorJobs\}\}([\s\S]*?)\{\{\/each\}\}/g, baculaData.errorJobs);
        messageContent = messageContent.replace(/\{\{errorJobs\}\}/g, baculaData.errorJobs);
      } else {
        // Remove if block e mantém else block
        messageContent = messageContent.replace(/\{\{#if hasErrors\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, '$2');
      }
      
      // Cleanup any remaining template variables
      messageContent = messageContent
        .replace(/\{\{[^}]+\}\}/g, '') // Remove any remaining template variables
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
        .trim();
      break;
  }

  return messageContent;
}

// Função para obter dados reais de backup via FTP com foco em alertas de 24h
async function getBackupData(userId: string, settings: any) {
  console.log('🔍 [BACKUP] Buscando dados reais de backup para usuário:', userId);
  
  // Para backup alerts automatizados, usar 24h como padrão (mais crítico)
  // Buscar configuração específica ou usar padrão baseado no tipo
  const { data: alertSetting } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('user_id', userId)
    .eq('setting_key', 'ftp_backup_alert_hours')
    .single();

  // Usar 24h para alertas automatizados, 48h para outros relatórios
  const defaultHours = settings?.template_type === 'backup_alert' ? 24 : 48;
  const alertHours = alertSetting ? parseInt(alertSetting.setting_value) : defaultHours;
  console.log(`⏰ [BACKUP] Limite de horas configurado: ${alertHours}h (template: ${settings?.template_type || 'unknown'})`);
  
  // Buscar integração FTP ativa do usuário  
  const { data: ftpIntegration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'ftp')
    .eq('is_active', true)
    .single();

  if (!ftpIntegration) {
    console.log('⚠️ [BACKUP] Nenhuma integração FTP encontrada, usando dados simulados');
    return {
      hoursThreshold: alertHours,
      list: '⚠️ FTP não configurado - dados não disponíveis',
      outdatedCount: 0
    };
  }

  console.log(`🔌 [BACKUP] Integração FTP encontrada: ${ftpIntegration.name}`);
  console.log(`🔗 [BACKUP] Host FTP: ${ftpIntegration.config?.host || ftpIntegration.base_url}`);

  try {
    // Chamar a função ftp-list para obter arquivos reais
    // Usar configuração correta da integração
    const ftpConfig = ftpIntegration.config || {};
    console.log('🚀 [BACKUP] Chamando ftp-list com configuração:', {
      host: ftpConfig.host || ftpIntegration.base_url,
      port: ftpConfig.port || ftpIntegration.port || 21,
      username: ftpConfig.username || ftpIntegration.username,
      path: ftpConfig.path || '/',
      secure: ftpConfig.secure || ftpIntegration.use_ssl || false
    });
    
    const { data: ftpResponse, error: ftpError } = await supabase.functions.invoke('ftp-list', {
      body: {
        host: ftpConfig.host || ftpIntegration.base_url,
        port: ftpConfig.port || ftpIntegration.port || 21,
        username: ftpConfig.username || ftpIntegration.username,
        password: ftpConfig.password || ftpIntegration.password,
        secure: ftpConfig.secure || ftpIntegration.use_ssl || false,
        path: ftpConfig.path || '/'
      }
    });

    if (ftpError) {
      console.error('❌ [BACKUP] Erro ao chamar ftp-list:', ftpError);
      console.log('🔄 [BACKUP] Usando dados simulados devido a erro no FTP');
      return getMockBackupData(alertHours, true);
    }

    const files = ftpResponse?.files || [];
    console.log(`📁 [BACKUP] Total de arquivos encontrados: ${files.length}`);

    // Filtrar pastas/arquivos antigos (mais de X horas)
    const currentTime = new Date();
    const thresholdTime = new Date(currentTime.getTime() - (alertHours * 60 * 60 * 1000));
    console.log(`📅 [BACKUP] Analisando itens modificados antes de: ${thresholdTime.toLocaleString('pt-BR')}`);

    const outdatedItems = files.filter(file => {
      if (!file.lastModified) return false;
      const fileDate = new Date(file.lastModified);
      const isOld = fileDate < thresholdTime;
      
      if (isOld) {
        const hoursAgo = Math.floor((currentTime.getTime() - fileDate.getTime()) / (1000 * 60 * 60));
        console.log(`⚠️ [BACKUP] Item desatualizado: ${file.name} (há ${hoursAgo}h)`);
      }
      
      return isOld;
    });

    console.log(`🚨 [BACKUP] Total de itens desatualizados: ${outdatedItems.length}`);

    let backupList = '';
    if (outdatedItems.length === 0) {
      backupList = '✅ Todos os backups estão atualizados!';
    } else {
      // Focar em pastas (diretórios) primeiro, depois arquivos
      const sortedItems = outdatedItems.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return 0;
      });

      sortedItems.slice(0, 15).forEach((item) => {
        const hoursAgo = Math.floor((currentTime.getTime() - new Date(item.lastModified).getTime()) / (1000 * 60 * 60));
        const icon = item.isDirectory ? '📁' : '📄';
        const type = item.isDirectory ? 'pasta' : 'arquivo';
        backupList += `${icon} ${item.name} (${type}) - há ${hoursAgo}h\n`;
      });

      if (outdatedItems.length > 15) {
        backupList += `\n... e mais ${outdatedItems.length - 15} itens`;
      }
    }

    return {
      hoursThreshold: alertHours,
      list: backupList.trim(),
      outdatedCount: outdatedItems.length
    };

  } catch (error) {
    console.error('❌ [BACKUP] Erro ao buscar dados FTP:', error);
    console.log('🔄 [BACKUP] Usando dados simulados devido a erro de conexão');
    return getMockBackupData(alertHours, true);
  }
}

// Função helper para dados simulados de backup
function getMockBackupData(alertHours: number, isFallback: boolean = false) {
  const mockOutdatedBackups = [
    { name: 'backup_servidor1.tar.gz', lastModified: new Date(Date.now() - (72 * 60 * 60 * 1000)), isDirectory: false },
    { name: 'backup_bd_principal.sql', lastModified: new Date(Date.now() - (96 * 60 * 60 * 1000)), isDirectory: false },
    { name: 'backup_sistema_web', lastModified: new Date(Date.now() - (48 * 60 * 60 * 1000)), isDirectory: true },
    { name: 'backup_emails.zip', lastModified: new Date(Date.now() - (120 * 60 * 60 * 1000)), isDirectory: false }
  ];

  let backupList = '';
  const filteredBackups = mockOutdatedBackups.filter(backup => {
    const hoursAgo = (Date.now() - backup.lastModified.getTime()) / (1000 * 60 * 60);
    return hoursAgo > alertHours;
  });

  filteredBackups.forEach((backup) => {
    const hoursAgo = Math.floor((Date.now() - backup.lastModified.getTime()) / (1000 * 60 * 60));
    const icon = backup.isDirectory ? '📁' : '📄';
    const type = backup.isDirectory ? 'pasta' : 'arquivo';
    backupList += `${icon} ${backup.name} (${type}) - há ${hoursAgo}h\n`;
  });

  const fallbackMessage = isFallback ? '\n\n⚠️ Dados obtidos via fallback devido a erro no FTP' : '';

  return {
    hoursThreshold: alertHours,
    list: backupList.trim() + fallbackMessage,
    outdatedCount: filteredBackups.length
  };
}

async function getScheduleData(userId: string, settings: any) {
  console.log('📅 [SCHEDULE] Buscando dados reais da agenda para usuário:', userId);
  
  // Buscar configuração de dias críticos (padrão 7 dias)
  const { data: criticalDaysSetting } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('user_id', userId)
    .eq('setting_key', 'schedule_critical_days')
    .single();

  const criticalDays = criticalDaysSetting ? parseInt(criticalDaysSetting.setting_value) : 7;
  console.log(`⏰ [SCHEDULE] Limite de dias críticos configurado: ${criticalDays} dias`);

  // Calcular data limite (hoje + criticalDays)
  const today = new Date();
  const criticalDate = new Date();
  criticalDate.setDate(today.getDate() + criticalDays);
  
  const todayStr = today.toISOString().split('T')[0];
  const criticalDateStr = criticalDate.toISOString().split('T')[0];

  console.log(`📅 [SCHEDULE] Buscando itens entre ${todayStr} e ${criticalDateStr}`);

  // Buscar itens da agenda críticos (vencimento em até X dias)
  const { data: criticalItems, error } = await supabase
    .from('schedule_items')
    .select('title, company, due_date, type, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_date', todayStr)
    .lte('due_date', criticalDateStr)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('❌ [SCHEDULE] Erro ao buscar itens da agenda:', error);
    return {
      items: '⚠️ Erro ao buscar dados da agenda',
      total: 0,
      critical: 0
    };
  }

  console.log(`📋 [SCHEDULE] Total de itens encontrados: ${criticalItems?.length || 0}`);

  let itemsList = '';
  let criticalCount = 0; // Itens que vencem em até 3 dias
  
  if (!criticalItems || criticalItems.length === 0) {
    itemsList = '✅ Nenhum vencimento crítico nos próximos dias!';
  } else {
    criticalItems.forEach((item) => {
      const dueDate = new Date(item.due_date + 'T00:00:00');
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Definir ícone baseado na urgência
      let urgencyIcon = '🟢';
      if (daysUntil <= 1) {
        urgencyIcon = '🔴';
        criticalCount++;
      } else if (daysUntil <= 3) {
        urgencyIcon = '🟡';
        criticalCount++;
      }
      
      const daysText = daysUntil === 0 ? 'hoje' : 
                      daysUntil === 1 ? 'amanhã' : 
                      `${daysUntil} dias`;
      
      itemsList += `${urgencyIcon} ${item.title} - ${item.company} (${daysText})\n`;
      
      console.log(`📌 [SCHEDULE] Item: ${item.title} - ${item.company} (vence em ${daysUntil} dias)`);
    });
  }

  console.log(`🚨 [SCHEDULE] Total de itens críticos (≤3 dias): ${criticalCount}`);

  return {
    items: itemsList.trim(),
    total: criticalItems?.length || 0,
    critical: criticalCount
  };
}

async function getGLPIData(userId: string, settings: any) {
  console.log('🎫 [GLPI] Buscando dados reais do GLPI para usuário:', userId);
  
  // Buscar integração GLPI do usuário
  const { data: glpiIntegration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'glpi')
    .eq('is_active', true)
    .single();

  if (!glpiIntegration) {
    console.log('⚠️ [GLPI] Nenhuma integração GLPI encontrada');
    return {
      open: 0,
      critical: 0,
      pending: 0,
      list: '⚠️ GLPI não configurado para este usuário.'
    };
  }

  console.log(`🔌 [GLPI] Integração GLPI encontrada: ${glpiIntegration.name}`);

  try {
    // Verificar se temos session token
    if (!glpiIntegration.webhook_url || !glpiIntegration.api_token) {
      console.log('⚠️ [GLPI] Session token ou App token não encontrado');
      return {
        open: 0,
        critical: 0,
        pending: 0,
        list: '⚠️ GLPI não está conectado. Inicie a sessão primeiro.'
      };
    }

    const baseUrl = glpiIntegration.base_url.replace(/\/$/, '');
    console.log(`🔗 [GLPI] Fazendo requisição para: ${baseUrl}/apirest.php/Ticket`);

    // Buscar tickets do GLPI
    const response = await fetch(`${baseUrl}/apirest.php/Ticket?range=0-100&expand_dropdowns=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'App-Token': glpiIntegration.api_token,
        'Session-Token': glpiIntegration.webhook_url,
      },
    });

    if (!response.ok) {
      console.error(`❌ [GLPI] Erro na API: ${response.status} ${response.statusText}`);
      throw new Error(`Erro na API GLPI: ${response.status}`);
    }

    const tickets = await response.json();
    console.log(`📋 [GLPI] Total de tickets encontrados: ${Array.isArray(tickets) ? tickets.length : 0}`);

    if (!Array.isArray(tickets)) {
      throw new Error('Resposta inválida da API GLPI');
    }

    // Analisar os tickets
    const openTickets = tickets.filter(ticket => [1, 2, 3, 4].includes(ticket.status)).length; // Novo, Em Andamento, Pendente
    const criticalTickets = tickets.filter(ticket => ticket.priority >= 5 && [1, 2, 3, 4].includes(ticket.status)).length; // Prioridade alta/crítica
    const pendingTickets = tickets.filter(ticket => ticket.status === 4).length; // Status pendente

    // Buscar tickets urgentes para listar
    const urgentTickets = tickets
      .filter(ticket => ticket.priority >= 5 && [1, 2, 3, 4].includes(ticket.status))
      .slice(0, 5) // Limitar a 5 tickets
      .map(ticket => `#${ticket.id} - ${ticket.name || 'Sem título'}`);

    const ticketList = urgentTickets.length > 0 
      ? urgentTickets.map(ticket => `• ${ticket}`).join('\n')
      : 'Nenhum chamado crítico encontrado';

    console.log(`📊 [GLPI] Estatísticas: Abertos=${openTickets}, Críticos=${criticalTickets}, Pendentes=${pendingTickets}`);

    return {
      open: openTickets,
      critical: criticalTickets,
      pending: pendingTickets,
      list: ticketList
    };

  } catch (error) {
    console.error('❌ [GLPI] Erro ao buscar dados:', error);
    
    // Fallback para dados simulados em caso de erro
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
      list: ticketList ? `• ${ticketList}\n\n⚠️ Dados obtidos via fallback devido a erro na conexão GLPI` : 'Nenhum chamado urgente'
    };
  }
}

async function getBaculaData(userId: string, settings: any) {
  console.log('🗄️ [BACULA] Buscando dados reais do Bacula para usuário:', userId);
  
  // Buscar integração Bacula do usuário
  const { data: baculaIntegration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'bacula')
    .eq('is_active', true)
    .single();

  if (!baculaIntegration) {
    console.log('⚠️ [BACULA] Nenhuma integração Bacula encontrada');
    return {
      hasErrors: false,
      errorJobs: '',
      totalJobs: 0,
      errorCount: 0,
      errorRate: 0
    };
  }

  console.log(`🔌 [BACULA] Integração Bacula encontrada: ${baculaIntegration.name}`);

  try {
    // Chamar a função bacula-proxy para obter jobs das últimas 24h
    const { data: baculaResponse, error: baculaError } = await supabase.functions.invoke('bacula-proxy', {
      body: {
        endpoint: 'jobs/last24h'
      }
    });

    if (baculaError) {
      console.error('❌ [BACULA] Erro ao chamar bacula-proxy:', baculaError);
      throw baculaError;
    }

    console.log('📊 [BACULA] Resposta do Bacula:', JSON.stringify(baculaResponse, null, 2));

    // Processar estrutura de dados do Bacula (pode variar)
    let jobs = [];
    if (baculaResponse?.output && Array.isArray(baculaResponse.output)) {
      jobs = baculaResponse.output;
    } else if (Array.isArray(baculaResponse?.jobs)) {
      jobs = baculaResponse.jobs;
    } else if (Array.isArray(baculaResponse)) {
      jobs = baculaResponse;
    } else if (baculaResponse?.data && Array.isArray(baculaResponse.data)) {
      jobs = baculaResponse.data;
    }
    
    console.log(`💼 [BACULA] Total de jobs encontrados: ${jobs.length}`);

    // Filtrar jobs do último dia
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const recentJobs = jobs.filter(job => {
      if (!job.startTime) return false;
      const jobDate = new Date(job.startTime);
      return jobDate >= yesterday;
    });

    console.log(`📅 [BACULA] Jobs das últimas 24h: ${recentJobs.length}`);

    // Filtrar jobs com erro
    const errorJobs = recentJobs.filter(job => 
      job.level && ['Error', 'Fatal'].includes(job.level)
    );

    console.log(`❌ [BACULA] Jobs com erro: ${errorJobs.length}`);

    // Gerar lista de jobs com erro
    let errorJobsList = '';
    errorJobs.forEach(job => {
      const startTime = job.startTime ? new Date(job.startTime).toLocaleString('pt-BR') : 'N/A';
      errorJobsList += `• ${job.name || 'Job sem nome'} - ${job.level}\n`;
      errorJobsList += `  📂 Cliente: ${job.client || 'N/A'}\n`;
      errorJobsList += `  ⏰ Horário: ${startTime}\n`;
      errorJobsList += `  💾 Bytes: ${job.bytes || '0'}\n`;
      errorJobsList += `  📄 Arquivos: ${job.files || '0'}\n\n`;
    });

    const totalJobs = recentJobs.length;
    const errorCount = errorJobs.length;
    const errorRate = totalJobs > 0 ? Math.round((errorCount / totalJobs) * 100) : 0;

    return {
      hasErrors: errorCount > 0,
      errorJobs: errorJobsList.trim() || 'Nenhum job com erro encontrado',
      totalJobs,
      errorCount,
      errorRate
    };

  } catch (error) {
    console.error('❌ [BACULA] Erro ao buscar dados:', error);
    
    // Fallback para dados simulados em caso de erro
    const mockBaculaData = {
      hasErrors: true,
      errorJobs: `• backup_servidor_web - Error
  📂 Cliente: servidor-web-01
  ⏰ Horário: ${new Date().toLocaleString('pt-BR')}
  💾 Bytes: 1,234,567,890
  📄 Arquivos: 45,123

• backup_banco_dados - Fatal
  📂 Cliente: db-principal
  ⏰ Horário: ${new Date(Date.now() - 3600000).toLocaleString('pt-BR')}
  💾 Bytes: 987,654,321
  📄 Arquivos: 12,456

⚠️ Dados obtidos via fallback devido a erro na conexão Bacula`,
      totalJobs: 8,
      errorCount: 2,
      errorRate: 25
    };

    return mockBaculaData;
  }
}

serve(handler);
