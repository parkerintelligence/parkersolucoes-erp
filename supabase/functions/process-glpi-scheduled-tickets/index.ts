
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

interface GLPITicketData {
  name: string;
  content: string;
  urgency: number;
  impact: number;
  priority: number;
  type: number;
  category_id?: number;
  requester_user_id?: number;
  assign_user_id?: number;
  assign_group_id?: number;
  entity_id: number;
}

const logCronExecution = async (jobName: string, status: string, details: any) => {
  try {
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: jobName,
        status,
        details
      });
  } catch (error) {
    console.error('❌ [CRON-LOG] Erro ao salvar log:', error);
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const currentTime = new Date();
    const requestBody = await req.json().catch(() => ({}));
    
    console.log('🔍 [GLPI-CRON] Iniciando processamento de chamados agendados...');
    console.log('🕐 [GLPI-CRON] Horário atual (UTC):', currentTime.toISOString());
    console.log('🕐 [GLPI-CRON] Horário atual (Brazil):', currentTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    console.log('🐛 [GLPI-CRON] Debug mode:', !!requestBody.debug);
    console.log('🔁 [GLPI-CRON] Cron execution:', !!requestBody.cron_execution);
    console.log('🧪 [GLPI-CRON] Manual test:', !!requestBody.manual_test);
    
    // Log da execução do cron
    await logCronExecution('process-glpi-tickets', 'started', {
      timestamp: currentTime.toISOString(),
      debug: !!requestBody.debug,
      cron_execution: !!requestBody.cron_execution,
      manual_test: !!requestBody.manual_test
    });
    
    // Buscar chamados que devem ser executados agora
    const { data: dueTickets, error } = await supabase
      .from('glpi_scheduled_tickets')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', currentTime.toISOString());

    if (error) {
      console.error('❌ [GLPI-CRON] Erro ao buscar chamados:', error);
      await logCronExecution('process-glpi-tickets-fixed', 'error', {
        error: error.message,
        timestamp: currentTime.toISOString()
      });
      throw new Error(`Erro ao buscar chamados: ${error.message}`);
    }

    console.log(`📋 [GLPI-CRON] Encontrados ${dueTickets?.length || 0} chamados para executar`);
    
    const results = [];
    
    for (const ticket of dueTickets || []) {
      console.log(`🚀 [GLPI-CRON] Processando chamado: ${ticket.name} (${ticket.id})`);
      
      try {
        // Buscar integração GLPI do usuário
        const { data: glpiIntegration } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', ticket.user_id)
          .eq('type', 'glpi')
          .eq('is_active', true)
          .single();

        if (!glpiIntegration) {
          console.error(`❌ [GLPI-CRON] Integração GLPI não encontrada para usuário ${ticket.user_id}`);
          results.push({
            ticket_id: ticket.id,
            ticket_name: ticket.name,
            success: false,
            error: 'Integração GLPI não configurada'
          });
          continue;
        }

        console.log(`🔐 [GLPI-CRON] Integração GLPI encontrada para usuário ${ticket.user_id}`);

        // Verificar se os tokens necessários estão configurados
        const appToken = glpiIntegration.api_token;
        const userToken = glpiIntegration.user_token || glpiIntegration.username; // fallback para username se user_token não existir
        
        if (!appToken || !userToken) {
          console.error(`❌ [GLPI-CRON] Tokens GLPI não configurados para usuário ${ticket.user_id}`);
          results.push({
            ticket_id: ticket.id,
            ticket_name: ticket.name,
            success: false,
            error: 'App-Token ou User-Token não configurados na integração GLPI'
          });
          continue;
        }

        // Normalizar base URL para evitar duplicação de /apirest.php
        let baseUrl = glpiIntegration.base_url;
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `http://${baseUrl}`;
        }
        // Remove /apirest.php se já estiver presente para evitar duplicação
        baseUrl = baseUrl.replace(/\/apirest\.php\/?$/, '');
        
        // Primeiro fazer login no GLPI para obter Session-Token válido
        const loginResponse = await fetch(`${baseUrl}/apirest.php/initSession`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'App-Token': appToken,
            'Authorization': `user_token ${userToken}`,
          }
        });

        if (!loginResponse.ok) {
          const loginError = await loginResponse.text();
          console.error(`❌ [GLPI-CRON] Erro no login GLPI: ${loginResponse.status} - ${loginError}`);
          throw new Error(`GLPI Login Error: ${loginResponse.status} ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        const sessionToken = loginData.session_token;
        console.log(`🔑 [GLPI-CRON] Session token obtido: ${sessionToken?.substring(0, 10)}...`);

        // Preparar dados do chamado
        const ticketData: GLPITicketData = {
          name: ticket.title,
          content: ticket.content,
          urgency: ticket.urgency,
          impact: ticket.impact,
          priority: ticket.priority,
          type: ticket.type,
          entity_id: ticket.entity_id,
          ...(ticket.category_id && { category_id: ticket.category_id }),
          ...(ticket.requester_user_id && { requester_user_id: ticket.requester_user_id }),
          ...(ticket.assign_user_id && { assign_user_id: ticket.assign_user_id }),
          ...(ticket.assign_group_id && { assign_group_id: ticket.assign_group_id }),
        };

        console.log(`📤 [GLPI-CRON] Enviando chamado para GLPI:`, ticketData);

        // Criar chamado no GLPI usando session token válido
        const glpiResponse = await fetch(`${baseUrl}/apirest.php/Ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'App-Token': glpiIntegration.api_token || '',
            'Session-Token': sessionToken,
          },
          body: JSON.stringify({ input: ticketData }),
        });

        if (!glpiResponse.ok) {
          const errorText = await glpiResponse.text();
          console.error(`❌ [GLPI-CRON] Erro na API do GLPI: ${glpiResponse.status} - ${errorText}`);
          throw new Error(`GLPI API Error: ${glpiResponse.status} ${glpiResponse.statusText}`);
        }

        const glpiResult = await glpiResponse.json();
        console.log(`✅ [GLPI-CRON] Chamado criado no GLPI:`, glpiResult);

        // Calcular próxima execução
        const { data: nextExecData, error: nextExecError } = await supabase
          .rpc('calculate_next_execution', {
            cron_expr: ticket.cron_expression,
            from_time: currentTime.toISOString()
          });

        if (nextExecError) {
          console.error('❌ [GLPI-CRON] Erro ao calcular próxima execução:', nextExecError);
        }

        console.log(`⏰ [GLPI-CRON] Próxima execução calculada: ${nextExecData}`);

        // Atualizar registro do agendamento
        const { error: updateError } = await supabase
          .from('glpi_scheduled_tickets')
          .update({
            last_execution: currentTime.toISOString(),
            next_execution: nextExecData || null,
            execution_count: (ticket.execution_count || 0) + 1
          })
          .eq('id', ticket.id);

        if (updateError) {
          console.error('❌ [GLPI-CRON] Erro ao atualizar agendamento:', updateError);
        }

        results.push({
          ticket_id: ticket.id,
          ticket_name: ticket.name,
          success: true,
          glpi_ticket_id: glpiResult.id,
          next_execution: nextExecData
        });

        // Fazer logout do GLPI para limpar a sessão
        try {
          await fetch(`${baseUrl}/apirest.php/killSession`, {
            method: 'POST',
            headers: {
              'App-Token': glpiIntegration.api_token || '',
              'Session-Token': sessionToken,
            }
          });
          console.log(`🔓 [GLPI-CRON] Logout do GLPI realizado`);
        } catch (logoutError) {
          console.warn(`⚠️ [GLPI-CRON] Erro no logout (não crítico):`, logoutError);
        }

      } catch (ticketError: any) {
        console.error(`❌ [GLPI-CRON] Erro ao processar chamado ${ticket.name}:`, ticketError);
        results.push({
          ticket_id: ticket.id,
          ticket_name: ticket.name,
          success: false,
          error: ticketError.message || 'Erro desconhecido'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const executionTime = Date.now() - startTime;

    console.log(`📊 [GLPI-CRON] Processamento concluído em ${executionTime}ms:`);
    console.log(`  - Total de chamados processados: ${results.length}`);
    console.log(`  - Sucessos: ${successCount}`);
    console.log(`  - Falhas: ${failureCount}`);

    // Log do resultado final
    await logCronExecution('process-glpi-tickets-fixed', 'completed', {
      total_processed: results.length,
      successful: successCount,
      failed: failureCount,
      execution_time_ms: executionTime,
      results,
      timestamp: currentTime.toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true,
      executed_tickets: results.length,
      successful: successCount,
      failed: failureCount,
      execution_time_ms: executionTime,
      results: results,
      timestamp: currentTime.toISOString(),
      message: `Processados ${results.length} chamados. ${successCount} sucessos, ${failureCount} falhas.`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error("❌ [GLPI-CRON] Erro crítico na função process-glpi-scheduled-tickets:", error);
    
    // Log do erro crítico
    await logCronExecution('process-glpi-tickets-fixed', 'critical_error', {
      error: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      message: `Erro crítico: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
