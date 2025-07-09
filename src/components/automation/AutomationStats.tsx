
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ScheduledReport } from '@/hooks/useScheduledReports';

interface AutomationStatsProps {
  reports: ScheduledReport[];
}

export const AutomationStats = ({ reports }: AutomationStatsProps) => {
  const activeReports = reports.filter(r => r.is_active);
  const inactiveReports = reports.filter(r => !r.is_active);
  const totalExecutions = reports.reduce((sum, r) => sum + (r.execution_count || 0), 0);
  
  // Relatórios que executaram nas últimas 24 horas
  const recentExecutions = reports.filter(r => {
    if (!r.last_execution) return false;
    const lastExec = new Date(r.last_execution);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastExec > oneDayAgo;
  }).length;

  const stats = [
    {
      title: 'Agendamentos Ativos',
      value: activeReports.length,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Total de Execuções',
      value: totalExecutions,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Executados (24h)',
      value: recentExecutions,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Inativos',
      value: inactiveReports.length,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`border ${stat.borderColor}`}>
            <CardContent className={`p-4 ${stat.bgColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
