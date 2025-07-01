import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, Server, Wifi, Database, RefreshCw, Settings, CircleX, Clock, TrendingUp, Zap, CheckCircle, Shield, Users, BarChart3, Globe, Cpu, HardDrive, Network, Timer } from 'lucide-react';
import { useZabbix } from '@/hooks/useZabbix';
import { ZabbixSettings } from '@/components/ZabbixSettings';
import { useState } from 'react';

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

  const [activeTab, setActiveTab] = useState('dashboard');

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

  const formatUptime = (seconds: string) => {
    const totalSeconds = parseInt(seconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getItemTypeIcon = (type: string) => {
    const typeNum = parseInt(type);
    switch (typeNum) {
      case 0: return <Zap className="h-4 w-4" />; // Zabbix agent
      case 3: return <Globe className="h-4 w-4" />; // Simple check
      case 7: return <Network className="h-4 w-4" />; // Zabbix agent (active)
      case 10: return <Database className="h-4 w-4" />; // External check
      case 11: return <Database className="h-4 w-4" />; // Database monitor
      case 13: return <Server className="h-4 w-4" />; // SSH agent
      case 14: return <Server className="h-4 w-4" />; // Telnet agent
      case 15: return <BarChart3 className="h-4 w-4" />; // Calculated
      case 16: return <Database className="h-4 w-4" />; // JMX agent
      case 17: return <Network className="h-4 w-4" />; // SNMP trap
      case 18: return <Cpu className="h-4 w-4" />; // Dependent item
      case 19: return <Globe className="h-4 w-4" />; // HTTP agent
      case 20: return <Network className="h-4 w-4" />; // SNMP agent
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getItemTypeName = (type: string) => {
    const typeNum = parseInt(type);
    switch (typeNum) {
      case 0: return 'Zabbix Agent';
      case 3: return 'Simple Check';
      case 7: return 'Zabbix Agent (Ativo)';
      case 10: return 'External Check';
      case 11: return 'Database Monitor';
      case 13: return 'SSH Agent';
      case 14: return 'Telnet Agent';
      case 15: return 'Calculated';
      case 16: return 'JMX Agent';
      case 17: return 'SNMP Trap';
      case 18: return 'Dependent Item';
      case 19: return 'HTTP Agent';
      case 20: return 'SNMP Agent';
      default: return `Tipo ${type}`;
    }
  };

  const getStats = () => {
    const onlineHosts = hosts.filter(h => h.status === '0' && h.available === '1').length;
    const offlineHosts = hosts.filter(h => h.status === '0' && h.available === '2').length;
    const disabledHosts = hosts.filter(h => h.status === '1').length;
    const activeProblems = problems.filter(p => !p.r_clock || p.r_clock === '0').length;
    const highSeverityProblems = problems.filter(p => parseInt(p.severity) >= 4).length;
    const mediumSeverityProblems = problems.filter(p => parseInt(p.severity) === 3).length;
    const lowSeverityProblems = problems.filter(p => parseInt(p.severity) <= 2).length;
    const acknowledgedProblems = problems.filter(p => p.acknowledged === '1').length;
    const activeTriggers = triggers.filter(t => t.value === '1').length;
    const totalTriggers = triggers.length;
    const enabledTriggers = triggers.filter(t => t.status === '0').length;
    const disabledTriggers = triggers.filter(t => t.status === '1').length;
    const activeItems = items.filter(i => i.status === '0').length;
    const totalItems = items.length;
    const disabledItems = items.filter(i => i.status === '1').length;

    return { 
      onlineHosts, 
      offlineHosts, 
      disabledHosts,
      activeProblems, 
      highSeverityProblems, 
      mediumSeverityProblems,
      lowSeverityProblems,
      acknowledgedProblems,
      activeTriggers, 
      totalTriggers,
      enabledTriggers,
      disabledTriggers,
      activeItems,
      totalItems,
      disabledItems
    };
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
            <AlertTitle>Configuração Necessária</AlertTitle>
            <AlertDescription>
              Configure a conexão com o Zabbix para começar a monitorar sua infraestrutura.
            </AlertDescription>
          </Alert>

          <ZabbixSettings />
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
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('settings')} variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
              <Button onClick={refetch} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          </div>

          <Alert variant="destructive">
            <CircleX className="h-4 w-4" />
            <AlertTitle>Erro de Conexão</AlertTitle>
            <AlertDescription>
              Não foi possível conectar ao Zabbix. Verifique as configurações de URL e API Token.
              <br />
              <strong>Erro:</strong> {authError?.message || error?.message}
            </AlertDescription>
          </Alert>

          <ZabbixSettings />
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
          <div className="flex gap-2">
            <Button 
              onClick={() => setActiveTab('settings')} 
              variant="outline"
              className={activeTab === 'settings' ? 'bg-blue-50' : ''}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button onClick={refetch} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="hosts">Hosts</TabsTrigger>
            <TabsTrigger value="problems">Problemas</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">{stats.onlineHosts}</p>
                      <p className="text-sm text-green-600">Hosts Online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold text-red-700">{stats.offlineHosts}</p>
                      <p className="text-sm text-red-600">Hosts Offline</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-orange-700">{stats.activeProblems}</p>
                      <p className="text-sm text-orange-600">Problemas Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold text-purple-700">{stats.highSeverityProblems}</p>
                      <p className="text-sm text-purple-600">Alta Severidade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-blue-700">{stats.activeTriggers}</p>
                      <p className="text-sm text-blue-600">Triggers Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-2xl font-bold text-gray-700">{stats.activeItems}</p>
                      <p className="text-sm text-gray-600">Itens Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hosts Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700 flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Estatísticas de Hosts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online</span>
                    <Badge className="bg-green-100 text-green-800">{stats.onlineHosts}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Offline</span>
                    <Badge className="bg-red-100 text-red-800">{stats.offlineHosts}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Desabilitados</span>
                    <Badge className="bg-gray-100 text-gray-800">{stats.disabledHosts}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total</span>
                    <Badge className="bg-blue-100 text-blue-800">{hosts.length}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Problems Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Problemas por Severidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Alta Severidade</span>
                    <Badge className="bg-red-100 text-red-800">{stats.highSeverityProblems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Média Severidade</span>
                    <Badge className="bg-orange-100 text-orange-800">{stats.mediumSeverityProblems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Baixa Severidade</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{stats.lowSeverityProblems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reconhecidos</span>
                    <Badge className="bg-blue-100 text-blue-800">{stats.acknowledgedProblems}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Triggers & Items Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Triggers & Itens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Triggers Ativos</span>
                    <Badge className="bg-red-100 text-red-800">{stats.activeTriggers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Triggers</span>
                    <Badge className="bg-blue-100 text-blue-800">{stats.totalTriggers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Itens Ativos</span>
                    <Badge className="bg-green-100 text-green-800">{stats.activeItems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Itens</span>
                    <Badge className="bg-gray-100 text-gray-800">{stats.totalItems}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Problems and Top Hosts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Problems */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">Problemas Recentes</CardTitle>
                  <CardDescription>Últimos 8 problemas detectados</CardDescription>
                </CardHeader>
                <CardContent>
                  {problems.slice(0, 8).map((problem) => (
                    <div key={problem.eventid} className={`p-3 mb-2 rounded border-l-4 ${getSeverityColor(problem.severity)}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{problem.name}</p>
                          <p className="text-xs text-gray-600">{problem.hosts?.[0]?.name}</p>
                          <p className="text-xs text-gray-500">{formatTimestamp(problem.clock)}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getSeverityBadge(problem.severity)}
                          {problem.acknowledged === '1' && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Reconhecido</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Host Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Status dos Hosts</CardTitle>
                  <CardDescription>Resumo detalhado dos hosts</CardDescription>
                </CardHeader>
                <CardContent>
                  {hosts.slice(0, 8).map((host) => (
                    <div key={host.hostid} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{host.name || host.host}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600">{host.interfaces?.[0]?.ip}</p>
                          {host.interfaces?.[0]?.port && (
                            <p className="text-xs text-gray-500">:{host.interfaces[0].port}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {getHostStatusBadge(host.status, host.available)}
                        {host.error && (
                          <p className="text-xs text-red-600 max-w-32 truncate" title={host.error}>
                            {host.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hosts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Hosts Monitorados ({hosts.length})
                </CardTitle>
                <CardDescription>Lista completa de todos os hosts no Zabbix</CardDescription>
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
                        <TableHead>Nome do Host</TableHead>
                        <TableHead>Nome Técnico</TableHead>
                        <TableHead>Endereço IP</TableHead>
                        <TableHead>Porta</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Disponibilidade</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hosts.map((host) => (
                        <TableRow key={host.hostid} className="hover:bg-blue-50">
                          <TableCell className="font-medium">{host.name}</TableCell>
                          <TableCell className="font-mono text-sm">{host.host}</TableCell>
                          <TableCell>{host.interfaces?.[0]?.ip || 'N/A'}</TableCell>
                          <TableCell>{host.interfaces?.[0]?.port || 'N/A'}</TableCell>
                          <TableCell>{getHostStatusBadge(host.status, host.available)}</TableCell>
                          <TableCell>
                            {host.available === '1' ? (
                              <Badge className="bg-green-100 text-green-800">Disponível</Badge>
                            ) : host.available === '2' ? (
                              <Badge className="bg-red-100 text-red-800">Indisponível</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-48">
                            <span className="text-xs text-red-600 truncate block" title={host.error}>
                              {host.error || 'N/A'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problems" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Problemas Ativos ({problems.length})
                </CardTitle>
                <CardDescription>Todos os problemas que requerem atenção</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2">Carregando problemas...</span>
                  </div>
                ) : problems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Nenhum problema ativo encontrado</p>
                    <p className="text-sm">Todos os sistemas estão funcionando normalmente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {problems.map((problem) => (
                      <div key={problem.eventid} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(problem.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-blue-900">{problem.name}</h4>
                              {getSeverityBadge(problem.severity)}
                              {problem.acknowledged === '1' && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  Reconhecido
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <p><strong>Host:</strong> {problem.hosts?.[0]?.name || 'Desconhecido'}</p>
                              </div>
                              <div>
                                <p><strong>Iniciado:</strong> {formatTimestamp(problem.clock)}</p>
                              </div>
                              <div>
                                <p><strong>ID do Evento:</strong> {problem.eventid}</p>
                              </div>
                              <div>
                                <p><strong>Object ID:</strong> {problem.objectid}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Itens Monitorados ({items.length})
                </CardTitle>
                <CardDescription>Métricas e dados coletados pelos hosts</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2">Carregando itens...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.itemid} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getItemTypeIcon(item.type)}
                            <p className="font-medium text-blue-900">{item.name}</p>
                            <Badge variant={item.status === '0' ? 'default' : 'secondary'}>
                              {item.status === '0' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-mono">{item.key_}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>ID: {item.itemid}</span>
                            <span>Tipo: {getItemTypeName(item.type)}</span>
                            <span>Value Type: {item.value_type}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-700">
                            {item.lastvalue || 'N/A'} {item.units}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.lastclock ? formatTimestamp(item.lastclock) : 'Nunca coletado'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triggers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Triggers Configurados ({triggers.length})
                </CardTitle>
                <CardDescription>Regras de monitoramento e alertas</CardDescription>
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
                        <TableHead>Estado Atual</TableHead>
                        <TableHead>Última Mudança</TableHead>
                        <TableHead>ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {triggers.map((trigger) => (
                        <TableRow key={trigger.triggerid} className="hover:bg-blue-50">
                          <TableCell className="font-medium max-w-xs">
                            <div className="truncate" title={trigger.description}>
                              {trigger.description}
                            </div>
                          </TableCell>
                          <TableCell>{trigger.hosts?.[0]?.name || 'N/A'}</TableCell>
                          <TableCell>{getSeverityBadge(trigger.priority)}</TableCell>
                          <TableCell>
                            <Badge variant={trigger.status === '0' ? 'default' : 'secondary'}>
                              {trigger.status === '0' ? 'Habilitado' : 'Desabilitado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trigger.value === '1' ? (
                              <Badge className="bg-red-100 text-red-800 border-red-200">Problema</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-green-200">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatTimestamp(trigger.lastchange)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">
                            {trigger.triggerid}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            {/* Real-time Monitoring Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas Críticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {problems.filter(p => parseInt(p.severity) >= 4).slice(0, 5).map((problem) => (
                    <div key={problem.eventid} className="flex items-center justify-between p-3 mb-2 bg-red-50 border border-red-200 rounded">
                      <div>
                        <p className="font-medium text-sm text-red-900">{problem.name}</p>
                        <p className="text-xs text-red-600">{problem.hosts?.[0]?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(problem.severity)}
                        <Clock className="h-4 w-4 text-red-500" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Saúde do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Disponibilidade Geral</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(stats.onlineHosts / hosts.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {hosts.length > 0 ? Math.round((stats.onlineHosts / hosts.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Triggers Ativos</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${triggers.length > 0 ? (stats.activeTriggers / triggers.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {triggers.length > 0 ? Math.round((stats.activeTriggers / triggers.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {items.filter(item => 
                    item.key_.includes('cpu') || 
                    item.key_.includes('memory') || 
                    item.key_.includes('disk') || 
                    item.key_.includes('network')
                  ).slice(0, 8).map((item) => (
                    <div key={item.itemid} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        {item.key_.includes('cpu') && <Cpu className="h-4 w-4 text-blue-500" />}
                        {item.key_.includes('memory') && <HardDrive className="h-4 w-4 text-green-500" />}
                        {item.key_.includes('disk') && <Database className="h-4 w-4 text-orange-500" />}
                        {item.key_.includes('network') && <Network className="h-4 w-4 text-purple-500" />}
                        <p className="text-sm font-medium truncate">{item.name}</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {item.lastvalue || 'N/A'} {item.units}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.lastclock ? formatTimestamp(item.lastclock) : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <ZabbixSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Zabbix;
