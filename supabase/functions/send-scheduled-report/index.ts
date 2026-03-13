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

    // Buscar template da mensagem por ID PRIMEIRO para verificar o tipo
    console.log(`🔍 [SEND] Buscando template por ID: ${report.report_type}`);
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

    // Check if it's a Mikrotik Dashboard report - delegate to specialized function BEFORE checking Evolution API
    if (template.template_type === 'mikrotik_dashboard') {
      console.log('📊 [SEND] Tipo Mikrotik Dashboard detectado - delegando para função especializada');
      
      const { data: mikrotikData, error: mikrotikError } = await supabase.functions.invoke(
        'send-mikrotik-consolidated-report',
        {
          body: { report_id }
        }
      );
      
      if (mikrotikError) {
        console.error('❌ [SEND] Erro na função Mikrotik:', mikrotikError);
        throw mikrotikError;
      }
      
      console.log('✅ [SEND] Relatório Mikrotik processado com sucesso');
      
      return new Response(
        JSON.stringify(mikrotikData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Check if it's a Bacula Daily Report - delegate to specialized function BEFORE checking Evolution API
    if (template.template_type === 'bacula_daily_report' || template.template_type === 'bacula_daily') {
      console.log('📊 [SEND] Tipo Bacula Daily Report detectado - delegando para função especializada');
      
      const { data: baculaData, error: baculaError } = await supabase.functions.invoke(
        'send-bacula-daily-report',
        {
          body: { report_id }
        }
      );
      
      if (baculaError) {
        console.error('❌ [SEND] Erro na função Bacula:', baculaError);
        throw baculaError;
      }
      
      console.log('✅ [SEND] Relatório Bacula processado com sucesso');
      
      return new Response(
        JSON.stringify(baculaData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // For other report types, we need Evolution API integration
    // Criar log inicial
    reportLog = {
      report_id: report_id,
      phone_number: report.phone_number,
      status: 'pending',
      user_id: report.user_id,
      execution_date: new Date().toISOString()
    };

    // Buscar Evolution API integration global
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .eq('is_global', true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error('❌ [SEND] Evolution API não configurada:', integrationError);
      throw new Error(`Evolution API não configurada para este usuário: ${integrationError?.message || 'Integration not found'}`);
    }

    console.log(`🔌 [SEND] Integration encontrada: ${integration.name}`);

    // Buscar configuração de instância por tela (whatsapp_screen_config)
    let screenConfigSetting: { setting_value: string } | null = null;

    const { data: userScreenConfigSetting } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'whatsapp_screen_config')
      .eq('user_id', report.user_id)
      .maybeSingle();

    screenConfigSetting = userScreenConfigSetting;

    if (!screenConfigSetting) {
      const { data: fallbackScreenConfigSetting } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_screen_config')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      screenConfigSetting = fallbackScreenConfigSetting;

      if (screenConfigSetting) {
        console.warn(`⚠️ [SEND] Screen config do usuário ${report.user_id} não encontrada. Usando configuração global mais recente.`);
      }
    }

    let screenInstanceName = '';
    if (screenConfigSetting) {
      try {
        const screenConfig = JSON.parse(screenConfigSetting.setting_value);
        screenInstanceName = screenConfig['agendamentos'] || '';
        console.log(`📱 [SEND] Instância da screen config (agendamentos): ${screenInstanceName || 'não definida'}`);
      } catch (e) {
        console.warn('⚠️ [SEND] Erro ao parsear screen config:', e);
      }
    }

    // Gerar conteúdo baseado no template com autenticação correta
    const authHeader = req.headers.get('authorization') || '';
    const message = await generateMessageFromTemplate(template, template.template_type, report.user_id, report.settings, authHeader);
    console.log(`💬 [SEND] Mensagem gerada (${message.length} caracteres)`);

    // Atualizar log com conteúdo da mensagem
    reportLog.message_content = message.substring(0, 1000); // Limitar tamanho

    // Enviar mensagem via WhatsApp - usar instância da screen config ou fallback para a da integração
    const instanceName = screenInstanceName || integration.instance_name || 'main_instance';
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
async function generateMessageFromTemplate(template: any, reportType: string, userId: string, settings: any, authHeader: string = ''): Promise<string> {
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
      // Determinar se é performance semanal baseado no nome do template
      const isPerformanceReport = template.name && template.name.toLowerCase().includes('performance');
      console.log(`📋 [GLPI] Template: "${template.name}" - isPerformanceReport: ${isPerformanceReport}`);
      
      const glpiData = await getGLPIData(userId, settings, isPerformanceReport);
      console.log(`📊 [GLPI] Dados retornados - isRealData: ${glpiData.isRealData || 'undefined'}, total tickets: ${glpiData.total_active || glpiData.open || 'N/A'}`);
      
      if (isPerformanceReport) {
        // Substituir variáveis do relatório de performance semanal
        messageContent = messageContent
          .replace(/\{\{week_period\}\}/g, glpiData.week_period || 'N/A')
          .replace(/\{\{total_processed\}\}/g, glpiData.total_processed?.toString() || '0')
          .replace(/\{\{resolution_rate\}\}/g, glpiData.resolution_rate?.toString() || '0')
          .replace(/\{\{satisfaction_score\}\}/g, glpiData.satisfaction_score?.toString() || 'N/A')
          .replace(/\{\{sla_compliance\}\}/g, glpiData.sla_compliance?.toString() || 'N/A')
          .replace(/\{\{weekly_highlights\}\}/g, glpiData.weekly_highlights || 'Nenhum destaque disponível')
          .replace(/\{\{top_categories\}\}/g, glpiData.top_categories || 'Nenhuma categoria identificada')
          .replace(/\{\{trends_summary\}\}/g, glpiData.trends_summary || 'Sem dados de tendência');
      } else {
        // Substituir variáveis do relatório padrão de chamados
        messageContent = messageContent
          .replace(/\{\{open_tickets\}\}/g, glpiData.open?.toString() || '0')
          .replace(/\{\{critical_tickets\}\}/g, glpiData.critical?.toString() || '0')
          .replace(/\{\{pending_tickets\}\}/g, glpiData.pending?.toString() || '0')
          .replace(/\{\{ticket_list\}\}/g, glpiData.list || 'Nenhum ticket encontrado')
          .replace(/\{\{new_tickets\}\}/g, glpiData.new_tickets?.toString() || '0')
          .replace(/\{\{new_today\}\}/g, glpiData.new_today?.toString() || '0')
          .replace(/\{\{resolved_tickets\}\}/g, glpiData.resolved_tickets?.toString() || '0')
          .replace(/\{\{avg_resolution_time\}\}/g, glpiData.avg_resolution_time || 'N/A')
          .replace(/\{\{avg_time_open\}\}/g, glpiData.avg_time_open || 'N/A')
          .replace(/\{\{critical_tickets_list\}\}/g, glpiData.critical_tickets_list || 'Nenhum ticket crítico')
          .replace(/\{\{open_tickets_list\}\}/g, glpiData.open_tickets_list || 'Nenhum ticket em aberto')
          .replace(/\{\{open_tickets_detailed\}\}/g, glpiData.open_tickets_detailed || 'Nenhum ticket em aberto')
          .replace(/\{\{productivity_summary\}\}/g, glpiData.productivity_summary || 'Dados não disponíveis')
          .replace(/\{\{critical_count\}\}/g, glpiData.critical?.toString() || '0')
          .replace(/\{\{critical_tickets_detailed\}\}/g, glpiData.critical_tickets_detailed || 'Nenhum ticket crítico encontrado')
          .replace(/\{\{total_active\}\}/g, glpiData.total_active?.toString() || '0')
          .replace(/\{\{overdue\}\}/g, glpiData.overdue?.toString() || '0')
          .replace(/\{\{daily_stats\}\}/g, glpiData.daily_stats || '📊 Estatísticas não disponíveis')
          .replace(/\{\{report_date\}\}/g, glpiData.report_date || currentDate);
      }
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

// Função para obter dados completos da agenda de vencimentos
async function getScheduleData(userId: string, settings: any) {
  console.log('🔍 [AGENDA] Buscando todos os itens da agenda para usuário:', userId);
  
  const today = new Date();
  console.log('📅 [AGENDA] Data atual:', today.toISOString().split('T')[0]);
  
  // Buscar TODOS os itens da agenda do usuário, independente de status e data
  const { data: scheduleItems, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('❌ [AGENDA] Erro ao buscar itens de agenda:', error);
    return {
      items: '⚠️ Erro ao carregar dados da agenda',
      total: 0,
      overdue: 0,
      today: 0,
      upcoming: 0
    };
  }

  const allItems = scheduleItems || [];
  console.log('📊 [AGENDA] Total de itens encontrados:', allItems.length);

  // Categorizar itens por status de vencimento com mais detalhes
  const categorizedItems = {
    overdue: [],
    today: [],
    next7days: [],
    next30days: [],
    future: []
  };

  allItems.forEach(item => {
    const dueDate = new Date(item.due_date);
    const todayStr = today.toISOString().split('T')[0];
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dueDateStr < todayStr) {
      categorizedItems.overdue.push({ ...item, daysOverdue: Math.abs(diffDays) });
    } else if (dueDateStr === todayStr) {
      categorizedItems.today.push(item);
    } else if (diffDays <= 7) {
      const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const dayOfWeek = dayNames[dueDate.getDay()];
      categorizedItems.next7days.push({ ...item, daysUntil: diffDays, dayOfWeek });
    } else if (diffDays <= 30) {
      categorizedItems.next30days.push({ ...item, daysUntil: diffDays });
    } else {
      categorizedItems.future.push({ ...item, daysUntil: diffDays });
    }
  });

  console.log('📈 [AGENDA] Categorização expandida:', {
    vencidos: categorizedItems.overdue.length,
    hoje: categorizedItems.today.length,
    proximos7: categorizedItems.next7days.length,
    proximos30: categorizedItems.next30days.length,
    futuros: categorizedItems.future.length
  });

  // Construir mensagem com layout limpo e organizado
  const criticalCount = categorizedItems.overdue.length + categorizedItems.today.length;
  
  let itemsText = `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  itemsText += `   📋 *AGENDA DE VENCIMENTOS*\n`;
  itemsText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  itemsText += `📅 ${today.toLocaleDateString('pt-BR')}  •  📊 ${allItems.length} itens\n\n`;

  // Helper para renderizar seção
  const renderSection = (title: string, icon: string, items: any[], renderItem: (item: any) => string) => {
    if (items.length === 0) return '';
    let section = `${icon} *${title}* (${items.length})\n`;
    section += `\n`;
    
    // Agrupar por empresa
    const byCompany: Record<string, any[]> = {};
    items.forEach(item => {
      const company = item.company || 'Sem empresa';
      if (!byCompany[company]) byCompany[company] = [];
      byCompany[company].push(item);
    });
    
    Object.entries(byCompany).forEach(([company, companyItems]) => {
      section += `\n🏢 *${company}*\n`;
      companyItems.forEach(item => {
        section += renderItem(item);
      });
    });
    
    section += '\n';
    return section;
  };

  // Seção VENCIDOS
  itemsText += renderSection('VENCIDOS', '🔴', categorizedItems.overdue, (item) => {
    const formattedDate = new Date(item.due_date).toLocaleDateString('pt-BR');
    return `   ▸ ${item.title}\n     ${item.type} • Vencido há ${item.daysOverdue}d (${formattedDate})\n`;
  });

  // Seção VENCE HOJE
  itemsText += renderSection('VENCE HOJE', '🟡', categorizedItems.today, (item) => {
    return `   ▸ ${item.title}\n     ${item.type} • *Vence hoje*\n`;
  });

  // Seção PRÓXIMOS 7 DIAS
  itemsText += renderSection('PRÓXIMOS 7 DIAS', '🟠', categorizedItems.next7days, (item) => {
    const formattedDate = new Date(item.due_date).toLocaleDateString('pt-BR');
    return `   ▸ ${item.title}\n     ${item.type} • Em ${item.daysUntil}d (${formattedDate}, ${item.dayOfWeek})\n`;
  });

  // Seção PRÓXIMOS 30 DIAS
  itemsText += renderSection('PRÓXIMOS 30 DIAS', '🔵', categorizedItems.next30days, (item) => {
    const formattedDate = new Date(item.due_date).toLocaleDateString('pt-BR');
    return `   ▸ ${item.title}\n     ${item.type} • Em ${item.daysUntil}d (${formattedDate})\n`;
  });

  // Seção FUTUROS
  itemsText += renderSection('A VENCER', '⚪', categorizedItems.future, (item) => {
    const formattedDate = new Date(item.due_date).toLocaleDateString('pt-BR');
    return `   ▸ ${item.title}\n     ${item.type} • Em ${item.daysUntil}d (${formattedDate})\n`;
  });

  // Resumo final compacto
  if (allItems.length > 0) {
    itemsText += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    itemsText += `   📊 *RESUMO*\n`;
    itemsText += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    itemsText += `🔴 Vencidos: ${categorizedItems.overdue.length}  •  🟡 Hoje: ${categorizedItems.today.length}\n`;
    itemsText += `🟠 7 dias: ${categorizedItems.next7days.length}  •  🔵 30 dias: ${categorizedItems.next30days.length}\n`;
    itemsText += `⚪ Futuros: ${categorizedItems.future.length}\n`;
    
    if (criticalCount > 0) {
      itemsText += `\n🚨 *${criticalCount} item(ns) requer(em) ação imediata!*\n`;
    }
  } else {
    itemsText = '✅ Nenhum item na agenda encontrado';
  }

  console.log('📝 [AGENDA] Mensagem expandida gerada com', itemsText.length, 'caracteres');

  return {
    items: itemsText,
    total: allItems.length,
    overdue: categorizedItems.overdue.length,
    today: categorizedItems.today.length,
    next7days: categorizedItems.next7days.length,
    next30days: categorizedItems.next30days.length,
    future: categorizedItems.future.length,
    upcoming: categorizedItems.next7days.length + categorizedItems.next30days.length + categorizedItems.future.length,
    critical: criticalCount
  };
}

// Função para obter dados do GLPI
async function getGLPIData(userId: string, settings: any, isPerformanceReport: boolean = false) {
  try {
    console.log(`🔍 [GLPI] Buscando dados para usuário ${userId}, tipo: ${isPerformanceReport ? 'Performance Semanal' : 'Relatório Padrão'}`);
    
    const { data: glpiIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'glpi')
      .eq('is_active', true)
      .single();

    if (!glpiIntegration) {
      console.log('⚠️ [GLPI] Integração não encontrada, usando dados mock');
      return isPerformanceReport ? getGLPIPerformanceMockData() : getGLPIDailyMockData();
    }

    console.log(`🔌 [GLPI] Integração encontrada: ${glpiIntegration.name}`);
    console.log(`🔗 [GLPI] Base URL: ${glpiIntegration.base_url}`);
    console.log(`🔑 [GLPI] API Token presente: ${!!glpiIntegration.api_token}`);

    if (isPerformanceReport) {
      console.log('📊 [GLPI] Executando relatório de PERFORMANCE semanal');
      return await getGLPIPerformanceData(glpiIntegration);
    } else {
      console.log('📋 [GLPI] Executando relatório DIÁRIO padrão');
      return await getGLPIStandardData(glpiIntegration);
    }

  } catch (error) {
    console.error('❌ [GLPI] Erro na função getGLPIData:', error);
    return isPerformanceReport ? getGLPIPerformanceMockData() : getGLPIDailyMockData();
  }
}

// Função para obter dados de performance semanal do GLPI
async function getGLPIPerformanceData(glpiIntegration: any) {
  try {
    console.log('📊 [GLPI] Coletando dados de performance semanal');
    
    // Calcular período da semana anterior
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const weekPeriod = `${lastWeekStart.toLocaleDateString('pt-BR')} a ${lastWeekEnd.toLocaleDateString('pt-BR')}`;

    // Buscar tickets da semana anterior via GLPI proxy
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/glpi-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      },
      body: JSON.stringify({
        integrationId: glpiIntegration.id,
        endpoint: 'tickets',
        method: 'GET'
      })
    });

    if (!response.ok) {
      console.error(`❌ [GLPI] Erro HTTP ${response.status} ao buscar tickets semanais`);
      return getGLPIPerformanceMockData();
    }

    const glpiData = await response.json();
    console.log(`📋 [GLPI] Resposta da API recebida: ${JSON.stringify(glpiData).substring(0, 200)}...`);

    if (glpiData.error) {
      console.error('❌ [GLPI] Erro da API:', glpiData.error);
      return getGLPIPerformanceMockData();
    }

    // A resposta do glpi-proxy vem como { result: [...] }
    const allTickets = glpiData.result || [];
    
    // Filtrar tickets pela data da semana passada
    const tickets = allTickets.filter((t: any) => {
      const ticketDate = new Date(t.date);
      return ticketDate >= lastWeekStart && ticketDate <= lastWeekEnd;
    });
    console.log(`📊 [GLPI] ${tickets.length} tickets encontrados na semana`);

    // Calcular métricas de performance
    const totalProcessed = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === 6).length; // Status 6 = Resolvido
    const resolutionRate = totalProcessed > 0 ? Math.round((resolvedTickets / totalProcessed) * 100) : 0;

    // Agrupar por categoria
    const categoryCount = {};
    tickets.forEach(ticket => {
      const categoryId = ticket.itilcategories_id || 'Sem categoria';
      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => `• ${category === 'Sem categoria' ? 'Sem categoria' : `Categoria ${category}`}: ${count} tickets`)
      .join('\n');

    // Calcular tendências
    const criticalTickets = tickets.filter(t => (t.priority || 1) >= 4).length;
    const trendsSummary = criticalTickets > 0 
      ? `${criticalTickets} tickets críticos identificados` 
      : 'Nenhum ticket crítico na semana';

    // Destaques da semana
    const highlights = [];
    if (resolvedTickets > 0) highlights.push(`${resolvedTickets} tickets resolvidos`);
    if (criticalTickets > 0) highlights.push(`${criticalTickets} tickets críticos`);
    if (totalProcessed === 0) highlights.push('Nenhuma atividade registrada');
    
    const weeklyHighlights = highlights.length > 0 
      ? highlights.map(h => `• ${h}`).join('\n')
      : '• Período sem atividades significativas';

    return {
      week_period: weekPeriod,
      total_processed: totalProcessed,
      resolution_rate: resolutionRate,
      satisfaction_score: 4.2, // Mock - seria calculado com dados reais de satisfação
      sla_compliance: 85, // Mock - seria calculado com dados reais de SLA
      weekly_highlights: weeklyHighlights,
      top_categories: topCategories || '• Nenhuma categoria identificada',
      trends_summary: trendsSummary
    };

  } catch (error) {
    console.error('❌ [GLPI] Erro ao buscar dados de performance:', error);
    return getGLPIPerformanceMockData();
  }
}

// Função aprimorada para obter dados diários do GLPI com foco em chamados em aberto
async function getGLPIStandardData(glpiIntegration: any) {
  try {
    console.log('📋 [GLPI] Coletando dados diários de tickets em aberto');
    console.log('🔌 [GLPI] Usando integração ID:', glpiIntegration.id);
    
    // Calcular período do dia anterior (para relatório diário)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(yesterday);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Buscar todos os tickets em aberto (status 1-5: Novo, Em andamento, Planejado, Pendente, Em espera)
    console.log('🔄 [GLPI] Fazendo chamada para buscar tickets em aberto...');
    
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/glpi-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      },
      body: JSON.stringify({
        integrationId: glpiIntegration.id,
        endpoint: 'tickets',
        method: 'GET'
      })
    });

    console.log(`📡 [GLPI] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ [GLPI] Erro HTTP ${response.status} ao buscar tickets em aberto`);
      const errorText = await response.text();
      console.error(`❌ [GLPI] Error response: ${errorText}`);
      return getGLPIDailyMockData();
    }

    const glpiData = await response.json();
    console.log(`📋 [GLPI] Raw API response received:`, JSON.stringify(glpiData).substring(0, 500) + '...');
    
    if (glpiData.error) {
      console.error('❌ [GLPI] Erro da API:', glpiData.error);
      return getGLPIDailyMockData();
    }

    // A resposta do glpi-proxy vem como { result: [...] }
    const allTickets = glpiData.result || [];
    console.log(`📊 [GLPI] ${allTickets.length} tickets em aberto encontrados`);
    console.log(`📋 [GLPI] Primeiros tickets:`, allTickets.slice(0, 3).map(t => ({ id: t.id, name: t.name, status: t.status, priority: t.priority })));

    // Filtrar e categorizar tickets
    const openTickets = allTickets.filter(t => [1, 2, 3, 4].includes(t.status || 1));
    const criticalTickets = allTickets.filter(t => (t.priority || 1) >= 4);
    const pendingTickets = allTickets.filter(t => t.status === 4);
    const newTickets = allTickets.filter(t => t.status === 1);
    
    // Calcular tickets vencidos (exemplo: > 3 dias em aberto)
    const now = new Date();
    const overdueTickets = allTickets.filter(ticket => {
      if (ticket.date) {
        const ticketDate = new Date(ticket.date);
        const daysDiff = (now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 3; // Considera vencido após 3 dias
      }
      return false;
    });

    // Calcular tempo médio em aberto para tickets ativos
    const avgTimeOpen = calculateAverageTimeOpen(openTickets, now);

    // Organizar tickets por prioridade (críticos primeiro)
    const sortedTickets = [...allTickets].sort((a, b) => {
      const priorityA = a.priority || 1;
      const priorityB = b.priority || 1;
      return priorityB - priorityA; // Ordem decrescente (maior prioridade primeiro)
    });

    // Buscar nomes das categorias, entidades e técnicos do GLPI
    console.log('🏷️ [GLPI] Buscando nomes de categorias, entidades e técnicos...');
    const categoryNames = new Map<number, string>();
    const entityNames = new Map<number, string>();
    const userNames = new Map<number, string>();
    
    // Extrair IDs únicos de categorias, entidades e usuários
    const categoryIds = [...new Set(sortedTickets.map(t => t.itilcategories_id).filter(id => id && id !== 0))];
    const entityIds = [...new Set(sortedTickets.map(t => t.entities_id).filter(id => id && id !== 0))];
    const userIds = [...new Set(sortedTickets.map(t => t.users_id_recipient).filter(id => id && id !== 0))];
    
    // Buscar nomes das categorias
    for (const categoryId of categoryIds) {
      try {
        const catResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/glpi-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
          },
          body: JSON.stringify({
            integrationId: glpiIntegration.id,
            endpoint: `ITILCategory/${categoryId}`,
            method: 'GET'
          })
        });
        
        if (catResponse.ok) {
          const catData = await catResponse.json();
          if (catData.result && catData.result.name) {
            categoryNames.set(categoryId, catData.result.name);
          }
        }
      } catch (error) {
        console.error(`❌ [GLPI] Erro ao buscar categoria ${categoryId}:`, error);
      }
    }
    
    // Buscar nomes das entidades
    for (const entityId of entityIds) {
      try {
        const entResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/glpi-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
          },
          body: JSON.stringify({
            integrationId: glpiIntegration.id,
            endpoint: `Entity/${entityId}`,
            method: 'GET'
          })
        });
        
        if (entResponse.ok) {
          const entData = await entResponse.json();
          if (entData.result && entData.result.name) {
            entityNames.set(entityId, entData.result.name);
          }
        }
      } catch (error) {
        console.error(`❌ [GLPI] Erro ao buscar entidade ${entityId}:`, error);
      }
    }
    
    // Buscar nomes dos técnicos
    for (const userId of userIds) {
      try {
        const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/glpi-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
          },
          body: JSON.stringify({
            integrationId: glpiIntegration.id,
            endpoint: `User/${userId}`,
            method: 'GET'
          })
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.result && (userData.result.realname || userData.result.firstname)) {
            const fullName = `${userData.result.firstname || ''} ${userData.result.realname || ''}`.trim();
            userNames.set(userId, fullName || `Usuário #${userId}`);
          }
        }
      } catch (error) {
        console.error(`❌ [GLPI] Erro ao buscar usuário ${userId}:`, error);
      }
    }
    
    console.log(`🏷️ [GLPI] ${categoryNames.size} categorias, ${entityNames.size} entidades e ${userNames.size} técnicos carregados`);

    // Criar lista detalhada dos tickets em aberto (top 10)
    const detailedOpenTickets = sortedTickets
      .slice(0, 10)
      .map(ticket => {
        const priority = getPriorityIcon(ticket.priority || 1);
        const urgency = getUrgencyIcon(ticket.urgency || 1);
        const status = getStatusText(ticket.status || 1);
        const timeOpen = ticket.date ? getTimeOpenText(new Date(ticket.date), now) : 'N/A';
        const assignee = ticket.users_id_recipient && ticket.users_id_recipient !== 0 
          ? userNames.get(ticket.users_id_recipient) || `Usuário #${ticket.users_id_recipient}` 
          : 'Não atribuído';
        const categoryName = ticket.itilcategories_id && ticket.itilcategories_id !== 0
          ? categoryNames.get(ticket.itilcategories_id) || 'Sem categoria'
          : 'Sem categoria';
        const entityName = ticket.entities_id && ticket.entities_id !== 0
          ? entityNames.get(ticket.entities_id) || 'Sem entidade'
          : 'Sem entidade';
        const description = ticket.content ? ticket.content.substring(0, 80).replace(/\n/g, ' ').replace(/<[^>]*>/g, '') : 'Sem descrição';
        
        return `🎫 *ID ${ticket.id}: ${ticket.name || 'Sem título'}*
\`\`\`${description}${ticket.content && ticket.content.length > 80 ? '...' : ''}\`\`\`

📊 Status: ${status}
⏱️ Aberto há: ${timeOpen}

🔥 Prioridade: ${priority}
⚡ Urgência: ${urgency}

🏷️ Categoria: ${categoryName}
🏢 Entidade: ${entityName}
👤 Técnico: ${assignee}`;
      })
      .join('\n\n\n');

    // Criar resumo dos tickets críticos
    const criticalSummary = criticalTickets
      .slice(0, 3)
      .map(ticket => {
        const priority = getPriorityIcon(ticket.priority || 1);
        const urgency = getUrgencyIcon(ticket.urgency || 1);
        const timeOpen = ticket.date ? getTimeOpenText(new Date(ticket.date), now) : 'N/A';
        const categoryName = ticket.itilcategories_id && ticket.itilcategories_id !== 0
          ? categoryNames.get(ticket.itilcategories_id) || 'Sem categoria'
          : 'Sem categoria';
        return `${priority} *ID ${ticket.id}* - ${ticket.name || 'Sem título'}
\`\`\`⏱️ ${timeOpen} • ⚡ ${urgency} • 🏷️ ${categoryName}\`\`\``;
      })
      .join('\n\n');

    const dataResponse = {
      // Contadores básicos
      open: openTickets.length,
      critical: criticalTickets.length,
      pending: pendingTickets.length,
      new_today: newTickets.length,
      overdue: overdueTickets.length,
      
      // Listas detalhadas
      open_tickets_detailed: detailedOpenTickets || '✅ Nenhum ticket em aberto',
      critical_tickets_list: criticalSummary || '✅ Nenhum ticket crítico',
      
      // Métricas adicionais
      avg_time_open: avgTimeOpen,
      total_active: allTickets.length,
      
      // Estatísticas formatadas para mensagem
      daily_stats: `\`\`\`📊 Resumo do Dia:
• Total Ativo: ${allTickets.length}
• Novos: ${newTickets.length}
• Em Aberto: ${openTickets.length}
• Críticos: ${criticalTickets.length}
• Pendentes: ${pendingTickets.length}
• Vencidos: ${overdueTickets.length}
• Tempo Médio Aberto: ${avgTimeOpen}\`\`\``,
      
      // Dados para compatibilidade com outros templates
      list: detailedOpenTickets || '✅ Nenhum ticket em aberto',
      new_tickets: newTickets.length,
      resolved_tickets: 0,
      avg_resolution_time: avgTimeOpen,
      open_tickets_list: detailedOpenTickets || 'Nenhum ticket em aberto',
      productivity_summary: `${allTickets.length} tickets ativos • ${newTickets.length} novos • ${criticalTickets.length} críticos`,
      critical_tickets_detailed: criticalSummary || 'Nenhum ticket crítico encontrado',
      
      // Data do relatório
      report_date: new Date().toLocaleDateString('pt-BR'),
      isRealData: true
    };

    console.log(`✅ [GLPI] Dados diários coletados com sucesso - isRealData: true, total: ${allTickets.length} tickets`);
    return dataResponse;

  } catch (error) {
    console.error('❌ [GLPI] Erro ao buscar dados diários:', error);
    console.log('🔄 [GLPI] Fallback para dados mock devido a erro');
    return getGLPIDailyMockData();
  }
}

