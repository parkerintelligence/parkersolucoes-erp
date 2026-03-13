import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { formatMikrotikDashboardMessage, ClientDashboardData } from '../_shared/formatMikrotikData.ts';

console.log('🔧 [MIKROTIK-REPORT] Function loaded');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const executionId = crypto.randomUUID();
  
  console.log(`\n🚀 [MIKROTIK-REPORT] Iniciando execução ${executionId}`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    const { report_id } = await req.json();
    
    if (!report_id) {
      throw new Error('report_id é obrigatório');
    }

    console.log(`📋 [MIKROTIK-REPORT] Buscando relatório: ${report_id}`);

    // Fetch scheduled report
    const { data: report, error: reportError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError) throw reportError;
    if (!report) throw new Error('Relatório não encontrado');

    console.log(`✅ [MIKROTIK-REPORT] Relatório encontrado: ${report.name}`);
    console.log(`👤 [MIKROTIK-REPORT] User ID: ${report.user_id}`);

    // Fetch all active Mikrotik integrations (global + user's own)
    const { data: mikrotikClients, error: clientsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'mikrotik')
      .eq('is_active', true)
      .or(`is_global.eq.true,user_id.eq.${report.user_id}`);

    if (clientsError) throw clientsError;
    if (!mikrotikClients || mikrotikClients.length === 0) {
      throw new Error('Nenhum cliente Mikrotik ativo encontrado');
    }

    console.log(`🔍 [MIKROTIK-REPORT] Clientes Mikrotik encontrados: ${mikrotikClients.length}`);

    // Collect data from all clients
    const clientsData: ClientDashboardData[] = [];

    for (const client of mikrotikClients) {
      console.log(`\n📡 [MIKROTIK-REPORT] Coletando dados: ${client.name}`);
      
      const clientData: ClientDashboardData = {
        clientName: client.name,
        clientId: client.id,
      };

      try {
        // Create Basic Auth header
        const credentials = btoa(`${client.username}:${client.password}`);
        const baseUrl = `${client.base_url}/rest`;
        const headers = {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        };

        // Fetch all data with timeout
        const timeout = 30000; // 30 seconds per client
        
        const fetchWithTimeout = async (url: string) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          try {
            const response = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              console.warn(`⚠️ [MIKROTIK-REPORT] ${client.name} - Erro em ${url}: ${response.status}`);
              return null;
            }
            
            return await response.json();
          } catch (error) {
            clearTimeout(timeoutId);
            console.warn(`⚠️ [MIKROTIK-REPORT] ${client.name} - Timeout/erro em ${url}`);
            return null;
          }
        };

        // Collect all endpoints data
        console.log(`  ⏳ Coletando identity...`);
        clientData.identity = await fetchWithTimeout(`${baseUrl}/system/identity`);
        
        console.log(`  ⏳ Coletando resource...`);
        clientData.resource = await fetchWithTimeout(`${baseUrl}/system/resource`);
        
        console.log(`  ⏳ Coletando routerboard...`);
        clientData.routerboard = await fetchWithTimeout(`${baseUrl}/system/routerboard`);
        
        console.log(`  ⏳ Coletando interfaces...`);
        clientData.interfaces = await fetchWithTimeout(`${baseUrl}/interface`);
        
        console.log(`  ⏳ Coletando DHCP leases...`);
        clientData.dhcpLeases = await fetchWithTimeout(`${baseUrl}/ip/dhcp-server/lease`);
        
        console.log(`  ⏳ Coletando firewall rules...`);
        clientData.firewallRules = await fetchWithTimeout(`${baseUrl}/ip/firewall/filter`);
        
        console.log(`  ⏳ Coletando NAT rules...`);
        clientData.natRules = await fetchWithTimeout(`${baseUrl}/ip/firewall/nat`);
        
        console.log(`  ⏳ Coletando VPN secrets...`);
        clientData.vpnSecrets = await fetchWithTimeout(`${baseUrl}/ppp/secret`);
        
        console.log(`  ⏳ Coletando VPN active...`);
        clientData.vpnActive = await fetchWithTimeout(`${baseUrl}/ppp/active`);
        
        console.log(`  ⏳ Coletando IP addresses...`);
        clientData.ipAddresses = await fetchWithTimeout(`${baseUrl}/ip/address`);

        console.log(`  ✅ Dados coletados com sucesso: ${client.name}`);
        
      } catch (error) {
        console.error(`  ❌ Erro ao coletar dados de ${client.name}:`, error);
        clientData.error = error.message || 'Erro ao conectar';
      }

      clientsData.push(clientData);
      
      // Small delay between clients to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ [MIKROTIK-REPORT] Coleta finalizada. Clientes processados: ${clientsData.length}`);
    console.log(`📊 [MIKROTIK-REPORT] Clientes com sucesso: ${clientsData.filter(c => !c.error).length}`);
    console.log(`❌ [MIKROTIK-REPORT] Clientes com erro: ${clientsData.filter(c => c.error).length}`);

    // Format WhatsApp message
    console.log(`\n📝 [MIKROTIK-REPORT] Formatando mensagem WhatsApp...`);
    const message = formatMikrotikDashboardMessage(clientsData);
    
    console.log(`📏 [MIKROTIK-REPORT] Tamanho da mensagem: ${message.length} caracteres`);

    // Find active Evolution API integration global
    const { data: evolutionIntegration, error: evolutionError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .eq('is_global', true)
      .maybeSingle();

    if (evolutionError || !evolutionIntegration) {
      throw new Error('❌ Evolution API não configurada. Acesse Admin → Integrações e configure a Evolution API para enviar mensagens pelo WhatsApp.');
    }

    console.log(`📱 [MIKROTIK-REPORT] Evolution API encontrada: ${evolutionIntegration.name}`);

    // Buscar configuração de instância por tela (prioriza agendamentos, com fallback mikrotik)
    let preferredInstanceName = '';
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
        console.warn(`⚠️ [MIKROTIK-REPORT] Screen config do usuário ${report.user_id} não encontrada. Usando configuração global mais recente.`);
      }
    }

    if (screenConfigSetting) {
      try {
        const screenConfig = JSON.parse(screenConfigSetting.setting_value);
        preferredInstanceName = screenConfig['agendamentos'] || screenConfig['mikrotik'] || '';
        const sourceKey = screenConfig['agendamentos'] ? 'agendamentos' : (screenConfig['mikrotik'] ? 'mikrotik' : 'fallback_default');
        console.log(`📱 [MIKROTIK-REPORT] Instância da screen config (${sourceKey}): ${preferredInstanceName || 'não definida'}`);
      } catch (e) {
        console.warn('⚠️ [MIKROTIK-REPORT] Erro ao parsear screen config:', e);
      }
    }

    // Format phone number
    let phoneNumber = report.phone_number.replace(/\D/g, '');
    if (!phoneNumber.startsWith('55')) {
      phoneNumber = '55' + phoneNumber;
    }

    console.log(`📞 [MIKROTIK-REPORT] Enviando para: ${phoneNumber}`);

    // Send via WhatsApp
    const { data: whatsappData, error: whatsappError } = await supabase.functions.invoke(
      'send-whatsapp-message',
      {
        body: {
          integrationId: evolutionIntegration.id,
          instanceName: preferredInstanceName || undefined,
          phoneNumber,
          message
        }
      }
    );

    if (whatsappError) throw whatsappError;

    console.log(`✅ [MIKROTIK-REPORT] Mensagem enviada com sucesso!`);

    // Update report execution
    const executionTimestamp = new Date().toISOString();

    const { data: nextExecution, error: nextExecutionError } = await supabase
      .rpc('calculate_next_execution', {
        cron_expr: report.cron_expression,
        from_time: executionTimestamp
      });

    if (nextExecutionError) {
      console.error('❌ [MIKROTIK-REPORT] Erro ao calcular próxima execução:', nextExecutionError);
    }

    const safeNextExecution = nextExecution || new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('scheduled_reports')
      .update({
        last_execution: executionTimestamp,
        execution_count: (report.execution_count || 0) + 1,
        next_execution: safeNextExecution
      })
      .eq('id', report_id);

    if (updateError) {
      console.error('❌ [MIKROTIK-REPORT] Erro ao atualizar relatório:', updateError);
    } else {
      console.log(`⏰ [MIKROTIK-REPORT] Próxima execução atualizada para: ${safeNextExecution}`);
    }

    // Log execution
    const executionTime = Date.now() - startTime;
    
    const { error: logError } = await supabase
      .from('scheduled_reports_logs')
      .insert({
        report_id,
        user_id: report.user_id,
        phone_number: report.phone_number,
        status: 'success',
        message_sent: true,
        message_content: message,
        execution_time_ms: executionTime,
        whatsapp_response: whatsappData
      });

    if (logError) {
      console.error('❌ [MIKROTIK-REPORT] Erro ao criar log:', logError);
    }

    console.log(`\n🎉 [MIKROTIK-REPORT] Execução concluída em ${executionTime}ms`);
    console.log(`📋 [MIKROTIK-REPORT] ID: ${executionId}\n`);

    return new Response(
      JSON.stringify({
        success: true,
        executionId,
        clientsProcessed: clientsData.length,
        clientsSuccess: clientsData.filter(c => !c.error).length,
        clientsError: clientsData.filter(c => c.error).length,
        messageSent: true,
        executionTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ [MIKROTIK-REPORT] Erro fatal:', error);
    
    const executionTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        executionId,
        executionTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
