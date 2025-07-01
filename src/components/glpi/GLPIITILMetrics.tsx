
import { GLPIMetricsCard } from './GLPIMetricsCard';
import { 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Target,
  Shield,
  Activity
} from 'lucide-react';

interface ITILMetricsProps {
  problems: any[];
  changes: any[];
  tickets: any[];
}

export const GLPIITILMetrics = ({ problems, changes, tickets }: ITILMetricsProps) => {
  const totalTickets = tickets.filter(t => t.status !== 6).length;
  const resolved = tickets.filter(t => t.status === 5).length;
  const resolutionRate = totalTickets > 0 ? ((resolved / totalTickets) * 100) : 0;
  
  // Mock data para métricas ITIL avançadas
  const mttr = 4.2; // Mean Time To Resolution (horas)
  const mtbf = 168; // Mean Time Between Failures (horas)
  const availability = 99.2; // Disponibilidade do sistema (%)
  const changeSuccessRate = 94; // Taxa de sucesso de mudanças (%)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">🔄 Gestão ITIL</h3>
        <div className="text-sm text-gray-500">Processos e indicadores</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GLPIMetricsCard
          title="Problemas Ativos"
          value={problems.length}
          subtitle="Causas raiz identificadas"
          variant="warning"
          trend={problems.length > 5 ? 'up' : 'stable'}
          trendValue={`${problems.length} problemas`}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Mudanças Ativas"
          value={changes.length}
          subtitle="Alterações em andamento"
          variant="info"
          icon={<FileText className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Taxa de Resolução"
          value={`${resolutionRate.toFixed(1)}%`}
          subtitle="Eficiência geral"
          variant={resolutionRate >= 90 ? 'success' : resolutionRate >= 75 ? 'warning' : 'danger'}
          progress={resolutionRate}
          trend="up"
          trendValue="+2.3%"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GLPIMetricsCard
          title="MTTR"
          value={`${mttr}h`}
          subtitle="Tempo médio resolução"
          variant="success"
          trend="down"
          trendValue="-0.5h"
          icon={<Clock className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="MTBF"
          value={`${mtbf}h`}
          subtitle="Tempo entre falhas"
          variant="success"
          trend="up"
          trendValue="+12h"
          icon={<Activity className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Disponibilidade"
          value={`${availability}%`}
          subtitle="Uptime dos serviços"
          variant={availability >= 99 ? 'success' : availability >= 95 ? 'warning' : 'danger'}
          progress={availability}
          icon={<Shield className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Sucesso Mudanças"
          value={`${changeSuccessRate}%`}
          subtitle="Taxa de implementação"
          variant={changeSuccessRate >= 90 ? 'success' : changeSuccessRate >= 80 ? 'warning' : 'danger'}
          progress={changeSuccessRate}
          trend="up"
          trendValue="+1%"
          icon={<Target className="h-5 w-5" />}
        />
      </div>
    </div>
  );
};
