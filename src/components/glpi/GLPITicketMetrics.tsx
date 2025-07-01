
import { GLPIMetricsCard } from './GLPIMetricsCard';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Timer,
  AlertCircle,
  Target
} from 'lucide-react';

interface TicketMetricsProps {
  tickets: any[];
}

export const GLPITicketMetrics = ({ tickets }: TicketMetricsProps) => {
  const stats = {
    total: tickets.filter(t => t.status !== 6).length,
    critical: tickets.filter(t => t.priority >= 5).length,
    high: tickets.filter(t => t.priority === 4).length,
    inProgress: tickets.filter(t => t.status === 2 || t.status === 3).length,
    pending: tickets.filter(t => t.status === 4).length,
    resolved: tickets.filter(t => t.status === 5).length,
    new: tickets.filter(t => t.status === 1).length,
  };

  const averageResolutionTime = 24; // Mock data - seria calculado dos dados reais
  const slaCompliance = stats.total > 0 ? ((stats.resolved / stats.total) * 100) : 0;
  const backlog = stats.inProgress + stats.pending + stats.new;
  const escalationRate = stats.total > 0 ? ((stats.critical / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">📞 Gestão de Chamados</h3>
        <div className="text-sm text-gray-500">Atualizado há poucos minutos</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <GLPIMetricsCard
          title="Críticos"
          value={stats.critical}
          subtitle="Requer ação imediata"
          variant="danger"
          trend={stats.critical > 5 ? 'up' : stats.critical > 0 ? 'stable' : 'down'}
          trendValue={`${stats.critical}/total`}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Alta Prioridade"
          value={stats.high}
          subtitle="Próximos na fila"
          variant="warning"
          icon={<AlertCircle className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Em Andamento"
          value={stats.inProgress}
          subtitle="Sendo trabalhados"
          variant="info"
          icon={<Clock className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Pendentes"
          value={stats.pending}
          subtitle="Aguardando resposta"
          variant="warning"
          icon={<Timer className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Resolvidos"
          value={stats.resolved}
          subtitle="Finalizados hoje"
          variant="success"
          trend="up"
          trendValue="+12%"
          icon={<CheckCircle className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Novos"
          value={stats.new}
          subtitle="Aguardando triagem"
          variant="info"
          icon={<Users className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Backlog"
          value={backlog}
          subtitle="Total não resolvidos"
          variant={backlog > 50 ? 'danger' : backlog > 20 ? 'warning' : 'default'}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Total Abertos"
          value={stats.total}
          subtitle="Todos os chamados ativos"
          variant="default"
          icon={<Target className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <GLPIMetricsCard
          title="Tempo Médio Resolução"
          value={`${averageResolutionTime}h`}
          subtitle="Últimos 30 dias"
          variant="info"
          trend="down"
          trendValue="-2h"
          icon={<Clock className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="SLA Compliance"
          value={`${slaCompliance.toFixed(1)}%`}
          subtitle="Meta: 95%"
          variant={slaCompliance >= 95 ? 'success' : slaCompliance >= 85 ? 'warning' : 'danger'}
          progress={slaCompliance}
          icon={<Target className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Taxa de Escalação"
          value={`${escalationRate.toFixed(1)}%`}
          subtitle="Chamados escalados"
          variant={escalationRate > 15 ? 'danger' : escalationRate > 10 ? 'warning' : 'success'}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Produtividade"
          value="87%"
          subtitle="Eficiência da equipe"
          variant="success"
          progress={87}
          trend="up"
          trendValue="+5%"
          icon={<Users className="h-5 w-5" />}
        />
      </div>
    </div>
  );
};
