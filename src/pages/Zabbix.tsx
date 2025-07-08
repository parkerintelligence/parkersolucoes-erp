
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCcw, 
  Monitor,
  Shield,
  Clock,
  Users,
  Database,
  ExternalLink
} from 'lucide-react';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from '@/hooks/use-toast';

const Zabbix = () => {
  const { 
    useHosts, 
    useProblems, 
    useAcknowledgeProblem, 
    isConfigured,
    integration 
  } = useZabbixAPI();

  const { createTicket } = useGLPIExpanded();
  const [refreshing, setRefreshing] = useState(false);

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

  const acknowledgeProblemMutation = useAcknowledgeProblem();

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

  const handleAcknowledgeProblem = async (eventid: string) => {
    try {
      await acknowledgeProblemMutation.mutateAsync({
        eventids: [eventid],
        message: "Problema reconhecido via interface web"
      });
    } catch (error) {
      console.error('Erro ao reconhecer problema:', error);
    }
  };

  const handleCreateGLPITicket = async (host: any, type: 'host' | 'problem', problem?: any) => {
    try {
      let ticketData;
      
      if (type === 'host') {
        ticketData = {
          name: `Zabbix Host Issue - ${host.name}`,
          content: `Host: ${host.name}\nStatus: ${host.status === '0' ? 'Ativo' : 'Inativo'}\nDisponibilidade: ${host.available === '1' ? 'Disponível' : 'Indisponível'}\nIP: ${host.interfaces?.[0]?.ip || 'N/A'}\nGrupos: ${host.groups?.map(g => g.name).join(', ') || 'N/A'}\n\nEste chamado foi criado automaticamente a partir do monitoramento Zabbix.`,
          urgency: host.available === '0' ? 4 : 3,
          impact: 3,
          priority: host.available === '0' ? 4 : 3,
          status: 1,
          type: 1,
        };
      } else if (type === 'problem' && problem) {
        ticketData = {
          name: `Zabbix Problem - ${problem.name}`,
          content: `Problema: ${problem.name}\nSeveridade: ${getSeverityLabel(problem.severity)}\nHost: ${problem.hosts?.[0]?.name || 'N/A'}\nData/Hora: ${new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}\nStatus: ${problem.acknowledged === '1' ? 'Reconhecido' : 'Novo'}\n\nEste chamado foi criado automaticamente a partir do monitoramento Zabbix.`,
          urgency: parseInt(problem.severity) >= 4 ? 4 : 3,
          impact: parseInt(problem.severity) >= 4 ? 4 : 3,
          priority: parseInt(problem.severity) >= 4 ? 4 : 3,
          status: 1,
          type: 1,
        };
      }

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
      case '5': return 'destructive'; // Disaster
      case '4': return 'destructive'; // High
      case '3': return 'secondary'; // Average
      case '2': return 'outline'; // Warning
      case '1': return 'outline'; // Information
      default: return 'outline';
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

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Zabbix não configurado</h3>
            <p className="text-yellow-700 mb-4">
              Para usar o gerenciamento do Zabbix, configure a integração no painel de administração.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              Configurar Zabbix
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <Monitor className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciamento Zabbix</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie seus hosts e problemas do Zabbix
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRefreshAll} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Debug Section - Show errors if any */}
      {(hostsError || problemsError) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erros de Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {hostsError && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <strong>Erro ao buscar hosts:</strong> {hostsError.message}
                  {hostsError.message.includes('404') && (
                    <div className="mt-2 text-xs text-red-600">
                      <strong>Erro 404:</strong> A API do Zabbix não foi encontrada. Verifique se:
                      <ul className="ml-4 mt-1 list-disc">
                        <li>A URL base está correta (deve apontar para seu servidor Zabbix)</li>
                        <li>O Zabbix está rodando e acessível</li>
                        <li>O caminho /api_jsonrpc.php existe no servidor</li>
                        <li>Não há problemas de firewall ou DNS</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {problemsError && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <strong>Erro ao buscar problemas:</strong> {problemsError.message}
                </div>
              )}
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <strong>Dicas de solução:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Verifique se o Zabbix está acessível via HTTPS</li>
                  <li>• Confirme se as credenciais estão corretas</li>
                  <li>• Verifique se a API está habilitada no Zabbix</li>
                  <li>• Consulte os logs do navegador para mais detalhes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Debug Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Informações de Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>URL Base:</strong> {integration?.base_url || 'Não configurada'}
            </div>
            <div>
              <strong>Status:</strong> {integration?.is_active ? 'Ativa' : 'Inativa'}
            </div>
            <div>
              <strong>Método de Auth:</strong> {integration?.api_token ? 'API Token' : integration?.username ? 'Usuário/Senha' : 'Não configurado'}
            </div>
            <div>
              <strong>Integração ID:</strong> {integration?.id || 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hosts Totais</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hosts.length}</div>
            <p className="text-xs text-muted-foreground">
              {hosts.filter(h => h.status === '0').length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{problems.length}</div>
            <p className="text-xs text-muted-foreground">
              {problems.filter(p => p.acknowledged === '0').length} não reconhecidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {problems.length === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">OK</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Problemas</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="problems" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="problems">Problemas</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Problemas Ativos
              </CardTitle>
              <CardDescription>
                Lista de problemas atualmente ativos no Zabbix organizados por host
              </CardDescription>
            </CardHeader>
            <CardContent>
              {problemsLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando problemas...</p>
                </div>
              ) : problems.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhum problema ativo!</p>
                  <p className="text-sm">Todos os sistemas estão funcionando normalmente.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedProblems).map(([hostName, hostProblems]) => (
                    <div key={hostName} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-2 font-medium text-sm">
                        <Server className="inline-block h-4 w-4 mr-2" />
                        {hostName} ({hostProblems.length} problema{hostProblems.length !== 1 ? 's' : ''})
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Problema</TableHead>
                            <TableHead>Severidade</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hostProblems.map((problem) => (
                            <TableRow key={problem.eventid} className="h-12">
                              <TableCell className="font-medium py-2">{problem.name}</TableCell>
                              <TableCell className="py-2">
                                <Badge variant={getSeverityColor(problem.severity)}>
                                  {getSeverityLabel(problem.severity)}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                {new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell className="py-2">
                                {problem.acknowledged === '1' ? (
                                  <Badge variant="secondary">Reconhecido</Badge>
                                ) : (
                                  <Badge variant="destructive">Novo</Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex gap-2">
                                  {problem.acknowledged === '0' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAcknowledgeProblem(problem.eventid)}
                                      disabled={acknowledgeProblemMutation.isPending}
                                    >
                                      Reconhecer
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCreateGLPITicket(null, 'problem', problem)}
                                    disabled={createTicket.isPending}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    GLPI
                                  </Button>
                                </div>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Hosts Monitorados
              </CardTitle>
              <CardDescription>
                Lista de todos os hosts configurados no Zabbix organizados por grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hostsLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando hosts...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedHosts).map(([groupName, groupHosts]) => (
                    <div key={groupName} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-2 font-medium text-sm">
                        <Users className="inline-block h-4 w-4 mr-2" />
                        {groupName} ({groupHosts.length} host{groupHosts.length !== 1 ? 's' : ''})
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Host</TableHead>
                            <TableHead>IP/DNS</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Disponibilidade</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupHosts.map((host) => (
                            <TableRow key={host.hostid} className="h-12">
                              <TableCell className="font-medium py-2">{host.name}</TableCell>
                              <TableCell className="py-2">
                                {host.interfaces?.[0]?.ip || host.interfaces?.[0]?.dns || 'N/A'}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant={host.status === '0' ? 'default' : 'secondary'}>
                                  {host.status === '0' ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant={host.available === '1' ? 'default' : 'destructive'}>
                                  {host.available === '1' ? 'Disponível' : 'Indisponível'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateGLPITicket(host, 'host')}
                                  disabled={createTicket.isPending}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  GLPI
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
      </Tabs>
    </div>
  );
};

export default Zabbix;
