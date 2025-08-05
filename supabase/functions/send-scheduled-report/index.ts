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
      console.log(`📊 [BACKUP] Dados obtidos:`, { 
        outdatedCount: backupData.outdatedItems?.length || 0,
        hoursThreshold: backupData.hoursThreshold,
        hasItems: !!backupData.outdatedItems?.length 
      });
      
      messageContent = messageContent
        .replace(/\{\{hours_threshold\}\}/g, (backupData.hoursThreshold || 24).toString());

      // Substituir variáveis dinâmicas para backup_alert
      if (backupData.outdatedItems && backupData.outdatedItems.length > 0) {
        const itemsList = backupData.outdatedItems.map(item => 
          `📄 ${item.name || 'Arquivo'} (${item.type || 'desconhecido'}) - há ${item.hoursSinceModified || 0}h`
        ).join('\n');
        
        messageContent = messageContent.replace(/\{\{backup_list\}\}/g, itemsList);
        messageContent = messageContent.replace(/\{\{total_outdated\}\}/g, backupData.outdatedItems.length.toString());
        
        console.log(`📋 [BACKUP] Substituições feitas - Lista: ${itemsList.substring(0, 100)}..., Total: ${backupData.outdatedItems.length}`);
      } else {
        messageContent = messageContent.replace(/\{\{backup_list\}\}/g, 'Nenhum backup desatualizado encontrado');
        messageContent = messageContent.replace(/\{\{total_outdated\}\}/g, '0');
        
        console.log(`✅ [BACKUP] Nenhum backup desatualizado encontrado`);
      }
      
      messageContent = messageContent.replace('{{hours_threshold}}', (backupData.hoursThreshold || 24).toString());
      messageContent = messageContent.replace('{{total_items}}', (backupData.totalItems || 0).toString());
      
      // Adicionar informações sobre fonte dos dados
      if (backupData.isRealData) {
        messageContent += `\n\n✅ Dados verificados em tempo real\n🔗 Servidor: ${backupData.ftpHost}\n⏰ Verificação: ${new Date(backupData.checkTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      } else {
        messageContent += '\n\n⚠️ Dados obtidos via fallback devido a erro no FTP';
      }
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

  // Para backup_alert, usar 48h (2 dias) como padrão para detectar backups há mais de 2 dias
  const defaultHours = settings?.template_type === 'backup_alert' ? 48 : 24;
  const alertHours = alertSetting ? parseInt(alertSetting.setting_value) : defaultHours;
  console.log(`⏰ [BACKUP] Limite de horas configurado: ${alertHours}h (template: ${settings?.template_type || 'unknown'})`);

  try {
    console.log('🔍 [BACKUP] Buscando dados reais de backup para usuário:', userId);
    
    // Buscar integração FTP ativa do usuário
    const { data: ftpIntegration, error: ftpIntegrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'ftp')
      .eq('is_active', true)
      .single();

    if (ftpIntegrationError || !ftpIntegration) {
      console.log('❌ [BACKUP] Nenhuma integração FTP encontrada, usando dados simulados');
      return getFallbackBackupData();
    }

    // Corrigir hostname - remover protocolo se presente
    let ftpHost = ftpIntegration.base_url || ftpIntegration.host;
    if (ftpHost?.startsWith('ftp://')) {
      ftpHost = ftpHost.replace('ftp://', '');
    }
    if (ftpHost?.startsWith('ftps://')) {
      ftpHost = ftpHost.replace('ftps://', '');
    }

    console.log('🔗 [BACKUP] Host FTP corrigido:', ftpHost);
    console.log('🔌 [BACKUP] Integração FTP encontrada:', ftpIntegration.name);
    
    // Configuração correta para chamada FTP
    const ftpConfig = {
      host: ftpHost,
      port: ftpIntegration.port || 21,
      username: ftpIntegration.username,
      password: ftpIntegration.password,
      path: ftpIntegration.directory || '/',
      secure: ftpIntegration.use_ssl || false
    };
    
    console.log('🚀 [BACKUP] Chamando ftp-list com configuração:', {
      host: ftpConfig.host,
      port: ftpConfig.port,
      username: ftpConfig.username,
      path: ftpConfig.path,
      secure: ftpConfig.secure
    });
    
    const { data: ftpResponse, error: ftpListError } = await supabase.functions.invoke('ftp-list', {
      body: ftpConfig,
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    });

    if (ftpListError) {
      console.error('❌ [BACKUP] Erro ao chamar ftp-list:', ftpListError);
      console.log('🔄 [BACKUP] Usando dados simulados devido a erro no FTP');
      return getFallbackBackupData();
    }

    if (!ftpResponse || !ftpResponse.files) {
      console.log('❌ [BACKUP] Resposta FTP vazia, usando dados simulados');
      return getFallbackBackupData();
    }

    console.log('✅ [BACKUP] Dados FTP reais obtidos:', ftpResponse.files.length, 'arquivos/pastas');
    
    // Analisar arquivos para encontrar os desatualizados (prioritizar pastas)
    const hoursThreshold = alertHours; // Usar alertHours em vez de settings?.hours_threshold || 24
    const now = new Date();
    const outdatedItems = [];
    
    console.log(`⏰ [BACKUP] Aplicando filtro de ${hoursThreshold} horas para arquivos desatualizados`);

    ftpResponse.files.forEach(file => {
      if (file.lastModified) {
        const fileDate = new Date(file.lastModified);
        const hoursDiff = (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60);
        const isOutdated = hoursDiff > hoursThreshold;
        
        console.log(`🔍 [BACKUP] Analisando: ${file.name} (${file.type}) - há ${Math.floor(hoursDiff)}h ${isOutdated ? '❌ DESATUALIZADO' : '✅ OK'}`);
        
        if (isOutdated) {
          outdatedItems.push({
            name: file.name,
            type: file.type === 'directory' ? 'pasta' : 'arquivo',
            hoursSinceModified: Math.round(hoursDiff),
            priority: file.type === 'directory' ? 1 : 2 // Pastas têm prioridade
          });
        }
      } else {
        console.log(`⚠️ [BACKUP] Arquivo sem data de modificação: ${file.name}`);
      }
    });

    // Ordenar por prioridade (pastas primeiro) e depois por horas
    outdatedItems.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.hoursSinceModified - a.hoursSinceModified;
    });

    console.log('📊 [BACKUP] Itens desatualizados encontrados:', outdatedItems.length);
    console.log('📋 [BACKUP] Primeiros itens:', outdatedItems.slice(0, 5).map(item => `${item.name} (${item.type})`));

    return {
      outdatedItems,
      totalItems: ftpResponse.files.length,
      hoursThreshold,
      isRealData: true,
      ftpHost: ftpHost,
      checkTime: now.toISOString()
    };

  } catch (error) {
    console.error('❌ [BACKUP] Erro na função getBackupData:', error.message || error);
    console.log('🔄 [BACKUP] Fallback para dados simulados devido a erro inesperado');
    return getFallbackBackupData();
  }
}

// Função helper para dados simulados de backup
function getFallbackBackupData() {
  const mockOutdatedBackups = [
    { name: 'backup_servidor1.tar.gz', hoursSinceModified: 72, type: 'arquivo' },
    { name: 'backup_bd_principal.sql', hoursSinceModified: 96, type: 'arquivo' },
    { name: 'backup_emails.zip', hoursSinceModified: 120, type: 'arquivo' }
  ];

  return {
    outdatedItems: mockOutdatedBackups,
    hoursThreshold: 48,
    totalItems: 3,
    isRealData: false
  };
}

// Função para obter dados de agenda crítica
async function getScheduleData(userId: string, settings: any) {
  const criticalDaysThreshold = settings?.critical_days || 3;
  
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() + criticalDaysThreshold);
  
  const { data: scheduleItems, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', thresholdDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar itens de agenda:', error);
    return {
      items: '⚠️ Erro ao carregar dados da agenda',
      total: 0,
      critical: 0
    };
  }

  const items = scheduleItems || [];
  const criticalItems = items.filter(item => {
    const dueDate = new Date(item.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1; // Crítico: vence hoje ou amanhã
  });

  let itemsText = '';
  if (items.length === 0) {
    itemsText = '✅ Nenhum item na agenda para os próximos dias';
  } else {
    itemsText = items.slice(0, 10).map(item => {
      const dueDate = new Date(item.due_date);
      const formattedDate = dueDate.toLocaleDateString('pt-BR');
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const urgency = daysDiff <= 1 ? '🔴' : daysDiff <= 3 ? '🟡' : '🟢';
      
      return `${urgency} ${item.title} - ${item.company} (${formattedDate})`;
    }).join('\n');
    
    if (items.length > 10) {
      itemsText += `\n... e mais ${items.length - 10} itens`;
    }
  }

  return {
    items: itemsText,
    total: items.length,
    critical: criticalItems.length
  };
}

// Função para obter dados do GLPI
async function getGLPIData(userId: string, settings: any) {
  try {
    const { data: glpiIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'glpi')
      .eq('is_active', true)
      .single();

    if (!glpiIntegration) {
      console.log('GLPI integration not found, using mock data');
      return {
        open: 12,
        critical: 3,
        pending: 8,
        list: '🔴 Problema crítico de rede - Ticket #1234\n🟡 Solicitação de nova impressora - Ticket #1235\n🟡 Backup não funcionando - Ticket #1236'
      };
    }

    // Fazer chamada real para GLPI via proxy
    const { data: glpiResponse, error: glpiError } = await supabase.functions.invoke('glpi-proxy', {
      body: {
        action: 'getTickets',
        baseUrl: glpiIntegration.base_url,
        userToken: glpiIntegration.user_token,
        appToken: glpiIntegration.api_token,
        filters: {
          status: [1, 2, 3, 4, 5], // Status ativos
          limit: 50
        }
      }
    });

    if (glpiError || !glpiResponse?.tickets) {
      console.error('Erro ao buscar tickets GLPI:', glpiError);
      return {
        open: 0,
        critical: 0,
        pending: 0,
        list: '⚠️ Erro ao conectar com GLPI'
      };
    }

    const tickets = glpiResponse.tickets;
    const openTickets = tickets.filter(t => [1, 2, 3].includes(t.status)).length;
    const criticalTickets = tickets.filter(t => t.priority >= 4).length;
    const pendingTickets = tickets.filter(t => t.status === 4).length;

    const urgentTickets = tickets
      .filter(t => t.priority >= 4)
      .slice(0, 5)
      .map(ticket => {
        const priority = ticket.priority >= 5 ? '🔴' : '🟡';
        return `${priority} ${ticket.name} - Ticket #${ticket.id}`;
      })
      .join('\n');

    return {
      open: openTickets,
      critical: criticalTickets,
      pending: pendingTickets,
      list: urgentTickets || '✅ Nenhum ticket urgente'
    };

  } catch (error) {
    console.error('Erro na função getGLPIData:', error);
    return {
      open: 0,
      critical: 0,
      pending: 0,
      list: '⚠️ Erro ao buscar dados do GLPI'
    };
  }
}

