import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, AlertTriangle, Server, Activity, TrendingUp } from "lucide-react";

interface ZabbixAnalysisDialogProps {
  problems: any[];
  hosts: any[];
}

const ZabbixAnalysisDialog = ({ problems, hosts }: ZabbixAnalysisDialogProps) => {
  // Análise de problemas por severidade
  const problemsBySeverity = problems.reduce((acc, problem) => {
    const severity = problem.severity || '0';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  // Análise de problemas por host
  const problemsByHost = problems.reduce((acc, problem) => {
    const hostName = problem.host_name || problem.hosts?.[0]?.name || 'Unknown';
    acc[hostName] = (acc[hostName] || 0) + 1;
    return acc;
  }, {});

  // Top 5 hosts com mais problemas
  const topProblemsHosts = Object.entries(problemsByHost)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Análise de hosts por status
  const hostsByStatus = hosts.reduce((acc, host) => {
    const available = host.available || '0';
    if (available === '1') acc.online = (acc.online || 0) + 1;
    else if (available === '2') acc.offline = (acc.offline || 0) + 1;
    else acc.unknown = (acc.unknown || 0) + 1;
    return acc;
  }, { online: 0, offline: 0, unknown: 0 });

  const getSeverityLabel = (severity: string) => {
    const labels = {
      '0': 'Não classificado',
      '1': 'Informação',
      '2': 'Aviso',
      '3': 'Média',
      '4': 'Alta',
      '5': 'Desastre'
    };
    return labels[severity as keyof typeof labels] || 'Desconhecido';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      '0': 'bg-muted text-muted-foreground',
      '1': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      '2': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      '3': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      '4': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      '5': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[severity as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Análise
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise do Ambiente Zabbix
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Resumo Geral */}
          <Card className="col-span-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Resumo Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{problems.length}</div>
                  <div className="text-sm text-muted-foreground">Problemas Ativos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{hosts.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Hosts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{hostsByStatus.online}</div>
                  <div className="text-sm text-muted-foreground">Hosts Online</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problemas por Severidade */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Por Severidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(problemsBySeverity)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <Badge variant="secondary" className={getSeverityColor(severity)}>
                    {getSeverityLabel(severity)}
                  </Badge>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
              {Object.keys(problemsBySeverity).length === 0 && (
                <div className="text-center text-muted-foreground text-sm">
                  Nenhum problema encontrado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status dos Hosts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4" />
                Status dos Hosts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Online
                </Badge>
                <span className="font-semibold">{hostsByStatus.online}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                  Offline
                </Badge>
                <span className="font-semibold">{hostsByStatus.offline}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  Desconhecido
                </Badge>
                <span className="font-semibold">{hostsByStatus.unknown}</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Hosts com Problemas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Hosts c/ Mais Problemas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProblemsHosts.length > 0 ? (
                topProblemsHosts.map(([hostName, count], index) => (
                  <div key={hostName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="text-sm truncate max-w-24" title={hostName}>
                        {hostName}
                      </span>
                    </div>
                    <span className="font-semibold text-destructive">{count as number}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  Nenhum problema por host
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZabbixAnalysisDialog;