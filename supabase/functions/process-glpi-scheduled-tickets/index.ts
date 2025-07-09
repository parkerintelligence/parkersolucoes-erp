
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
    const currentTime = new Date();
    console.log('🔍 [GLPI-CRON] Verificando chamados agendados...');
    console.log('🕐 [GLPI-CRON] Horário atual (UTC):', currentTime.toISOString());
    
    // Buscar chamados que devem ser executados agora
    const { data: dueTickets, error } = await supabase
      .from('glpi_scheduled_tickets')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', currentTime.toISOString());

    if (error) {
      console.error('❌ [GLPI-CRON] Erro ao buscar chamados:', error);
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

        // Criar chamado no GLPI
        const glpiResponse = await fetch(`${glpiIntegration.base_url}/apirest.php/Ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'App-Token': glpiIntegration.api_token || '',
            'Session-Token': glpiIntegration.username || '', // Assumindo que username armazena session token
          },
          body: JSON.stringify({ input: ticketData }),
        });

        if (!glpiResponse.ok) {
          throw new Error(`GLPI API Error: ${glpiResponse.status} ${glpiResponse.statusText}`);
        }

        const glpiResult = await glpiResponse.json();
        console.log(`✅ [GLPI-CRON] Chamado criado no GLPI: ${JSON.stringify(glpiResult)}`);

        // Calcular próxima execução
        const { data: nextExecData, error: nextExecError } = await supabase
          .rpc('calculate_next_execution', {
            cron_expr: ticket.cron_expression,
            from_time: currentTime.toISOString()
          });

        if (nextExecError) {
          console.error('❌ [GLPI-CRON] Erro ao calcular próxima execução:', nextExecError);
        }

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

    console.log(`📊 [GLPI-CRON] Processamento concluído:`);
    console.log(`  - Total de chamados processados: ${results.length}`);
    console.log(`  - Sucessos: ${successCount}`);
    console.log(`  - Falhas: ${failureCount}`);

    return new Response(JSON.stringify({ 
      success: true,
      executed_tickets: results.length,
      successful: successCount,
      failed: failureCount,
      results: results,
      timestamp: currentTime.toISOString(),
      message: `Processados ${results.length} chamados. ${successCount} sucessos, ${failureCount} falhas.`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ [GLPI-CRON] Erro crítico na função process-glpi-scheduled-tickets:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      message: `Erro crítico: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
