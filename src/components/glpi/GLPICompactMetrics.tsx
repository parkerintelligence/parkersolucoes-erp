import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp
} from 'lucide-react';

interface GLPICompactMetricsProps {
  tickets: any[];
  problems: any[];
  changes: any[];
}

export const GLPICompactMetrics = ({ tickets, problems, changes }: GLPICompactMetricsProps) => {
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter(t => t.status !== 6).length;
  const resolvedTickets = tickets.filter(t => t.status === 5).length;
  const criticalTickets = tickets.filter(t => t.priority >= 5).length;

  const metrics = [
    {
      title: 'Total',
      value: totalTickets,
      icon: AlertTriangle,
      color: 'text-glpi-text',
      bgColor: 'bg-glpi-surface-2'
    },
    {
      title: 'Ativos',
      value: activeTickets,
      icon: Clock,
      color: 'text-glpi-warning',
      bgColor: 'bg-glpi-warning/10'
    },
    {
      title: 'Resolvidos',
      value: resolvedTickets,
      icon: CheckCircle,
      color: 'text-glpi-success',
      bgColor: 'bg-glpi-success/10'
    },
    {
      title: 'Críticos',
      value: criticalTickets,
      icon: TrendingUp,
      color: 'text-glpi-error',
      bgColor: 'bg-glpi-error/10'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border-glpi-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-glpi-text-muted uppercase tracking-wide">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-glpi-text mt-1">
                  {metric.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};