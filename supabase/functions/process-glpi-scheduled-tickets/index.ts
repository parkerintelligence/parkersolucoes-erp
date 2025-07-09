
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar timezone do Brasil (UTC-3)
    const brasiliaOffset = -3;
    const currentTime = new Date();
    const brasiliaTime = new Date(currentTime.getTime() + (brasiliaOffset * 60 * 60 * 1000));
    
    console.log('🔍 [GLPI-CRON] === INICIANDO PROCESSAMENTO ===');
    console.log('🕐 [GLPI-CRON] Horário atual (UTC):', currentTime.toISOString());
    console.log('🕐 [GLPI-CRON] Horário Brasília:', brasiliaTime.toISOString());
    
    // Buscar chamados que devem ser executados agora (com margem de 5 minutos)
    const fiveMinutesAgo = new Date(currentTime.getTime() - (5 * 60 * 1000));
    const { data: dueTickets, error } = await supabase
      .from('glpi_scheduled_tickets')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', currentTime.toISOString())
      .gte('next_execution', fiveMinutesAgo.toISOString());

    if (error) {
      console.error('❌ [GLPI-CRON] Erro ao buscar chamados:', error);
      throw new Error(`Erro ao buscar chamados: ${error.message}`);
    }

    console.log(`📋 [GLPI-CRON] Query executada com sucesso`);
    console.log(`📋 [GLPI-CRON] Encontrados ${dueTickets?.length || 0} chamados para executar`);
    
    if (dueTickets && dueTickets.length > 0) {
      console.log('📋 [GLPI-CRON] Chamados encontrados:', dueTickets.map(t => ({
        id: t.id,
        name: t.name,
        next_execution: t.next_execution,
        is_active: t.is_active
      })));
    }
    
    const results = [];
    
    for (const ticket of dueTickets || []) {
      console.log(`🚀 [GLPI-CRON] === PROCESSANDO CHAMADO: ${ticket.name} ===`);
      console.log(`🚀 [GLPI-CRON] ID: ${ticket.id}`);
      console.log(`🚀 [GLPI-CRON] Próxima execução: ${ticket.next_execution}`);
      console.log(`🚀 [GLPI-CRON] Usuário: ${ticket.user_id}`);
      
      try {
        // Buscar integração GLPI do usuário
        console.log(`🔍 [GLPI-CRON] Buscando integração GLPI para usuário: ${ticket.user_id}`);
        const { data: glpiIntegration, error: integrationError } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', ticket.user_id)
          .eq('type', 'glpi')
          .eq('is_active', true)
          .single();

        if (integrationError || !glpiIntegration) {
          const errorMsg = `Integração GLPI não encontrada para usuário ${ticket.user_id}`;
          console.error(`❌ [GLPI-CRON] ${errorMsg}`, integrationError);
          results.push({
            ticket_id: ticket.id,
            ticket_name: ticket.name,
            success: false,
            error: errorMsg
          });
          continue;
        }

        console.log(`✅ [GLPI-CRON] Integração GLPI encontrada:`, {
          id: glpiIntegration.id,
          name: glpiIntegration.name,
          base_url: glpiIntegration.base_url,
          has_api_token: !!glpiIntegration.api_token,
          has_username: !!glpiIntegration.username
        });

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

        console.log(`📝 [GLPI-CRON] Dados do chamado preparados:`, ticketData);

        // Tentar inicializar sessão primeiro
        console.log(`🔐 [GLPI-CRON] Tentando inicializar sessão GLPI...`);
        let sessionToken = glpiIntegration.username; // Pode ser token de sessão existente

        if (!sessionToken || sessionToken.length < 10) {
          console.log(`🔐 [GLPI-CRON] Iniciando nova sessão...`);
          const initSessionResponse = await fetch(`${glpiIntegration.base_url}/apirest.php/initSession`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'App-Token': glpiIntegration.api_token || '',
              'Authorization': `user_token ${glpiIntegration.username || ''}`
            }
          });

          if (initSessionResponse.ok) {
            const sessionData = await initSessionResponse.json();
            sessionToken = sessionData.session_token;
            console.log(`✅ [GLPI-CRON] Nova sessão criada com sucesso`);
          } else {
            console.log(`⚠️ [GLPI-CRON] Falha ao criar nova sessão, usando token existente`);
          }
        }

        // Criar chamado no GLPI
        console.log(`📤 [GLPI-CRON] Enviando chamado para GLPI...`);
        const glpiResponse = await fetch(`${glpiIntegration.base_url}/apirest.php/Ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'App-Token': glpiIntegration.api_token || '',
            'Session-Token': sessionToken || '',
          },
          body: JSON.stringify({ input: ticketData }),
        });

        const responseText = await glpiResponse.text();
        console.log(`📥 [GLPI-CRON] Resposta GLPI (status ${glpiResponse.status}):`, responseText);

        if (!glpiResponse.ok) {
          throw new Error(`GLPI API Error: ${glpiResponse.status} ${glpiResponse.statusText} - ${responseText}`);
        }

        let glpiResult;
        try {
          glpiResult = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Erro ao interpretar resposta do GLPI: ${parseError.message}`);
        }

        console.log(`✅ [GLPI-CRON] Chamado criado no GLPI com sucesso:`, glpiResult);

        // Calcular próxima execução
        console.log(`📅 [GLPI-CRON] Calculando próxima execução...`);
        const { data: nextExecData, error: nextExecError } = await supabase
          .rpc('calculate_next_execution', {
            cron_expr: ticket.cron_expression,
            from_time: currentTime.toISOString()
          });

        if (nextExecError) {
          console.error('❌ [GLPI-CRON] Erro ao calcular próxima execução:', nextExecError);
        } else {
          console.log(`📅 [GLPI-CRON] Próxima execução calculada:`, nextExecData);
        }

        // Atualizar registro do agendamento
        console.log(`💾 [GLPI-CRON] Atualizando registro do agendamento...`);
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
        } else {
          console.log(`✅ [GLPI-CRON] Agendamento atualizado com sucesso`);
        }

        results.push({
          ticket_id: ticket.id,
          ticket_name: ticket.name,
          success: true,
          glpi_ticket_id: Array.isArray(glpiResult) ? glpiResult[0]?.id : glpiResult.id,
          next_execution: nextExecData,
          glpi_response: glpiResult
        });

        console.log(`✅ [GLPI-CRON] === CHAMADO PROCESSADO COM SUCESSO ===`);

      } catch (ticketError: any) {
        console.error(`❌ [GLPI-CRON] Erro ao processar chamado ${ticket.name}:`, ticketError);
        results.push({
          ticket_id: ticket.id,
          ticket_name: ticket.name,
          success: false,
          error: ticketError.message || 'Erro desconhecido',
          error_details: ticketError.stack
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`📊 [GLPI-CRON] === PROCESSAMENTO CONCLUÍDO ===`);
    console.log(`📊 [GLPI-CRON] Total de chamados processados: ${results.length}`);
    console.log(`📊 [GLPI-CRON] Sucessos: ${successCount}`);
    console.log(`📊 [GLPI-CRON] Falhas: ${failureCount}`);

    if (results.length > 0) {
      console.log(`📊 [GLPI-CRON] Detalhes dos resultados:`, results);
    }

    return new Response(JSON.stringify({ 
      success: true,
      executed_tickets: results.length,
      successful: successCount,
      failed: failureCount,
      results: results,
      timestamp: currentTime.toISOString(),
      brasilia_time: brasiliaTime.toISOString(),
      message: `Processados ${results.length} chamados. ${successCount} sucessos, ${failureCount} falhas.`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ [GLPI-CRON] ERRO CRÍTICO na função process-glpi-scheduled-tickets:", error);
    console.error("❌ [GLPI-CRON] Stack trace:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      error_details: error.stack,
      timestamp: new Date().toISOString(),
      message: `Erro crítico: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