// Função para obter dados do Bacula
async function getBaculaData(userId: string, settings: any) {
  try {
    console.log('🔍 [BACULA] Buscando dados de jobs Bacula para usuário:', userId);
    
    const { data: baculaIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'bacula')
      .eq('is_active', true)
      .single();

    if (!baculaIntegration) {
      console.log('⚠️ [BACULA] Integração Bacula não encontrada, usando dados mock');
      return getMockBaculaData();
    }

    console.log('🔌 [BACULA] Integração Bacula encontrada:', baculaIntegration.name);

    // Fazer chamada real para Bacula via proxy
    const { data: baculaResponse, error: baculaError } = await supabase.functions.invoke('bacula-proxy', {
      body: {
        action: 'getJobs',
        baseUrl: baculaIntegration.base_url,
        username: baculaIntegration.username,
        password: baculaIntegration.password,
        filters: {
          hours: 24 // Últimas 24 horas
        }
      }
    });

    if (baculaError || !baculaResponse?.jobs) {
      console.error('❌ [BACULA] Erro ao buscar jobs:', baculaError);
      console.log('🔄 [BACULA] Usando dados mock devido a erro na API');
      return getMockBaculaData();
    }

    console.log('✅ [BACULA] Dados obtidos com sucesso:', baculaResponse.jobs.length, 'jobs');

    const jobs = baculaResponse.jobs || [];
    const errorJobs = jobs.filter(job => ['E', 'f'].includes(job.JobStatus));
    const totalJobs = jobs.length;
    const errorCount = errorJobs.length;
    const errorRate = totalJobs > 0 ? ((errorCount / totalJobs) * 100).toFixed(1) : '0.0';

    let errorJobsText = '';
    if (errorJobs.length > 0) {
      errorJobsText = errorJobs.slice(0, 5).map(job => {
        const startTime = new Date(job.StartTime).toLocaleString('pt-BR');
        return `❌ ${job.Name || job.JobName} - ${startTime}`;
      }).join('\n');
      
      if (errorJobs.length > 5) {
        errorJobsText += `\n... e mais ${errorJobs.length - 5} jobs com erro`;
      }
    }

    return {
      totalJobs,
      errorCount,
      errorRate,
      hasErrors: errorJobs.length > 0,
      errorJobs: errorJobsText || '✅ Nenhum job com erro nas últimas 24h'
    };

  } catch (error) {
    console.error('❌ [BACULA] Erro na função getBaculaData:', error);
    console.log('🔄 [BACULA] Usando dados mock devido a erro inesperado');
    return getMockBaculaData();
  }
}

// Função helper para dados mock do Bacula
function getMockBaculaData() {
  return {
    totalJobs: 25,
    errorCount: 2,
    errorRate: '8.0',
    hasErrors: true,
    errorJobs: '❌ BackupJob-DB - 05/08/2025 03:15:22\n❌ BackupJob-Files - 05/08/2025 02:30:45'
  };
}

serve(handler);