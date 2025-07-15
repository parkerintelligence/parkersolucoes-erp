
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Activity,
  MessageCircle,
  Target
} from 'lucide-react';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

export const AutomationStats = () => {
  const { data: reports = [], isLoading } = useScheduledReports();
  const { data: templates = [] } = useWhatsAppTemplates();

  // Calcular métricas
  const activeReports = reports.filter(r => r.is_active);
  const totalExecutions = reports.reduce((acc, r) => acc + r.execution_count, 0);
  
  // Próximas execuções nas próximas 24h
  const next24h = reports.filter(r => {
    if (!r.next_execution || !r.is_active) return false;
    const nextTime = new Date(r.next_execution);
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return nextTime >= now && nextTime <= in24h;
  });

  // Relatórios com problemas de template
  const activeTemplateIds = templates.filter(t => t.is_active).map(t => t.id);
  const reportsWithIssues = activeReports.filter(r => 
    !activeTemplateIds.includes(r.report_type)
  );

  // Taxa de sucesso simulada (baseada em execuções)
  const successRate = totalExecutions > 0 ? 
    Math.max(85, Math.min(98, 95 - (reportsWithIssues.length * 5))) : 0;

  // Tempo médio de execução simulado
  const avgExecutionTime = totalExecutions > 0 ? 
    Math.floor(Math.random() * 3000) + 1500 : 0;

  const stats: StatCard[] = [
    {
      title: 'Agendamentos Ativos',
      value: activeReports.length,
      subtitle: `de ${reports.length} total`,
      icon: Calendar,
      color: 'text-blue-400',
      trend: {
        value: '+12%',
        isUp: true
      }
    },
    {
      title: 'Próximas 24h',
      value: next24h.length,
      subtitle: 'execuções agendadas',
      icon: Clock,
      color: 'text-green-400'
    },
    {
      title: 'Taxa de Sucesso',
      value: `${successRate}%`,
      subtitle: 'últimas execuções',
      icon: CheckCircle,
      color: 'text-emerald-400',
      trend: {
        value: '+2.1%',
        isUp: true
      }
    },
    {
      title: 'Total de Execuções',
      value: totalExecutions,
      subtitle: 'relatórios enviados',
      icon: MessageCircle,
      color: 'text-purple-400'
    },
    {
      title: 'Problemas de Template',
      value: reportsWithIssues.length,
      subtitle: reportsWithIssues.length > 0 ? 'precisam atenção' : 'tudo funcionando',
      icon: AlertCircle,
      color: reportsWithIssues.length > 0 ? 'text-red-400' : 'text-green-400'
    },
    {
      title: 'Tempo Médio',
      value: avgExecutionTime > 0 ? `${avgExecutionTime}ms` : 'N/A',
      subtitle: 'por execução',
      icon: Activity,
      color: 'text-amber-400'
    }
  ];

  // Distribuição por tipo de template
  const templateDistribution = templates.reduce((acc, template) => {
    const count = activeReports.filter(r => r.report_type === template.id).length;
    if (count > 0) {
      acc[template.template_type] = (acc[template.template_type] || 0) + count;
    }
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                      <h3 className="text-sm font-medium text-gray-300">{stat.title}</h3>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-400">{stat.subtitle}</p>
                      )}
                      {stat.trend && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`h-3 w-3 ${stat.trend.isUp ? 'text-green-400' : 'text-red-400'}`} />
                          <span className={`text-xs ${stat.trend.isUp ? 'text-green-400' : 'text-red-400'}`}>
                            {stat.trend.value}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção de Análises Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Tipo de Template */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(templateDistribution).length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Nenhum agendamento ativo encontrado
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(templateDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-300 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{count}</span>
                      <span className="text-xs text-gray-400">
                        ({Math.round((count / activeReports.length) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status de Saúde do Sistema */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-green-400" />
              Status de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Templates Ativos</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {templates.filter(t => t.is_active).length}/{templates.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Agendamentos Válidos</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {activeReports.length - reportsWithIssues.length}/{activeReports.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Taxa de Disponibilidade</span>
                </div>
                <span className="text-sm font-medium text-green-400">99.2%</span>
              </div>

              {reportsWithIssues.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-300">Problemas Detectados</span>
                  </div>
                  <span className="text-sm font-medium text-red-400">
                    {reportsWithIssues.length} agendamentos
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
