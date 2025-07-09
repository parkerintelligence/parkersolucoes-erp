
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
    
    // Buscar todos os relatórios agendados que devem ser executados agora
    const now = new Date();
    const { data: dueReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', now.toISOString());

    if (error) {
      console.error('❌ Erro ao buscar relatórios:', error);
      throw error;
    }

    console.log(`📋 Encontrados ${dueReports?.length || 0} relatórios para executar`);

    const results = [];
    
    for (const report of dueReports || []) {
      console.log(`🚀 Processando relatório: ${report.name} (${report.id})`);
      
      try {
        // Executar cada relatório
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-scheduled-report`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ report_id: report.id })
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`✅ Relatório ${report.name} executado com sucesso`);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: true,
            result: result,
            phone_number: report.phone_number
          });
        } else {
          console.error(`❌ Falha no relatório ${report.name}:`, result);
          results.push({
            report_id: report.id,
            report_name: report.name,
            success: false,
            error: result.error || 'Erro desconhecido',
            phone_number: report.phone_number
          });
        }

      } catch (reportError) {
        console.error(`❌ Erro ao processar relatório ${report.name}:`, reportError);
        results.push({
          report_id: report.id,
          report_name: report.name,
          success: false,
          error: reportError.message,
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
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Erro na função process-scheduled-reports:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
