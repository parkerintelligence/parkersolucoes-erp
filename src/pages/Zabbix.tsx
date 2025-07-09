
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Globe, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCcw, 
  Settings,
  Webhook,
  TestTube,
  Server,
  AlertCircle
} from 'lucide-react';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { useZabbixWebhooks } from '@/hooks/useZabbixWebhooks';
import { ZabbixWebhookManager } from '@/components/ZabbixWebhookManager';
import { ZabbixWebhookTester } from '@/components/ZabbixWebhookTester';
import { toast } from '@/hooks/use-toast';

const Zabbix = () => {
  const { 
    hosts, 
    problems, 
    groups, 
    triggers,
    isLoading, 
    error, 
    isConfigured,
    integration,
    refetchAll
  } = useZabbixAPI();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!isConfigured) {
      toast({
        title: "Zabbix não configurado",
        description: "Configure a integração do Zabbix no painel de administração.",
        variant: "destructive",
      });
      return;
    }

    setRefreshing(true);
    try {
      console.log('🔄 Iniciando atualização manual do Zabbix...');
      await refetchAll();
      console.log('✅ Atualização do Zabbix concluída');
      
      toast({
        title: "Dados atualizados",
        description: "Informações do Zabbix foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro na atualização do Zabbix:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do Zabbix. Verifique a configuração.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getProblemSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'bg-red-100 text-red-800'; // Disaster
      case 4: return 'bg-orange-100 text-orange-800'; // High
      case 3: return 'bg-yellow-100 text-yellow-800'; // Average
      case 2: return 'bg-blue-100 text-blue-800'; // Warning
      case 1: return 'bg-gray-100 text-gray-800'; // Information
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProblemSeverityLabel = (severity: number) => {
    switch (severity) {
      case 5: return 'Desastre';
      case 4: return 'Alto';
      case 3: return 'Médio';
      case 2: return 'Alerta';
      case 1: return 'Informação';
      default: return 'Não classificado';
    }
  };

  const getHostStatus = (available: number) => {
    switch (available) {
      case 1: return { label: 'Disponível', color: 'bg-green-100 text-green-800' };
      case 2: return { label: 'Indisponível', color: 'bg-red-100 text-red-800' };
      default: return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <Globe className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Zabbix</h1>
            <p className="text-muted-foreground">
              Monitor de infraestrutura e alertas de sistema
            </p>
          </div>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Zabbix não configurado</h3>
            <p className="text-yellow-700 mb-4">
              Para usar o monitoramento do Zabbix, configure a integração no painel de administração.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              <Settings className="mr-2 h-4 w-4" />
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
            <Globe className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Zabbix</h1>
            <p className="text-muted-foreground">
              Monitor de infraestrutura e alertas de sistema
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing || isLoading}
          variant="outline"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing || isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              Verifique se o Zabbix está acessível em: {integration?.base_url}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hosts</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hosts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Hosts monitorados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{problems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Alertas em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Grupos de hosts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triggers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Triggers configurados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="problems" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="problems">Problemas</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="test">Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Problemas Ativos
              </CardTitle>
              <CardDescription>
                Lista de problemas em andamento no Zabbix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando problemas...</p>
                </div>
              ) : problems && problems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problems.map((problem) => (
                      <TableRow key={problem.eventid}>
                        <TableCell className="font-medium">
                          {problem.hosts?.[0]?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{problem.name}</TableCell>
                        <TableCell>
                          <Badge className={getProblemSeverityColor(parseInt(problem.severity))}>
                            {getProblemSeverityLabel(parseInt(problem.severity))}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={problem.r_eventid === '0' ? 'destructive' : 'secondary'}>
                            {problem.r_eventid === '0' ? 'Ativo' : 'Resolvido'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">Nenhum problema ativo</p>
                  <p className="text-sm">Todos os sistemas estão funcionando normalmente.</p>
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
                Lista de hosts sendo monitorados pelo Zabbix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando hosts...</p>
                </div>
              ) : hosts && hosts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grupos</TableHead>
                      <TableHead>Último Check</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts.map((host) => {
                      const status = getHostStatus(parseInt(host.available));
                      return (
                        <TableRow key={host.hostid}>
                          <TableCell className="font-medium">{host.name}</TableCell>
                          <TableCell>
                            {host.interfaces?.[0]?.ip || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {host.groups?.map(group => group.name).join(', ') || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {host.lastaccess ? 
                              new Date(parseInt(host.lastaccess) * 1000).toLocaleString('pt-BR') : 
                              'Nunca'
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhum host encontrado</p>
                  <p className="text-sm">Configure hosts no Zabbix para vê-los aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <ZabbixWebhookManager />
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          <ZabbixWebhookTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Zabbix;
