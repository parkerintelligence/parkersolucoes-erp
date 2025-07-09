
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
    const currentTime = new Date();
    console.log('🔍 [CRON] Verificando relatórios agendados...');
    console.log('🕐 [CRON] Horário atual (UTC):', currentTime.toISOString());
    console.log('🕐 [CRON] Horário atual (Brasília):', currentTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    
    // Buscar relatórios que devem ser executados
    const { data: dueReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', currentTime.toISOString());

    if (error) {
      console.error('❌ [CRON] Erro ao buscar relatórios:', error);
      throw new Error(`Erro ao buscar relatórios: ${error.message}`);
    }

    console.log(`📋 [CRON] Encontrados ${dueReports?.length || 0} relatórios para executar`);
    
    if (dueReports && dueReports.length > 0) {
      dueReports.forEach(report => {
        console.log(`📄 [CRON] Relatório: ${report.name}`);
        console.log(`  - ID: ${report.id}`);
        console.log(`  - Próxima execução: ${report.next_execution}`);
        console.log(`  - Telefone: ${report.phone_number}`);
      });
    }

    const results = [];
    
    for (const report of dueReports || []) {
      console.log(`🚀 [CRON] Processando relatório: ${report.name} (${report.id})`);
      
      try {
        const { data: result, error: functionError } = await supabase.functions.invoke('send-scheduled-report', {
          body: { report_id: report.id }
        });

        if (functionError) {
          console.error(`❌ [CRON] Erro na função send-scheduled-report:`, functionError);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: functionError.message || 'Erro na função de envio'
          });
          continue;
        }
        
        if (result?.success) {
          console.log(`✅ [CRON] Relatório ${report.name} executado com sucesso`);
          
          // Calcular próxima execução
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

          // Atualizar o registro
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
          }

          results.push({
            report_id: report.id,
            report_name: report.name,
            success: true,
            next_execution: nextExecData
          });
        } else {
          console.error(`❌ [CRON] Falha no relatório ${report.name}:`, result);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: result?.error || 'Erro desconhecido'
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

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`📊 [CRON] Processamento concluído: ${successCount} sucessos, ${failureCount} falhas`);

    return new Response(JSON.stringify({ 
      executed_reports: results.length,
      successful: successCount,
      failed: failureCount,
      results: results,
      timestamp: currentTime.toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ [CRON] Erro na função process-scheduled-reports:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
