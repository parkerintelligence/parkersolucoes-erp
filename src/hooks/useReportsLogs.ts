"use client"

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportLog {
  id: string;
  report_id: string;
  execution_date: string;
  status: string;
  message_sent: boolean;
  phone_number: string;
  execution_time_ms?: number;
  error_details?: string;
  message_content?: string;
  whatsapp_response?: any;
  user_id: string;
  created_at: string;
}

export const useReportsLogs = (reportId?: string) => {
  return useQuery({
    queryKey: ['reports-logs', reportId],
    queryFn: async () => {
      console.log('Buscando logs de relatórios...');
      
      let query = supabase
        .from('scheduled_reports_logs')
        .select(`
          *,
          scheduled_reports!inner(
            name,
            report_type
          )
        `)
        .order('execution_date', { ascending: false })
        .limit(500);
      
      if (reportId) {
        query = query.eq('report_id', reportId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar logs de relatórios:', error);
        throw error;
      }
      
      console.log('Logs encontrados:', data?.length || 0);
      return data as (ReportLog & { scheduled_reports: { name: string; report_type: string } })[];
    },
  });
};

export const useReportsMetrics = () => {
  return useQuery({
    queryKey: ['reports-metrics'],
    queryFn: async () => {
      console.log('Buscando métricas de relatórios...');
      
      // Buscar estatísticas dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('scheduled_reports_logs')
        .select('status, message_sent, execution_date, execution_time_ms')
        .gte('execution_date', thirtyDaysAgo.toISOString());
      
      if (error) {
        console.error('Erro ao buscar métricas:', error);
        throw error;
      }
      
      // Calcular métricas
      const total = data.length;
      const success = data.filter(log => log.status === 'success').length;
      const errors = data.filter(log => log.status === 'error').length;
      const messagesSent = data.filter(log => log.message_sent).length;
      
      const avgExecutionTime = data
        .filter(log => log.execution_time_ms)
        .reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / 
        data.filter(log => log.execution_time_ms).length || 0;
      
      // Agrupar por dia para gráfico
      const dailyStats = data.reduce((acc: any, log) => {
        const date = new Date(log.execution_date).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, success: 0, error: 0, total: 0 };
        }
        acc[date].total++;
        if (log.status === 'success') acc[date].success++;
        if (log.status === 'error') acc[date].error++;
        return acc;
      }, {});
      
      return {
        total,
        success,
        errors,
        messagesSent,
        successRate: total > 0 ? (success / total) * 100 : 0,
        avgExecutionTime: Math.round(avgExecutionTime),
        dailyStats: Object.values(dailyStats).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      };
    },
  });
};