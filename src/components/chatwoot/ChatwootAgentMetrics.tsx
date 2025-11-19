import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useChatwootAgentMetrics } from '@/hooks/useChatwootAgentMetrics';

export const ChatwootAgentMetrics = () => {
  const { data: metrics, isLoading } = useChatwootAgentMetrics();

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-3 text-slate-300">Carregando métricas dos agentes...</span>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum agente encontrado</p>
        </CardContent>
      </Card>
    );
  }

  // Ordenar por conversas ativas (maior primeiro)
  const sortedMetrics = [...metrics].sort(
    (a, b) => b.activeConversations - a.activeConversations
  );

  const formatResponseTime = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          Métricas por Agente
        </h2>
        <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600">
          {sortedMetrics.length} {sortedMetrics.length === 1 ? 'agente' : 'agentes'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedMetrics.map((agent) => (
          <Card 
            key={agent.agentId} 
            className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
          >
            <CardHeader className="pb-3 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {agent.avatarUrl && (
                    <AvatarImage src={agent.avatarUrl} alt={agent.agentName} />
                  )}
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {getInitials(agent.agentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base text-white truncate">
                    {agent.agentName}
                  </CardTitle>
                  <p className="text-xs text-slate-400 truncate">
                    {agent.agentEmail}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Conversas Totais */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400">Total de Conversas</span>
                  <span className="text-lg font-bold text-white">
                    {agent.totalConversations}
                  </span>
                </div>
              </div>

              {/* Conversas Ativas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Conversas Ativas
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="bg-green-600/20 text-green-400 border-green-600/30"
                  >
                    {agent.activeConversations}
                  </Badge>
                </div>
              </div>

              {/* Taxa de Resolução */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Taxa de Resolução
                  </span>
                  <span className="text-sm font-semibold text-blue-400">
                    {agent.resolutionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={agent.resolutionRate} 
                  className="h-2 bg-slate-700"
                />
              </div>

              {/* Tempo Médio de Resposta */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tempo Médio
                  </span>
                  <span className="text-sm font-semibold text-purple-400">
                    {formatResponseTime(agent.averageResponseTime)}
                  </span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="pt-2 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-slate-500">Abertas</div>
                    <div className="text-sm font-semibold text-green-400">
                      {agent.conversationsByStatus.open || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Pendentes</div>
                    <div className="text-sm font-semibold text-yellow-400">
                      {agent.conversationsByStatus.pending || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Resolvidas</div>
                    <div className="text-sm font-semibold text-blue-400">
                      {agent.conversationsByStatus.resolved || 0}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
