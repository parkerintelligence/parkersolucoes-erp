import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();

    switch (action) {
      case 'log_execution': {
        // Log detalhado da execução do relatório
        const { 
          report_id, 
          user_id, 
          execution_time, 
          total_jobs, 
          failed_jobs, 
          success_rate, 
          cache_hit,
          error_patterns,
          phone_number 
        } = data;

        await supabase
          .from('scheduled_reports_logs')
          .insert({
            report_id,
            user_id,
            phone_number,
            execution_date: new Date().toISOString(),
            execution_time_ms: execution_time,
            status: failed_jobs > 0 ? 'alert' : 'success',
            message_sent: true,
            message_content: `Relatório executado: ${total_jobs} jobs, ${failed_jobs} erros (${success_rate}% sucesso)`,
            whatsapp_response: {
              total_jobs,
              failed_jobs,
              success_rate,
              cache_hit,
              error_patterns,
              timestamp: new Date().toISOString()
            }
          });

        console.log('📊 Log de execução registrado');
        break;
      }

      case 'health_check': {
        // Verificar saúde do sistema de relatórios
        const lastDay = new Date();
        lastDay.setDate(lastDay.getDate() - 1);

        const { data: recentLogs, error } = await supabase
          .from('scheduled_reports_logs')
          .select('*')
          .gte('execution_date', lastDay.toISOString())
          .order('execution_date', { ascending: false })
          .limit(100);

        if (error) throw error;

        const totalExecutions = recentLogs.length;
        const failedExecutions = recentLogs.filter(log => log.status === 'error').length;
        const avgExecutionTime = recentLogs.reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / totalExecutions;

        const healthReport = {
          status: failedExecutions === 0 ? 'healthy' : failedExecutions < 3 ? 'warning' : 'critical',
          totalExecutions,
          failedExecutions,
          successRate: Math.round(((totalExecutions - failedExecutions) / totalExecutions) * 100),
          avgExecutionTime: Math.round(avgExecutionTime),
          lastExecution: recentLogs[0]?.execution_date || null,
          recommendations: []
        };

        // Adicionar recomendações baseadas no status
        if (failedExecutions > 0) {
          healthReport.recommendations.push('Verificar integrações Bacula e Evolution API');
        }
        if (avgExecutionTime > 30000) {
          healthReport.recommendations.push('Performance degradada - considerar otimização de cache');
        }
        if (totalExecutions < 5) {
          healthReport.recommendations.push('Poucos relatórios executados - verificar agendamentos');
        }

        return new Response(
          JSON.stringify(healthReport),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_metrics': {
        // Obter métricas detalhadas dos relatórios
        const { days = 7 } = data || {};
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: logs, error } = await supabase
          .from('scheduled_reports_logs')
          .select('*')
          .gte('execution_date', startDate.toISOString())
          .order('execution_date', { ascending: false });

        if (error) throw error;

        // Calcular métricas
        const metrics = {
          totalReports: logs.length,
          successfulReports: logs.filter(log => log.status === 'success').length,
          failedReports: logs.filter(log => log.status === 'error').length,
          avgExecutionTime: logs.reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / logs.length,
          dailyBreakdown: {},
          errorPatterns: {},
          alertsByDay: {}
        };

        // Breakdown por dia
        logs.forEach(log => {
          const day = log.execution_date.split('T')[0];
          if (!metrics.dailyBreakdown[day]) {
            metrics.dailyBreakdown[day] = { total: 0, success: 0, failed: 0 };
          }
          metrics.dailyBreakdown[day].total++;
          if (log.status === 'success') metrics.dailyBreakdown[day].success++;
          if (log.status === 'error') metrics.dailyBreakdown[day].failed++;
        });

        // Padrões de erro
        logs.filter(log => log.whatsapp_response?.error_patterns).forEach(log => {
          const patterns = log.whatsapp_response.error_patterns;
          Object.keys(patterns).forEach(pattern => {
            metrics.errorPatterns[pattern] = (metrics.errorPatterns[pattern] || 0) + patterns[pattern];
          });
        });

        return new Response(
          JSON.stringify(metrics),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Ação não reconhecida');
    }

    return new Response(
      JSON.stringify({ success: true, message: `Ação ${action} executada com sucesso` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no monitor de relatórios:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro no monitor de relatórios', 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});