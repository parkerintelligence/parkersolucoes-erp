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
  Database
} from 'lucide-react';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { toast } from '@/hooks/use-toast';

const Zabbix = () => {
  const { 
    useHosts, 
    useProblems, 
    useTriggers, 
    useAcknowledgeProblem, 
    useToggleHost,
    isConfigured,
    integration 
  } = useZabbixAPI();

  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados do Zabbix
  const { data: hosts = [], isLoading: hostsLoading, refetch: refetchHosts, error: hostsError } = useHosts();
  const { data: problems = [], isLoading: problemsLoading, refetch: refetchProblems, error: problemsError } = useProblems();
  const { data: triggers = [], isLoading: triggersLoading, refetch: refetchTriggers, error: triggersError } = useTriggers();

  // Debug information
  console.log('=== Zabbix Page Debug ===');
  console.log('isConfigured:', isConfigured);
  console.log('integration:', integration);
  console.log('hosts:', hosts);
  console.log('problems:', problems);
  console.log('triggers:', triggers);
  console.log('errors:', { hostsError, problemsError, triggersError });

  const acknowledgeProblemMutation = useAcknowledgeProblem();
  const toggleHostMutation = useToggleHost();

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchHosts(),
        refetchProblems(),
        refetchTriggers()
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

  const handleToggleHost = async (hostid: string, currentStatus: string) => {
    const newStatus = currentStatus === '0' ? 1 : 0; // 0 = enabled, 1 = disabled
    try {
      await toggleHostMutation.mutateAsync({
        hostid,
        status: newStatus
      });
    } catch (error) {
      console.error('Erro ao alterar status do host:', error);
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
      {(hostsError || problemsError || triggersError) && (
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
              {triggersError && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <strong>Erro ao buscar triggers:</strong> {triggersError.message}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Triggers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers.length}</div>
            <p className="text-xs text-muted-foreground">
              {triggers.filter(t => t.status === '0').length} habilitados
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="problems">Problemas</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Problemas Ativos
              </CardTitle>
              <CardDescription>
                Lista de problemas atualmente ativos no Zabbix
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Problema</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problems.map((problem) => (
                      <TableRow key={problem.eventid}>
                        <TableCell className="font-medium">{problem.name}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(problem.severity)}>
                            {getSeverityLabel(problem.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {problem.hosts?.[0]?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {problem.acknowledged === '1' ? (
                            <Badge variant="secondary">Reconhecido</Badge>
                          ) : (
                            <Badge variant="destructive">Novo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                Lista de todos os hosts configurados no Zabbix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hostsLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando hosts...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Host</TableHead>
                      <TableHead>IP/DNS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disponibilidade</TableHead>
                      <TableHead>Grupos</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts.map((host) => (
                      <TableRow key={host.hostid}>
                        <TableCell className="font-medium">{host.name}</TableCell>
                        <TableCell>
                          {host.interfaces?.[0]?.ip || host.interfaces?.[0]?.dns || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={host.status === '0' ? 'default' : 'secondary'}>
                            {host.status === '0' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={host.available === '1' ? 'default' : 'destructive'}>
                            {host.available === '1' ? 'Disponível' : 'Indisponível'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {host.groups?.map(group => group.name).join(', ') || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleHost(host.hostid, host.status)}
                            disabled={toggleHostMutation.isPending}
                          >
                            {host.status === '0' ? 'Desabilitar' : 'Habilitar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Triggers Configurados
              </CardTitle>
              <CardDescription>
                Lista de triggers que monitoram condições específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {triggersLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando triggers...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Alteração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triggers.map((trigger) => (
                      <TableRow key={trigger.triggerid}>
                        <TableCell className="font-medium">{trigger.description}</TableCell>
                        <TableCell>
                          {trigger.hosts?.[0]?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(trigger.priority)}>
                            {getSeverityLabel(trigger.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trigger.status === '0' ? 'default' : 'secondary'}>
                            {trigger.status === '0' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trigger.value === '1' ? 'destructive' : 'default'}>
                            {trigger.value === '1' ? 'Problema' : 'OK'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(parseInt(trigger.lastchange) * 1000).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Zabbix;