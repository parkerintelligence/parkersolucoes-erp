import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatwootStats } from '@/hooks/useChatwootStats';
import { MessageSquare, Clock, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const ChatwootStats = () => {
  const { stats, isLoading } = useChatwootStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Abertas',
      value: stats.open,
      icon: AlertTriangle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Resolvidas',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Tempo Médio',
      value: `${stats.avgResponseTime}min`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              {stat.title === 'Resolvidas' && stats.resolutionRate > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Taxa: {stats.resolutionRate}%
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
