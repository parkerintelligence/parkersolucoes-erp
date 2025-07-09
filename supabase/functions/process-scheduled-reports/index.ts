
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
    console.log('🔍 Verificando relatórios agendados...');
    console.log('🕐 Horário atual (UTC):', new Date().toISOString());
    console.log('🕐 Horário atual (Brasília):', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    
    // Buscar todos os relatórios agendados que devem ser executados agora
    const now = new Date();
    const { data: dueReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', now.toISOString());

    if (error) {
      console.error('❌ Erro ao buscar relatórios:', error);
      throw new Error(`Erro ao buscar relatórios: ${error.message}`);
    }

    console.log(`📋 Encontrados ${dueReports?.length || 0} relatórios para executar`);
    
    // Log detalhado dos relatórios encontrados
    if (dueReports && dueReports.length > 0) {
      dueReports.forEach(report => {
        console.log(`📄 Relatório: ${report.name}`);
        console.log(`  - ID: ${report.id}`);
        console.log(`  - Próxima execução: ${report.next_execution}`);
        console.log(`  - Expressão cron: ${report.cron_expression}`);
        console.log(`  - Telefone: ${report.phone_number}`);
      });
    }

    const results = [];
    
    for (const report of dueReports || []) {
      console.log(`🚀 Processando relatório: ${report.name} (${report.id})`);
      
      try {
        // Executar cada relatório
        const { data: result, error: functionError } = await supabase.functions.invoke('send-scheduled-report', {
          body: { report_id: report.id }
        });

        if (functionError) {
          console.error(`❌ Erro na função send-scheduled-report:`, functionError);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: functionError.message || 'Erro na função de envio',
            phone_number: report.phone_number
          });
          continue;
        }
        
        if (result?.success) {
          console.log(`✅ Relatório ${report.name} executado com sucesso`);
          
          // Usar a função PostgreSQL para calcular a próxima execução
          const { data: nextExecData, error: nextExecError } = await supabase
            .rpc('calculate_next_execution', {
              cron_expr: report.cron_expression,
              from_time: now.toISOString()
            });

          if (nextExecError) {
            console.error('❌ Erro ao calcular próxima execução:', nextExecError);
            // Continuar mesmo com erro de cálculo
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
            console.error('❌ Erro ao atualizar relatório:', updateError);
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
          console.error(`❌ Falha no relatório ${report.name}:`, result);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: result?.error || 'Erro desconhecido na execução',
            phone_number: report.phone_number
          });
        }

      } catch (reportError: any) {
        console.error(`❌ Erro ao processar relatório ${report.name}:`, reportError);
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

    console.log(`📊 Processamento concluído: ${successCount} sucessos, ${failureCount} falhas`);

    return new Response(JSON.stringify({ 
      executed_reports: results.length,
      successful: successCount,
      failed: failureCount,
      results: results,
      timestamp: new Date().toISOString(),
      current_time_utc: now.toISOString(),
      current_time_brasilia: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Erro na função process-scheduled-reports:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        current_time_utc: new Date().toISOString(),
        current_time_brasilia: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
