import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCcw, 
  Monitor,
  Users,
  ExternalLink,
  Webhook,
  Search,
  Filter
} from 'lucide-react';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { ZabbixWebhookManager } from '@/components/ZabbixWebhookManager';
import { toast } from '@/hooks/use-toast';

const Zabbix = () => {
  const { 
    useHosts, 
    useProblems, 
    isConfigured,
    integration 
  } = useZabbixAPI();

  const { createTicket } = useGLPIExpanded();
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Carregar dados do Zabbix
  const { data: hosts = [], isLoading: hostsLoading, refetch: refetchHosts, error: hostsError } = useHosts();
  const { data: problems = [], isLoading: problemsLoading, refetch: refetchProblems, error: problemsError } = useProblems();

  // Debug information
  console.log('=== Zabbix Page Debug ===');
  console.log('isConfigured:', isConfigured);
  console.log('integration:', integration);
  console.log('hosts:', hosts);
  console.log('problems:', problems);
  console.log('errors:', { hostsError, problemsError });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchHosts(),
        refetchProblems()
      ]);
      toast({
        title: "Dados atualizados",
        description: "Informações do Zabbix foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do Zabbix.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateGLPITicket = async (problem: any) => {
    try {
      const ticketData = {
        name: `Zabbix Problem - ${problem.name}`,
        content: `Problema: ${problem.name}\nSeveridade: ${getSeverityLabel(problem.severity)}\nHost: ${problem.hosts?.[0]?.name || 'N/A'}\nData/Hora: ${new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}\nStatus: ${problem.acknowledged === '1' ? 'Reconhecido' : 'Novo'}\n\nEste chamado foi criado automaticamente a partir do monitoramento Zabbix.`,
        urgency: parseInt(problem.severity) >= 4 ? 4 : 3,
        impact: parseInt(problem.severity) >= 4 ? 4 : 3,
        priority: parseInt(problem.severity) >= 4 ? 4 : 3,
        status: 1,
        type: 1,
      };

      await createTicket.mutateAsync(ticketData);
      toast({
        title: "✅ Chamado GLPI criado!",
        description: "O chamado foi criado com sucesso no GLPI.",
      });
    } catch (error) {
      console.error('Erro ao criar chamado GLPI:', error);
      toast({
        title: "❌ Erro ao criar chamado",
        description: "Não foi possível criar o chamado no GLPI. Verifique a configuração.",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '5': return 'bg-red-600 text-white'; // Disaster
      case '4': return 'bg-red-500 text-white'; // High
      case '3': return 'bg-orange-500 text-white'; // Average
      case '2': return 'bg-yellow-500 text-black'; // Warning
      case '1': return 'bg-blue-500 text-white'; // Information
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case '5': return 'Desastre';
      case '4': return 'Alta';
      case '3': return 'Média';
      case '2': return 'Aviso';
      case '1': return 'Informação';
      default: return 'Desconhecida';
    }
  };

  // Função para determinar disponibilidade do host
  const getHostAvailability = (host: any) => {
    console.log('Host availability data:', {
      hostid: host.hostid,
      name: host.name,
      available: host.available,
      status: host.status,
      interfaces: host.interfaces
    });
    
    // Verificar se o host está habilitado primeiro
    if (host.status !== '0') {
      return { status: 'disabled', label: 'Desabilitado', color: 'bg-gray-600 text-white' };
    }
    
    // Verificar disponibilidade através das interfaces
    if (host.interfaces && host.interfaces.length > 0) {
      const mainInterface = host.interfaces.find(iface => iface.main === '1') || host.interfaces[0];
      console.log('Main interface:', mainInterface);
      
      if (mainInterface.available === '1') {
        return { status: 'available', label: 'Disponível', color: 'bg-green-600 text-white' };
      } else if (mainInterface.available === '2') {
        return { status: 'unavailable', label: 'Indisponível', color: 'bg-red-600 text-white' };
      } else if (mainInterface.available === '0') {
        return { status: 'unknown', label: 'Desconhecido', color: 'bg-yellow-600 text-white' };
      }
    }
    
    // Fallback para o campo available do host (se disponível)
    if (host.available === '1') {
      return { status: 'available', label: 'Disponível', color: 'bg-green-600 text-white' };
    } else if (host.available === '2') {
      return { status: 'unavailable', label: 'Indisponível', color: 'bg-red-600 text-white' };
    } else if (host.available === '0') {
      return { status: 'unknown', label: 'Desconhecido', color: 'bg-yellow-600 text-white' };
    }
    
    // Default para unknown se não conseguir determinar
    return { status: 'unknown', label: 'Desconhecido', color: 'bg-gray-600 text-white' };
  };

  // Agrupar hosts por grupo
  const groupedHosts = hosts.reduce((acc, host) => {
    const groupName = host.groups?.[0]?.name || 'Sem Grupo';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(host);
    return acc;
  }, {} as Record<string, typeof hosts>);

  // Agrupar problemas por host
  const groupedProblems = problems.reduce((acc, problem) => {
    const hostName = problem.hosts?.[0]?.name || 'Host Desconhecido';
    if (!acc[hostName]) {
      acc[hostName] = [];
    }
    acc[hostName].push(problem);
    return acc;
  }, {} as Record<string, typeof problems>);

  const renderHostsTable = (hostsToShow: typeof hosts) => (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-700 hover:bg-gray-800/50">
          <TableHead className="text-gray-300">Nome do Host</TableHead>
          <TableHead className="text-gray-300">IP/DNS</TableHead>
          <TableHead className="text-gray-300">Porta</TableHead>
          <TableHead className="text-gray-300">Status</TableHead>
          <TableHead className="text-gray-300">Disponibilidade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hostsToShow.map((host) => {
          const availability = getHostAvailability(host);
          const mainInterface = host.interfaces?.find(iface => iface.main === '1') || host.interfaces?.[0];
          return (
            <TableRow key={host.hostid} className="h-8 border-gray-700 hover:bg-gray-800/30">
              <TableCell className="font-medium py-2 text-gray-200">{host.name}</TableCell>
              <TableCell className="py-2 text-gray-300">
                {mainInterface?.ip || mainInterface?.dns || 'N/A'}
              </TableCell>
              <TableCell className="py-2 text-gray-300">
                {mainInterface?.port || 'N/A'}
              </TableCell>
              <TableCell className="py-2">
                <Badge className={host.status === '0' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                  {host.status === '0' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                <Badge className={availability.color}>
                  {availability.label}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <Card className="border-yellow-600 bg-yellow-900/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">Zabbix não configurado</h3>
            <p className="text-yellow-300 mb-4">
              Para usar o gerenciamento do Zabbix, configure a integração no painel de administração.
            </p>
            <button onClick={() => window.location.href = '/admin'} className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded border border-yellow-600">
              Configurar Zabbix
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciamento Zabbix</h1>
              <p className="text-gray-400">
                Monitore e gerencie seus hosts e problemas do Zabbix
              </p>
            </div>
          </div>
        </div>

        {/* Debug Section - Show errors if any */}
        {(hostsError || problemsError) && (
          <Card className="border-red-600 bg-red-900/20">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Erros de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {hostsError && (
                  <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-red-300">Erro ao buscar hosts:</strong> <span className="text-gray-300">{hostsError.message}</span>
                  </div>
                )}
                {problemsError && (
                  <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-red-300">Erro ao buscar problemas:</strong> <span className="text-gray-300">{problemsError.message}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Sessão com Filtros */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5" />
                  Sessão e Controles
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Status da conexão e filtros de dados
                </CardDescription>
              </div>
              <Button 
                onClick={handleRefreshAll} 
                disabled={refreshing}
                className="bg-blue-800 hover:bg-blue-700 text-white"
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white">Todos os status</SelectItem>
                  <SelectItem value="active" className="text-white">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-white">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Filtrar por severidade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white">Todas as severidades</SelectItem>
                  <SelectItem value="5" className="text-white">Desastre</SelectItem>
                  <SelectItem value="4" className="text-white">Alta</SelectItem>
                  <SelectItem value="3" className="text-white">Média</SelectItem>
                  <SelectItem value="2" className="text-white">Aviso</SelectItem>
                  <SelectItem value="1" className="text-white">Informação</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {problems.length} problema{problems.length !== 1 ? 's' : ''} | {hosts.length} host{hosts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Hosts Totais</CardTitle>
              <Server className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{hosts.length}</div>
              <p className="text-xs text-gray-400">
                {hosts.filter(h => h.status === '0').length} ativos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Problemas Ativos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{problems.length}</div>
              <p className="text-xs text-gray-400">
                {problems.filter(p => p.acknowledged === '0').length} não reconhecidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Status Geral</CardTitle>
              <Activity className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {problems.length === 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">OK</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Problemas</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="problems" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Problemas</TabsTrigger>
            <TabsTrigger value="hosts" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Hosts</TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Webhook className="mr-2 h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-5 w-5" />
                  Problemas Ativos
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Lista de problemas atualmente ativos no Zabbix organizados por host
                </CardDescription>
              </CardHeader>
              <CardContent>
                {problemsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">Carregando problemas...</p>
                  </div>
                ) : problems.length === 0 ? (
                  <div className="text-center py-8 text-green-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhum problema ativo!</p>
                    <p className="text-sm text-gray-400">Todos os sistemas estão funcionando normalmente.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedProblems).map(([hostName, hostProblems]) => (
                      <div key={hostName} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                        <div className="bg-gray-800 px-4 py-2 font-medium text-sm text-gray-200">
                          <Server className="inline-block h-4 w-4 mr-2" />
                          {hostName} ({hostProblems.length} problema{hostProblems.length !== 1 ? 's' : ''})
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-700 hover:bg-gray-800/50">
                              <TableHead className="text-gray-300">Problema</TableHead>
                              <TableHead className="text-gray-300">Severidade</TableHead>
                              <TableHead className="text-gray-300">Data/Hora</TableHead>
                              <TableHead className="text-gray-300">Status</TableHead>
                              <TableHead className="text-gray-300">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {hostProblems.map((problem) => (
                              <TableRow key={problem.eventid} className="h-8 border-gray-700 hover:bg-gray-800/30">
                                <TableCell className="font-medium py-2 text-gray-200">{problem.name}</TableCell>
                                <TableCell className="py-2">
                                  <Badge className={getSeverityColor(problem.severity)}>
                                    {getSeverityLabel(problem.severity)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2 text-gray-300">
                                  {new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}
                                </TableCell>
                                <TableCell className="py-2">
                                  {problem.acknowledged === '1' ? (
                                    <Badge className="bg-gray-600 text-white">Reconhecido</Badge>
                                  ) : (
                                    <Badge className="bg-red-600 text-white">Novo</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateGLPITicket(problem)}
                                    disabled={createTicket.isPending}
                                    className="bg-blue-800 hover:bg-blue-700 text-white p-2"
                                    title="Criar chamado no GLPI"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hosts" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Server className="h-5 w-5" />
                  Hosts Monitorados
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Lista de todos os hosts configurados no Zabbix
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hostsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">Carregando hosts...</p>
                  </div>
                ) : (
                  <Tabs defaultValue={Object.keys(groupedHosts)[0] || 'all'} className="w-full">
                    <TabsList className="grid w-full bg-gray-700 border-gray-600 mb-6" style={{gridTemplateColumns: `repeat(${Object.keys(groupedHosts).length}, minmax(0, 1fr))`}}>
                      {Object.keys(groupedHosts).map((groupName) => (
                        <TabsTrigger 
                          key={groupName} 
                          value={groupName}
                          className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-sm px-2"
                        >
                          {groupName}
                          <Badge variant="outline" className="ml-2 border-gray-500 text-gray-300">
                            {groupedHosts[groupName].length}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {Object.entries(groupedHosts).map(([groupName, groupHosts]) => (
                      <TabsContent key={groupName} value={groupName}>
                        <Tabs defaultValue="available" className="w-full">
                          <TabsList className="grid w-full grid-cols-4 bg-gray-700 border-gray-600 mb-4">
                            <TabsTrigger value="available" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Disponível
                              <Badge className="ml-2 bg-green-900/20 text-green-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'available').length}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="unavailable" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Indisponível
                              <Badge className="ml-2 bg-red-900/20 text-red-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'unavailable').length}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="unknown" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Desconhecido
                              <Badge className="ml-2 bg-yellow-900/20 text-yellow-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'unknown').length}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="disabled" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Desabilitado
                              <Badge className="ml-2 bg-gray-900/20 text-gray-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'disabled').length}
                              </Badge>
                            </TabsTrigger>
                          </TabsList>

                          {['available', 'unavailable', 'unknown', 'disabled'].map(status => (
                            <TabsContent key={status} value={status}>
                              {renderHostsTable(groupHosts.filter(host => getHostAvailability(host).status === status))}
                            </TabsContent>
                          ))}
                        </Tabs>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-6">
            <ZabbixWebhookManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Zabbix;
