
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, Clock, TrendingUp, Activity, 
  CheckCircle, XCircle, Timer, BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StatusStats {
  total_reports: number;
  active_reports: number;
  total_executions: number;
  success_rate: number;
  last_24h_executions: number;
  next_executions: Array<{
    id: string;
    name: string;
    next_execution: string;
    phone_number: string;
    report_type: string;
  }>;
}

export const ReportsStatusPanel = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports-status-stats'],
    queryFn: async () => {
      // Buscar estatísticas gerais
      const { data: reports } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('next_execution', { ascending: true });

      // Buscar logs das últimas 24h
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { data: recentLogs } = await supabase
        .from('scheduled_reports_logs')
        .select('*')
        .gte('execution_date', twentyFourHoursAgo.toISOString());

      const totalReports = reports?.length || 0;
      const activeReports = reports?.filter(r => r.is_active).length || 0;
      const totalExecutions = reports?.reduce((sum, r) => sum + (r.execution_count || 0), 0) || 0;
      
      const successfulLogs = recentLogs?.filter(l => l.status === 'success').length || 0;
      const totalRecentLogs = recentLogs?.length || 0;
      const successRate = totalRecentLogs > 0 ? (successfulLogs / totalRecentLogs) * 100 : 0;

      const nextExecutions = reports
        ?.filter(r => r.is_active && r.next_execution)
        ?.slice(0, 10)
        ?.map(r => ({
          id: r.id,
          name: r.name,
          next_execution: r.next_execution,
          phone_number: r.phone_number,
          report_type: r.report_type
        })) || [];

      return {
        total_reports: totalReports,
        active_reports: activeReports,
        total_executions: totalExecutions,
        success_rate: successRate,
        last_24h_executions: totalRecentLogs,
        next_executions: nextExecutions
      } as StatusStats;
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const formatNextExecution = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return 'Atrasado';
    } else if (diffHours < 1) {
      return `Em ${diffMins}min`;
    } else if (diffHours < 24) {
      return `Em ${diffHours}h ${diffMins}min`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'backup_alert':
        return 'bg-red-100 text-red-800';
      case 'schedule_critical':
        return 'bg-orange-100 text-orange-800';
      case 'glpi_summary':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Carregando status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total de Relatórios</p>
                <p className="text-2xl font-bold">{stats?.total_reports || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold">{stats?.active_reports || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Execuções</p>
                <p className="text-2xl font-bold">{stats?.total_executions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Taxa de Sucesso (24h)</p>
                <p className="text-2xl font-bold">{stats?.success_rate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Taxa de Sucesso Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance nas Últimas 24 Horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de Sucesso</span>
              <span className="text-sm font-medium">{stats?.success_rate?.toFixed(1) || 0}%</span>
            </div>
            <Progress value={stats?.success_rate || 0} className="h-2" />
            <div className="text-sm text-gray-500">
              {stats?.last_24h_executions || 0} execuções nas últimas 24 horas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximas Execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Execuções Agendadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.next_executions || stats.next_executions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma execução agendada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.next_executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{execution.name}</span>
                      <Badge variant="outline" className={getTypeColor(execution.report_type)}>
                        {execution.report_type}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      📱 {execution.phone_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Timer className="h-4 w-4" />
                      {formatNextExecution(execution.next_execution)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(execution.next_execution).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
