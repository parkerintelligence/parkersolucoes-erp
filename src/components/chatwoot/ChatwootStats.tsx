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
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-600/30',
    },
    {
      title: 'Abertas',
      value: stats.open,
      icon: AlertTriangle,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-600/30',
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-600/30',
    },
    {
      title: 'Resolvidas',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-600/30',
    },
    {
      title: 'Tempo Médio',
      value: `${stats.avgResponseTime}min`,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
      borderColor: 'border-orange-600/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={`${stat.bgColor} border ${stat.borderColor} bg-slate-800`}>
        <CardContent className="p-4 text-center">
          <Icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
          <div className={`text-2xl font-bold mb-0.5 ${stat.color}`}>
            {stat.value}
          </div>
          <div className="text-sm text-slate-300 font-medium">
            {stat.title}
          </div>
              {stat.title === 'Resolvidas' && stats.resolutionRate > 0 && (
                <p className="text-xs text-slate-400 mt-2">
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