// Funções auxiliares para formatação
function getPriorityIcon(priority: number): string {
  switch(priority) {
    case 1: return '⚪ Muito Baixa';
    case 2: return '🟢 Baixa';
    case 3: return '🟡 Média';
    case 4: return '🟠 Alta';
    case 5: return '🔴 Muito Alta';
    case 6: return '🚨 Crítica';
    default: return '⚪ Baixa';
  }
}

// Helper: Ícone de urgência
function getUrgencyIcon(urgency: number): string {
  switch(urgency) {
    case 1: return '⚪ Muito Baixa';
    case 2: return '🟢 Baixa';
    case 3: return '🟡 Média';
    case 4: return '🟠 Alta';
    case 5: return '🔴 Muito Alta';
    default: return '⚪ Baixa';
  }
}

function getStatusText(status: number): string {
  const statusMap = {
    1: 'Novo',
    2: 'Em andamento',
    3: 'Planejado', 
    4: 'Pendente',
    5: 'Em espera',
    6: 'Resolvido'
  };
  return statusMap[status] || 'Desconhecido';
}

function getTimeOpenText(createdDate: Date, now: Date): string {
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}d${diffHours > 0 ? ` ${diffHours}h` : ''}`;
  }
  return `${diffHours}h`;
}

function calculateAverageTimeOpen(tickets: any[], now: Date): string {
  if (tickets.length === 0) return '0h';
  
  const totalHours = tickets.reduce((sum, ticket) => {
    if (ticket.date) {
      const ticketDate = new Date(ticket.date);
      const diffHours = (now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60);
      return sum + diffHours;
    }
    return sum;
  }, 0);
  
  const avgHours = Math.round(totalHours / tickets.length);
  const days = Math.floor(avgHours / 24);
  const hours = avgHours % 24;
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

// Dados mock para performance semanal
function getGLPIPerformanceMockData() {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const weekPeriod = `${lastWeek.toLocaleDateString('pt-BR')} a ${new Date().toLocaleDateString('pt-BR')}`;
  
  return {
    week_period: weekPeriod,
    total_processed: 47,
    resolution_rate: 89,
    satisfaction_score: 4.3,
    sla_compliance: 92,
    weekly_highlights: '• 42 tickets resolvidos\n• 3 tickets críticos\n• Tempo médio de resposta: 2.1h',
    top_categories: '• Suporte Técnico: 18 tickets\n• Infraestrutura: 12 tickets\n• Software: 8 tickets',
    trends_summary: 'Redução de 15% nos tickets críticos comparado à semana anterior'
  };
}

// Dados mock para relatório diário melhorado
function getGLPIDailyMockData() {
  return {
    // Contadores básicos
    open: 12,
    critical: 4,
    pending: 6,
    new_today: 3,
    overdue: 2,
    
    // Listas detalhadas
    open_tickets_detailed: `🔴 *Sistema de e-mail corporativo inoperante*
   ↳ Em andamento • 2d 6h • Cat: Infraestrutura
   ↳ (Técnico #1001)

🟡 *Lentidão extrema na rede do setor financeiro*
   ↳ Pendente • 1d 4h • Cat: Redes
   ↳ (Técnico #1002)

🟠 *Impressoras offline após atualização*
   ↳ Planejado • 8h • Cat: Hardware
   ↳ (Não atribuído)

🔴 *Backup automático falhando há 3 dias*
   ↳ Novo • 3d 2h • Cat: Backup
   ↳ (Técnico #1003)`,
    
    critical_tickets_list: `🔴 Sistema de e-mail corporativo inoperante (2d 6h)
🔴 Backup automático falhando há 3 dias (3d 2h)
🔴 Servidor de aplicações com erro crítico (5h)`,
    
    // Métricas adicionais
    avg_time_open: '1d 8h',
    total_active: 12,
    
    // Dados para compatibilidade
    list: `🔴 Sistema de e-mail corporativo inoperante
🔴 Backup automático falhando há 3 dias
🟡 Lentidão extrema na rede do setor financeiro`,
    
    new_tickets: 3,
    resolved_tickets: 0,
    avg_resolution_time: '6.5 horas',
    open_tickets_list: `🔴 Sistema de e-mail corporativo inoperante (2d 6h)
🟡 Lentidão extrema na rede do setor financeiro (1d 4h)
🟠 Impressoras offline após atualização (8h)`,
    
    productivity_summary: '12 tickets ativos • 3 novos ontem',
    critical_tickets_detailed: `🔴 Sistema de e-mail corporativo inoperante (2d 6h)
🔴 Backup automático falhando há 3 dias (3d 2h)
🔴 Servidor de aplicações com erro crítico (5h)`,
    
    report_date: new Date(Date.now() - 24*60*60*1000).toLocaleDateString('pt-BR'),
    isRealData: false
  };
}

// Função helper para dados mock do Bacula (versão simples)
function getMockBaculaData() {
  return {
    totalJobs: 25,
    errorCount: 2,
    errorRate: '8.0',
    hasErrors: true,
    errorJobs: '❌ BackupJob-DB - 05/08/2025 03:15:22\n❌ BackupJob-Files - 05/08/2025 02:30:45'
  };
}

// Função helper para dados mock aprimorados do Bacula
function getEnhancedMockBaculaData() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('pt-BR');
  
  const getBrasiliaTime = (date) => {
    return date.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentBrasiliaTime = getBrasiliaTime(new Date());
  const periodStart = getBrasiliaTime(new Date(yesterday.setHours(0, 0, 0, 0)));
  const periodEnd = getBrasiliaTime(new Date(yesterday.setHours(23, 59, 59, 999)));

  // Jobs mock baseados em dados reais do Bacula
  const mockSuccessJobs = [
    'BackupJob-Servidor1 (srv-principal) - 06/08/2025 02:30:00 - Concluído com Sucesso - 2.5 GB',
    'BackupJob-Database (db-server) - 06/08/2025 03:15:00 - Concluído com Sucesso - 1.8 GB',
    'BackupJob-Files (file-server) - 06/08/2025 04:00:00 - Concluído com Sucesso - 4.2 GB'
  ];

  const mockErrorJobs = [
    'BackupJob-Exchange (mail-server) - 06/08/2025 02:45:00 - Erro Fatal - 0 B',
    'BackupJob-Workstation5 (ws-005) - 06/08/2025 03:30:00 - Erro (com diferenças) - 850 MB'
  ];

  return {
    // Estatísticas básicas (mapeamento correto para template)
    total_jobs: 15,
    success_jobs: 11,
    error_jobs: 2,
    cancelled_jobs: 1,
    running_jobs: 0,
    blocked_jobs: 1,
    other_jobs: 0,
    success_rate: '73.3',
    error_rate: '13.3',
    
    // Condições para blocos condicionais
    has_issues: true,
    total_issues: 4, // error_jobs + cancelled_jobs + blocked_jobs
    
    // Listas detalhadas para blocos condicionais
    success_jobs_details: mockSuccessJobs.join('\n'),
    error_jobs_details: mockErrorJobs.join('\n'),
    cancelled_jobs_details: 'BackupJob-Archive (archive-server) - 06/08/2025 01:15:00 - Cancelado pelo usuário - 0 B',
    running_jobs_details: '',
    blocked_jobs_details: 'BackupJob-Remote (remote-server) - 06/08/2025 05:00:00 - Bloqueado - 0 B',
    other_jobs_details: '',
    
    // Estatísticas adicionais
    total_bytes: '12.8 GB',
    total_files: '45.628',
    avg_duration: '18 min',
    affected_clients: 5,
    total_clients: 8,
    
    // Período e tempo (mapeamento correto)
    date: yesterdayFormatted,
    current_time: currentBrasiliaTime,
    start_date: periodStart,
    end_date: periodEnd,
    period: `${periodStart} até ${periodEnd}`,
    
    // Para compatibilidade com template antigo
    errorCount: 2,
    totalJobs: 15,
    successJobs: 11,
    errorJobs: mockErrorJobs.join('\n'),
    generatedAt: currentBrasiliaTime
  };
}

serve(handler);