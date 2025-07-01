
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, AlertTriangle, Server, Wifi, Database, RefreshCw, Settings, CircleX } from 'lucide-react';
import { useZabbix } from '@/hooks/useZabbix';

const Zabbix = () => {
  const { 
    isConfigured, 
    isAuthenticated, 
    hosts, 
    problems, 
    items, 
    triggers,
    isLoading, 
    error, 
    authError,
    refetch 
  } = useZabbix();

  const getSeverityBadge = (severity: string) => {
    const severityNum = parseInt(severity);
    switch (severityNum) {
      case 5: // Disaster
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Desastre</Badge>;
      case 4: // High
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alta</Badge>;
      case 3: // Average
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Média</Badge>;
      case 2: // Warning
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Atenção</Badge>;
      case 1: // Information
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Informação</Badge>;
      case 0: // Not classified
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Não Classificada</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    const severityNum = parseInt(severity);
    switch (severityNum) {
      case 5: return 'bg-purple-50 border-l-purple-500';
      case 4: return 'bg-red-50 border-l-red-500';
      case 3: return 'bg-orange-50 border-l-orange-500';
      case 2: return 'bg-yellow-50 border-l-yellow-500';
      case 1: return 'bg-blue-50 border-l-blue-500';
      case 0: return 'bg-gray-50 border-l-gray-500';
      default: return 'bg-white';
    }
  };

  const getHostStatusBadge = (status: string, available: string) => {
    if (status === '0' && available === '1') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
    } else if (status === '0' && available === '2') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Indisponível</Badge>;
    } else if (status === '1') {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Desabilitado</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Desconhecido</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString('pt-BR');
  };

  const getStats = () => {
    const onlineHosts = hosts.filter(h => h.status === '0' && h.available === '1').length;
    const activeProblems = problems.filter(p => !p.r_clock || p.r_clock === '0').length;
    const highSeverityProblems = problems.filter(p => parseInt(p.severity) >= 4).length;
    const activeTriggers = triggers.filter(t => t.value === '1').length;

    return { onlineHosts, activeProblems, highSeverityProblems, activeTriggers };
  };

  const stats = getStats();

  if (!isConfigured) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Zabbix - Monitoramento
              </h1>
              <p className="text-blue-600">Monitoramento em tempo real da infraestrutura</p>
            </div>
          </div>

          <Alert>
            <Settings className="h-4 w-4" />
            <AlertTitle>Integração não configurada</AlertTitle>
            <AlertDescription>
              Configure a integração com o Zabbix no painel de administração para visualizar os dados de monitoramento.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (authError || (error && !isAuthenticated)) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Zabbix - Monitoramento
              </h1>
              <p className="text-blue-600">Monitoramento em tempo real da infraestrutura</p>
            </div>
            <Button onClick={refetch} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>

          <Alert variant="destructive">
            <CircleX className="h-4 w-4" />
            <AlertTitle>Erro de Conexão</AlertTitle>
            <AlertDescription>
              Não foi possível conectar ao Zabbix. Verifique as configurações de URL, usuário e senha.
              <br />
              <strong>Erro:</strong> {authError?.message || error?.message}
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Zabbix - Monitoramento
            </h1>
            <p className="text-blue-600">Monitoramento em tempo real da infraestrutura</p>
          </div>
          <Button onClick={refetch} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.onlineHosts}</p>
                  <p className="text-sm text-blue-600">Hosts Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.activeProblems}</p>
                  <p className="text-sm text-blue-600">Problemas Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.highSeverityProblems}</p>
                  <p className="text-sm text-blue-600">Alta Severidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.activeTriggers}</p>
                  <p className="text-sm text-blue-600">Triggers Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Problems */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Problemas Ativos
            </CardTitle>
            <CardDescription>Problemas que requerem atenção imediata</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2">Carregando problemas...</span>
              </div>
            ) : problems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum problema ativo encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {problems.slice(0, 20).map((problem) => (
                  <div 
                    key={problem.eventid} 
                    className={`p-4 rounded-lg border-l-4 ${getSeverityColor(problem.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-blue-900">{problem.name}</h4>
                          {getSeverityBadge(problem.severity)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Host: {problem.hosts?.[0]?.name || 'Desconhecido'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Iniciado: {formatTimestamp(problem.clock)}
                        </p>
                      </div>
                      {problem.acknowledged === '1' && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Reconhecido
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hosts Status */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Status dos Hosts</CardTitle>
              <CardDescription>Servidores monitorados pelo Zabbix</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2">Carregando hosts...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts.slice(0, 10).map((host) => (
                      <TableRow key={host.hostid} className="hover:bg-blue-50">
                        <TableCell className="font-medium">{host.name || host.host}</TableCell>
                        <TableCell>{host.interfaces?.[0]?.ip || 'N/A'}</TableCell>
                        <TableCell>{getHostStatusBadge(host.status, host.available)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Items Status */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Itens Monitorados</CardTitle>
              <CardDescription>Principais métricas coletadas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2">Carregando itens...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {items.slice(0, 15).map((item) => (
                    <div key={item.itemid} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.key_}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {item.lastvalue} {item.units}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.lastclock ? formatTimestamp(item.lastclock) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Triggers */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Triggers</CardTitle>
            <CardDescription>Regras de monitoramento configuradas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2">Carregando triggers...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Mudança</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {triggers.slice(0, 15).map((trigger) => (
                    <TableRow key={trigger.triggerid} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{trigger.description}</TableCell>
                      <TableCell>{trigger.hosts?.[0]?.name || 'N/A'}</TableCell>
                      <TableCell>{getSeverityBadge(trigger.priority)}</TableCell>
                      <TableCell>
                        {trigger.value === '1' ? (
                          <Badge className="bg-red-100 text-red-800 border-red-200">Problema</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 border-green-200">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatTimestamp(trigger.lastchange)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Zabbix;
