
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server, 
  Activity,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ZabbixDashboard = () => {
  const { hosts, problems, items, triggers, isLoading, refetchAll } = useZabbixIntegration();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '5': return 'bg-red-600 text-white';
      case '4': return 'bg-red-500 text-white';  
      case '3': return 'bg-orange-500 text-white';
      case '2': return 'bg-yellow-500 text-white';
      case '1': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityText = (severity: string) => {
    const severityMap: Record<string, string> = {
      '5': 'Desastre',
      '4': 'Alto',
      '3': 'Médio',
      '2': 'Aviso',
      '1': 'Informação',
      '0': 'Não classificado'
    };
    return severityMap[severity] || 'Desconhecido';
  };

  const getHostStatus = (available: string) => {
    switch (available) {
      case '1': return { text: 'Disponível', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case '2': return { text: 'Indisponível', color: 'bg-red-100 text-red-800', icon: XCircle };
      default: return { text: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  // Estatísticas calculadas
  const totalHosts = hosts.length;
  const availableHosts = hosts.filter(h => h.available === '1').length;
  const totalProblems = problems.length;
  const criticalProblems = problems.filter(p => ['4', '5'].includes(p.severity)).length;
  const acknowledgedProblems = problems.filter(p => p.acknowledged === '1').length;
  const hostAvailability = totalHosts > 0 ? Math.round((availableHosts / totalHosts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Hosts</p>
                <p className="text-2xl font-bold text-blue-600">{totalHosts}</p>
              </div>
              <Server className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disponibilidade</p>
                <p className="text-2xl font-bold text-green-600">{hostAvailability}%</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={hostAvailability} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Problemas Ativos</p>
                <p className="text-2xl font-bold text-orange-600">{totalProblems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticos</p>
                <p className="text-2xl font-bold text-red-600">{criticalProblems}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={refetchAll}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Problemas Críticos */}
      {criticalProblems > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticos ({criticalProblems})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {problems
              .filter(p => ['4', '5'].includes(p.severity))
              .slice(0, 5)
              .map((problem) => (
                <div key={problem.eventid} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-red-900">{problem.name}</div>
                    <div className="text-sm text-gray-600">
                      Host: {problem.hosts[0]?.name || 'Desconhecido'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(parseInt(problem.clock) * 1000), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(problem.severity)}>
                      {getSeverityText(problem.severity)}
                    </Badge>
                    {problem.acknowledged === '1' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Reconhecido
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Status dos Hosts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Server className="h-5 w-5" />
              Status dos Hosts ({totalHosts})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {hosts.slice(0, 10).map((host) => {
              const status = getHostStatus(host.available);
              const StatusIcon = status.icon;
              return (
                <div key={host.hostid} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{host.name}</div>
                    <div className="text-sm text-gray-600">{host.host}</div>
                    {host.interfaces[0] && (
                      <div className="text-xs text-gray-500">
                        IP: {host.interfaces[0].ip}:{host.interfaces[0].port}
                      </div>
                    )}
                  </div>
                  <Badge className={status.color} variant="outline">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.text}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Problemas Recentes ({totalProblems})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {problems.slice(0, 10).map((problem) => (
              <div key={problem.eventid} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-medium truncate">{problem.name}</div>
                  <div className="text-sm text-gray-600">
                    {problem.hosts[0]?.name || 'Host desconhecido'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(parseInt(problem.clock) * 1000), 'dd/MM HH:mm', { locale: ptBR })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={getSeverityColor(problem.severity)} variant="outline">
                    {getSeverityText(problem.severity)}
                  </Badge>
                  {problem.acknowledged === '1' && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      OK
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Métricas Operacionais */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{availableHosts}/{totalHosts}</div>
              <div className="text-sm text-gray-600">Hosts Disponíveis</div>
              <Progress value={hostAvailability} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalProblems - acknowledgedProblems}</div>
              <div className="text-sm text-gray-600">Problemas Não Reconhecidos</div>
              <div className="text-xs text-gray-500 mt-1">
                {acknowledgedProblems} reconhecidos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{triggers.length}</div>
              <div className="text-sm text-gray-600">Triggers Ativas</div>
              <div className="text-xs text-gray-500 mt-1">
                {items.length} itens monitorados
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
