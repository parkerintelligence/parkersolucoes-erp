
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [CRON] Verificando relatórios agendados...');
    console.log('🕐 [CRON] Horário atual (UTC):', new Date().toISOString());
    console.log('🕐 [CRON] Horário atual (Brasília):', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    
    // Buscar todos os relatórios agendados que devem ser executados agora
    const now = new Date();
    console.log('📋 [CRON] Buscando relatórios que devem ser executados até:', now.toISOString());
    
    const { data: dueReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', now.toISOString());

    if (error) {
      console.error('❌ [CRON] Erro ao buscar relatórios:', error);
      throw new Error(`Erro ao buscar relatórios: ${error.message}`);
    }

    console.log(`📋 [CRON] Encontrados ${dueReports?.length || 0} relatórios para executar`);
    
    // Log detalhado dos relatórios encontrados
    if (dueReports && dueReports.length > 0) {
      dueReports.forEach(report => {
        console.log(`📄 [CRON] Relatório: ${report.name}`);
        console.log(`  - ID: ${report.id}`);
        console.log(`  - Próxima execução: ${report.next_execution}`);
        console.log(`  - Expressão cron: ${report.cron_expression}`);
        console.log(`  - Telefone: ${report.phone_number}`);
        console.log(`  - Usuário: ${report.user_id}`);
      });
    } else {
      console.log('ℹ️ [CRON] Nenhum relatório encontrado para execução neste momento');
    }

    const results = [];
    
    for (const report of dueReports || []) {
      console.log(`🚀 [CRON] Processando relatório: ${report.name} (${report.id})`);
      
      try {
        // Executar cada relatório usando invoke direto
        console.log(`📞 [CRON] Chamando send-scheduled-report para: ${report.id}`);
        
        const { data: result, error: functionError } = await supabase.functions.invoke('send-scheduled-report', {
          body: JSON.stringify({ report_id: report.id })
        });

        if (functionError) {
          console.error(`❌ [CRON] Erro na função send-scheduled-report:`, functionError);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: functionError.message || 'Erro na função de envio',
            phone_number: report.phone_number
          });
          continue;
        }
        
        console.log(`📋 [CRON] Resultado da função:`, result);
        
        if (result?.success) {
          console.log(`✅ [CRON] Relatório ${report.name} executado com sucesso`);
          
          // Usar a função PostgreSQL para calcular a próxima execução
          const { data: nextExecData, error: nextExecError } = await supabase
            .rpc('calculate_next_execution', {
              cron_expr: report.cron_expression,
              from_time: now.toISOString()
            });

          if (nextExecError) {
            console.error('❌ [CRON] Erro ao calcular próxima execução:', nextExecError);
            // Continuar mesmo com erro de cálculo
          } else {
            console.log(`⏰ [CRON] Próxima execução calculada: ${nextExecData}`);
          }

          // Atualizar o registro com a próxima execução calculada pelo PostgreSQL
          const { error: updateError } = await supabase
            .from('scheduled_reports')
            .update({
              last_execution: now.toISOString(),
              next_execution: nextExecData || null,
              execution_count: (report.execution_count || 0) + 1
            })
            .eq('id', report.id);

          if (updateError) {
            console.error('❌ [CRON] Erro ao atualizar relatório:', updateError);
          } else {
            console.log(`📝 [CRON] Relatório atualizado com próxima execução: ${nextExecData}`);
          }

          results.push({
            report_id: report.id,
            report_name: report.name,
            success: true,
            result: result,
            phone_number: report.phone_number,
            next_execution: nextExecData
          });
        } else {
          console.error(`❌ [CRON] Falha no relatório ${report.name}:`, result);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: result?.error || 'Erro desconhecido na execução',
            phone_number: report.phone_number
          });
        }

      } catch (reportError: any) {
        console.error(`❌ [CRON] Erro ao processar relatório ${report.name}:`, reportError);
        results.push({
          report_id: report.id,
          report_name: report.name,
          success: false,
          error: reportError.message || 'Erro desconhecido',
          phone_number: report.phone_number
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`📊 [CRON] Processamento concluído: ${successCount} sucessos, ${failureCount} falhas`);

    const responseData = { 
      executed_reports: results.length,
      successful: successCount,
      failed: failureCount,
      results: results,
      timestamp: new Date().toISOString(),
      current_time_utc: now.toISOString(),
      current_time_brasilia: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };

    console.log('📤 [CRON] Retornando resposta:', JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ [CRON] Erro na função process-scheduled-reports:", error);
    console.error("❌ [CRON] Stack trace:", error.stack);
    
    const errorResponse = { 
      error: error.message,
      timestamp: new Date().toISOString(),
      current_time_utc: new Date().toISOString(),
      current_time_brasilia: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
