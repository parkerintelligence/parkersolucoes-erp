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
    // Buscar todos os relatórios agendados que devem ser executados agora
    const now = new Date();
    const { data: dueReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', now.toISOString());

    if (error) {
      throw error;
    }

    const results = [];
    
    for (const report of dueReports || []) {
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
        results.push({
          report_id: report.id,
          report_name: report.name,
          success: response.ok,
          result: result
        });

      } catch (reportError) {
        results.push({
          report_id: report.id,
          report_name: report.name,
          success: false,
          error: reportError.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      executed_reports: results.length,
      results: results 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in process-scheduled-reports function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);