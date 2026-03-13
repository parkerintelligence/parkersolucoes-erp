
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

const processGLPITicket = async (ticket: any, currentTime: Date) => {
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
      return {
        ticket_id: ticket.id,
        ticket_name: ticket.name,
        success: false,
        error: 'Integração GLPI não configurada'
      };
    }

    console.log(`🔐 [GLPI-CRON] Integração GLPI encontrada para usuário ${ticket.user_id}`);

    // Verificar se os tokens necessários estão configurados
    const appToken = glpiIntegration.api_token;
    const userToken = glpiIntegration.user_token || glpiIntegration.username;
    
    if (!appToken || !userToken) {
      console.error(`❌ [GLPI-CRON] Tokens GLPI não configurados para usuário ${ticket.user_id}`);
      return {
        ticket_id: ticket.id,
        ticket_name: ticket.name,
        success: false,
        error: 'App-Token ou User-Token não configurados na integração GLPI'
      };
    }

    // Fazer login no GLPI para obter Session-Token válido
    const loginResponse = await fetch(`${glpiIntegration.base_url}/apirest.php/initSession`, {
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
    const glpiResponse = await fetch(`${glpiIntegration.base_url}/apirest.php/Ticket`, {
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

    // Fazer logout do GLPI para limpar a sessão
    try {
      await fetch(`${glpiIntegration.base_url}/apirest.php/killSession`, {
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

    return {
      ticket_id: ticket.id,
      ticket_name: ticket.name,
      success: true,
      glpi_ticket_id: glpiResult.id,
      next_execution: nextExecData
    };

  } catch (error: any) {
    console.error(`❌ [GLPI-CRON] Erro ao processar chamado ${ticket.name}:`, error);
    return {
      ticket_id: ticket.id,
      ticket_name: ticket.name,
      success: false,
      error: error.message || 'Erro desconhecido'
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const currentTime = new Date();
    console.log('🔍 [UNIFIED-CRON] Iniciando processamento unificado de agendamentos...');
    console.log('🕐 [UNIFIED-CRON] Horário atual (UTC):', currentTime.toISOString());
    console.log('🕐 [UNIFIED-CRON] Horário atual (Brasília):', currentTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    
    // Log da execução do cron
    await logCronExecution('unified-cron-scheduler', 'started', {
      timestamp: currentTime.toISOString()
    });

    // Corrigir relatórios ativos sem próxima execução (evita agendamentos travados)
    const { data: reportsWithoutNextExecution, error: missingNextExecError } = await supabase
      .from('scheduled_reports')
      .select('id, name, cron_expression')
      .eq('is_active', true)
      .is('next_execution', null);

    if (missingNextExecError) {
      console.error('⚠️ [UNIFIED-CRON] Erro ao buscar relatórios sem next_execution:', missingNextExecError);
    }

    if (reportsWithoutNextExecution && reportsWithoutNextExecution.length > 0) {
      console.log(`🛠️ [UNIFIED-CRON] Recalculando next_execution para ${reportsWithoutNextExecution.length} relatório(s) sem agendamento`);

      for (const report of reportsWithoutNextExecution) {
        const { data: recalculatedNextExecution, error: recalcError } = await supabase
          .rpc('calculate_next_execution', {
            cron_expr: report.cron_expression,
            from_time: currentTime.toISOString()
          });

        if (recalcError) {
          console.error(`❌ [UNIFIED-CRON] Falha ao recalcular next_execution de ${report.name}:`, recalcError);
          continue;
        }

        const { error: updateMissingNextExecError } = await supabase
          .from('scheduled_reports')
          .update({ next_execution: recalculatedNextExecution })
          .eq('id', report.id);

        if (updateMissingNextExecError) {
          console.error(`❌ [UNIFIED-CRON] Falha ao atualizar next_execution de ${report.name}:`, updateMissingNextExecError);
          continue;
        }

        console.log(`✅ [UNIFIED-CRON] next_execution recalculado para ${report.name}: ${recalculatedNextExecution}`);
      }
    }

    // Buscar relatórios que devem ser executados agora
    console.log(`🔍 [UNIFIED-CRON] Buscando relatórios com next_execution <= ${currentTime.toISOString()}`);
    
    const { data: dueReports, error: reportsError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', currentTime.toISOString());

    if (reportsError) {
      console.error('❌ [UNIFIED-CRON] Erro ao buscar relatórios:', reportsError);
      throw new Error(`Erro ao buscar relatórios: ${reportsError.message}`);
    }

    // Buscar tickets GLPI que devem ser executados agora
    const { data: dueTickets, error: ticketsError } = await supabase
      .from('glpi_scheduled_tickets')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', currentTime.toISOString());

    if (ticketsError) {
      console.error('❌ [UNIFIED-CRON] Erro ao buscar tickets GLPI:', ticketsError);
      throw new Error(`Erro ao buscar tickets GLPI: ${ticketsError.message}`);
    }

    console.log(`📋 [UNIFIED-CRON] Encontrados ${dueReports?.length || 0} relatórios e ${dueTickets?.length || 0} tickets GLPI para executar`);
    
    // Log detalhado dos relatórios encontrados
    if (dueReports && dueReports.length > 0) {
      console.log('📝 [UNIFIED-CRON] Relatórios a executar:');
      dueReports.forEach(report => {
        console.log(`  - ${report.name}: next_execution=${report.next_execution}, cron=${report.cron_expression}`);
      });
    } else {
      console.log('📝 [UNIFIED-CRON] Nenhum relatório devido encontrado');
      
      // Verificar todos os relatórios ativos para debug
      const { data: allReports } = await supabase
        .from('scheduled_reports')
        .select('name, next_execution, cron_expression, is_active')
        .eq('is_active', true);
      
      if (allReports && allReports.length > 0) {
        console.log('🔍 [UNIFIED-CRON] Todos os relatórios ativos:');
        allReports.forEach(report => {
          const nextExec = new Date(report.next_execution);
          const diff = nextExec.getTime() - currentTime.getTime();
          console.log(`  - ${report.name}: next_execution=${report.next_execution} (diff: ${Math.round(diff/1000/60)}min), cron=${report.cron_expression}`);
        });
      }
    }
    
    const results = [];
    
    // Processar relatórios WhatsApp
    for (const report of dueReports || []) {
      console.log(`🚀 [CRON] Processando relatório: ${report.name} (${report.id})`);
      
      try {
        // Invocar a função de envio de relatório
        const { data: result, error: functionError } = await supabase.functions.invoke('send-scheduled-report', {
          body: { report_id: report.id }
        });

        if (functionError) {
          console.error(`❌ [CRON] Erro na função send-scheduled-report:`, functionError);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: functionError.message || JSON.stringify(functionError)
          });
          continue;
        }
        
        console.log(`📤 [CRON] Resposta da função:`, result);
        
        if (result?.success) {
          console.log(`✅ [CRON] Relatório ${report.name} executado com sucesso`);
          
          // Calcular próxima execução usando a função do banco
          const { data: nextExecData, error: nextExecError } = await supabase
            .rpc('calculate_next_execution', {
              cron_expr: report.cron_expression,
              from_time: currentTime.toISOString()
            });

          if (nextExecError) {
            console.error('❌ [CRON] Erro ao calcular próxima execução:', nextExecError);
          } else {
            console.log(`⏰ [CRON] Próxima execução calculada: ${nextExecData}`);
          }

          // Atualizar o registro do relatório IMEDIATAMENTE para evitar execuções duplicadas
          const { error: updateError } = await supabase
            .from('scheduled_reports')
            .update({
              last_execution: currentTime.toISOString(),
              next_execution: nextExecData || null,
              execution_count: (report.execution_count || 0) + 1
            })
            .eq('id', report.id);

          if (updateError) {
            console.error('❌ [CRON] Erro ao atualizar relatório:', updateError);
          } else {
            console.log(`📝 [CRON] Relatório ${report.name} atualizado com próxima execução: ${nextExecData}`);
          }

          results.push({
            report_id: report.id,
            report_name: report.name,
            success: true,
            next_execution: nextExecData,
            execution_time: result.execution_time_ms
          });
        } else {
          console.error(`❌ [CRON] Falha no relatório ${report.name}:`, result);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: result?.error || 'Erro desconhecido na execução'
          });
        }

      } catch (reportError: any) {
        console.error(`❌ [CRON] Erro ao processar relatório ${report.name}:`, reportError);
        results.push({
          report_id: report.id,
          report_name: report.name,
          success: false,
          error: reportError.message || 'Erro desconhecido'
        });
      }
    }

    // Processar tickets GLPI
    for (const ticket of dueTickets || []) {
      const ticketResult = await processGLPITicket(ticket, currentTime);
      results.push(ticketResult);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const reportsCount = dueReports?.length || 0;
    const ticketsCount = dueTickets?.length || 0;
    const executionTime = Date.now() - startTime;

    console.log(`📊 [UNIFIED-CRON] Processamento unificado concluído em ${executionTime}ms:`);
    console.log(`  - Total de relatórios processados: ${reportsCount}`);
    console.log(`  - Total de tickets GLPI processados: ${ticketsCount}`);
    console.log(`  - Total geral processado: ${results.length}`);
    console.log(`  - Sucessos: ${successCount}`);
    console.log(`  - Falhas: ${failureCount}`);

    // Log do resultado final
    await logCronExecution('unified-cron-scheduler', 'completed', {
      total_processed: results.length,
      reports_processed: reportsCount,
      tickets_processed: ticketsCount,
      successful: successCount,
      failed: failureCount,
      execution_time_ms: executionTime,
      results,
      timestamp: currentTime.toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true,
      total_executed: results.length,
      executed_reports: reportsCount,
      executed_tickets: ticketsCount,
      successful: successCount,
      failed: failureCount,
      execution_time_ms: executionTime,
      results: results,
      timestamp: currentTime.toISOString(),
      message: `Processados ${results.length} agendamentos (${reportsCount} relatórios, ${ticketsCount} tickets GLPI). ${successCount} sucessos, ${failureCount} falhas.`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error("❌ [UNIFIED-CRON] Erro crítico na função unificada:", error);
    console.error("❌ [UNIFIED-CRON] Stack trace:", error.stack);
    
    // Log do erro crítico
    await logCronExecution('unified-cron-scheduler', 'critical_error', {
      error: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      message: `Erro crítico no processamento unificado: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
