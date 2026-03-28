import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const formatSizeGb = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2);

const normalizeFtpHost = (value: string | null | undefined) =>
  (value || '')
    .replace(/^(ftp:\/\/|ftps:\/\/|http:\/\/|https:\/\/)/, '')
    .replace(/\/$/, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { report_id } = await req.json();

    if (!report_id || typeof report_id !== 'string') {
      throw new Error('report_id é obrigatório');
    }

    const { data: report, error: reportError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', report_id)
      .eq('is_active', true)
      .single();

    if (reportError || !report) {
      throw new Error(`Relatório não encontrado ou inativo: ${reportError?.message || 'Report not found'}`);
    }

    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('id', report.report_type)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError || !template) {
      throw new Error(`Template não encontrado ou inativo: ${report.report_type}`);
    }

    if (template.template_type !== 'ftp_backup_summary') {
      throw new Error(`Template incompatível com resumo FTP: ${template.template_type}`);
    }

    const reportLog = {
      report_id,
      phone_number: report.phone_number,
      status: 'pending',
      user_id: report.user_id,
      execution_date: new Date().toISOString(),
    };

    const { data: ftpIntegrations, error: ftpIntegrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'ftp')
      .eq('is_active', true)
      .or(`user_id.eq.${report.user_id},is_global.eq.true`)
      .order('is_global', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1);

    if (ftpIntegrationError || !ftpIntegrations?.length) {
      throw new Error(`Integração FTP não encontrada: ${ftpIntegrationError?.message || 'sem integração ativa'}`);
    }

    const ftpIntegration = ftpIntegrations[0];
    const ftpHost = normalizeFtpHost(ftpIntegration.base_url);

    if (!ftpHost) {
      throw new Error('Host FTP inválido ou não configurado');
    }

    const { data: ftpResponse, error: ftpError } = await supabase.functions.invoke('ftp-list', {
      body: {
        host: ftpHost,
        port: ftpIntegration.port || 21,
        username: ftpIntegration.username || 'anonymous',
        password: ftpIntegration.password || '',
        secure: ftpIntegration.use_ssl || false,
        path: ftpIntegration.directory || '/',
        passive: ftpIntegration.passive_mode !== false,
        calculateSizes: true,
      },
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    });

    if (ftpError) {
      throw new Error(`Erro ao consultar FTP: ${ftpError.message}`);
    }

    const directories = Array.isArray(ftpResponse?.files)
      ? ftpResponse.files
          .filter((file: any) => file?.isDirectory || file?.type === 'directory')
          .map((file: any) => ({
            name: String(file.name || 'Pasta sem nome'),
            size: Number(file.size || 0),
            lastModified: file.lastModified,
          }))
          .sort((a: any, b: any) => b.size - a.size)
      : [];

    const totalBytes = directories.reduce((sum: number, folder: any) => sum + folder.size, 0);
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const generatedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const foldersSummary = directories.length > 0
      ? directories
          .map((folder: any) => {
            const modifiedAt = folder.lastModified
              ? new Date(folder.lastModified).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
              : 'sem data';
            return `📁 *${folder.name}*: ${formatSizeGb(folder.size)} GB\n   Última modificação: ${modifiedAt}`;
          })
          .join('\n\n')
      : 'Nenhuma pasta encontrada para resumir.';

    let message = String(template.body || '')
      .replace(/\{\{date\}\}/g, currentDate)
      .replace(/\{\{time\}\}/g, currentTime)
      .replace(/\{\{generated_at\}\}/g, generatedAt)
      .replace(/\{\{ftp_path\}\}/g, ftpIntegration.directory || '/')
      .replace(/\{\{folders_count\}\}/g, String(directories.length))
      .replace(/\{\{folders_total_size_gb\}\}/g, formatSizeGb(totalBytes))
      .replace(/\{\{folders_summary\}\}/g, foldersSummary);

    if (ftpResponse?.isFallback) {
      message += '\n\n⚠️ Atenção: o FTP não respondeu integralmente e o resumo foi montado com dados de fallback.';
    }

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .eq('is_global', true)
      .maybeSingle();

    if (integrationError || !integration) {
      throw new Error(`Evolution API não configurada: ${integrationError?.message || 'Integration not found'}`);
    }

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
    }

    let screenInstanceName = '';
    if (screenConfigSetting) {
      try {
        const screenConfig = JSON.parse(screenConfigSetting.setting_value);
        screenInstanceName = screenConfig['agendamentos'] || '';
      } catch (_error) {
        console.warn('⚠️ [FTP-SUMMARY] Erro ao parsear screen config');
      }
    }

    const instanceName = screenInstanceName || integration.instance_name || 'main_instance';
    const cleanPhoneNumber = report.phone_number.replace(/\D/g, '');
    const whatsappPayload = {
      number: cleanPhoneNumber,
      text: message,
    };

    const whatsappApiResponse = await fetch(`${integration.base_url}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: integration.api_token || '',
      },
      body: JSON.stringify(whatsappPayload),
    });

    const responseText = await whatsappApiResponse.text();
    let whatsappResponse: any;

    try {
      whatsappResponse = JSON.parse(responseText);
    } catch {
      whatsappResponse = { raw: responseText };
    }

    const executionTime = Date.now() - startTime;

    if (!whatsappApiResponse.ok) {
      await supabase.from('scheduled_reports_logs').insert({
        ...reportLog,
        status: 'error',
        message_sent: false,
        error_details: `Falha HTTP ${whatsappApiResponse.status}: ${responseText}`,
        execution_time_ms: executionTime,
        message_content: message.substring(0, 1000),
        whatsapp_response: whatsappResponse,
      });

      throw new Error(`Falha ao enviar mensagem WhatsApp (${whatsappApiResponse.status}): ${responseText}`);
    }

    await supabase.from('scheduled_reports_logs').insert({
      ...reportLog,
      status: 'success',
      message_sent: true,
      execution_time_ms: executionTime,
      message_content: message.substring(0, 1000),
      whatsapp_response: whatsappResponse,
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Resumo FTP enviado com sucesso',
      template_name: template.name,
      template_type: template.template_type,
      phone_number: cleanPhoneNumber,
      execution_time_ms: executionTime,
      total_folders: directories.length,
      total_size_gb: formatSizeGb(totalBytes),
      used_fallback: Boolean(ftpResponse?.isFallback),
      whatsapp_response: whatsappResponse,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});