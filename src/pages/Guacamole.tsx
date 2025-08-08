import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Monitor, Users, Activity, Plus, RefreshCcw, Power, AlertTriangle, Settings, ExternalLink, Grid, List, FileText, FolderOpen } from 'lucide-react';
import { useGuacamoleAPI, GuacamoleConnection } from '@/hooks/useGuacamoleAPI';
import { useGuacamoleLogs } from '@/hooks/useGuacamoleLogs';
import { GuacamoleConnectionCard } from '@/components/guacamole/GuacamoleConnectionCard';
import { GuacamoleStatusPopover } from '@/components/guacamole/GuacamoleStatusPopover';
import { GuacamoleConnectionTree } from '@/components/guacamole/GuacamoleConnectionTree';
import { GuacamoleConnectionDialog } from '@/components/guacamole/GuacamoleConnectionDialog';
import { GuacamoleLogs } from '@/components/guacamole/GuacamoleLogs';

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const Guacamole = () => {
  const {
    logs,
    clearLogs,
    logRequest,
    logResponse,
    logError,
    logInfo
  } = useGuacamoleLogs();
  
  const {
    useConnections,
    useUsers,
    useActiveSessions,
    useConnectionGroups,
    useConnectionHistory,
    useTestConnection,
    useCreateConnection,
    useUpdateConnection,
    useDeleteConnection,
    useDisconnectSession,
    isConfigured,
    integration
  } = useGuacamoleAPI((type, message, options) => {
    // Integrar logs do hook com o sistema de logs
    if (type === 'request') {
      logRequest(options?.method || 'GET', options?.url || '', options?.dataSource);
    } else if (type === 'response') {
      logResponse(options?.status || 200, message, options?.url, options?.details);
    } else if (type === 'error') {
      logError(message, options?.url, options?.details);
    } else {
      logInfo(message, options);
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [connectionDialog, setConnectionDialog] = useState<{
    open: boolean;
    connection?: GuacamoleConnection | null;
  }>({
    open: false
  });

  // Carregar dados do Guacamole
  const {
    data: connections = [],
    isLoading: connectionsLoading,
    refetch: refetchConnections,
    error: connectionsError
  } = useConnections();
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
    error: usersError
  } = useUsers();
  const {
    data: activeSessions = [],
    isLoading: sessionsLoading,
    refetch: refetchSessions,
    error: sessionsError
  } = useActiveSessions();
  const {
    data: connectionGroups = [],
    refetch: refetchGroups
  } = useConnectionGroups();
  const {
    data: connectionHistory = [],
    refetch: refetchHistory
  } = useConnectionHistory();
  const createConnectionMutation = useCreateConnection();
  const updateConnectionMutation = useUpdateConnection();
  const deleteConnectionMutation = useDeleteConnection();
  const disconnectSessionMutation = useDisconnectSession();
  const testConnectionMutation = useTestConnection();
  const handleRefreshAll = async () => {
    setRefreshing(true);
    logInfo('Iniciando atualização manual de todos os dados');
    try {
      await Promise.all([refetchConnections(), refetchUsers(), refetchSessions(), refetchGroups(), refetchHistory()]);
      logInfo('Atualização manual concluída com sucesso');
      toast({
        title: "Dados atualizados",
        description: "Informações do Guacamole foram atualizadas com sucesso."
      });
    } catch (error) {
      logError('Erro durante atualização manual', '', {
        error: error.message
      });
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do Guacamole.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  const handleConnectToGuacamole = async (connection: GuacamoleConnection) => {
    if (!integration?.base_url) {
      toast({
        title: "Erro de configuração",
        description: "URL base do Guacamole não configurada.",
        variant: "destructive"
      });
      return;
    }
    
    // Log da tentativa de conexão
    logInfo('Iniciando conexão direta ao Guacamole', {
      connectionId: connection.identifier,
      connectionName: connection.name,
      protocol: connection.protocol
    });

    try {
      // Tentar criar conexão direta com autenticação automática
      const { data: sessionData, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: {
          integrationId: integration.id,
          endpoint: `connect/${connection.identifier}`,
          method: 'POST'
        }
      });

      if (error) {
        console.error('Erro na função Edge:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (!sessionData?.result) {
        throw new Error('Resposta inválida do servidor');
      }

      const result = sessionData.result;
      
      // Log do método de conexão utilizado
      logInfo('Resposta da conexão recebida', {
        connectionId: result.connectionId,
        connectionName: result.connectionName,
        method: result.method,
        hasCredentials: result.hasCredentials,
        warning: result.warning
      });

      // Verificar se a conexão foi bem-sucedida
      if (!result.success || !result.sessionUrl) {
        throw new Error(result.warning || 'URL de sessão não fornecida');
      }

      // Abrir em nova aba com base no método de conexão
      window.open(result.sessionUrl, '_blank', 'noopener,noreferrer');

      // Mostrar toast informativo baseado no método
      let toastMessage = '';
      let toastDescription = '';
      
      switch (result.method) {
        case 'tunnel':
          toastMessage = 'Conectado com túnel!';
          toastDescription = `Conexão "${connection.name}" aberta com túnel direto. Autenticação automática ativa.`;
          break;
        case 'direct':
          toastMessage = result.hasCredentials ? 'Conectado com credenciais!' : 'Conectando...';
          toastDescription = result.hasCredentials 
            ? `Conexão "${connection.name}" aberta com credenciais incorporadas.`
            : `Conexão "${connection.name}" aberta. Pode ser necessário inserir credenciais.`;
          break;
        case 'fallback':
          toastMessage = 'Conectando (modo básico)';
          toastDescription = `Conexão "${connection.name}" aberta. Autenticação manual pode ser necessária.`;
          break;
        default:
          toastMessage = 'Conectando...';
          toastDescription = `Abrindo conexão "${connection.name}".`;
      }

      toast({
        title: toastMessage,
        description: toastDescription
      });

      // Se houver warning, mostrar como segundo toast
      if (result.warning) {
        setTimeout(() => {
          toast({
            title: "Atenção",
            description: result.warning,
            variant: "default"
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Erro ao conectar:', error);
      
      logError('Falha na conexão direta', '', {
        connectionId: connection.identifier,
        connectionName: connection.name,
        error: error.message
      });

      // Fallback final: URL básica do Guacamole
      try {
        const baseUrl = integration.base_url.replace(/\/$/, '');
        const fallbackUrl = `${baseUrl}/#/client/${encodeURIComponent(connection.identifier)}`;
        
        logInfo('Usando URL de fallback de emergência', {
          connectionId: connection.identifier,
          connectionName: connection.name,
          url: fallbackUrl
        });
        
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        
        toast({
          title: "Conectando (modo de emergência)",
          description: `Abrindo "${connection.name}" com autenticação manual necessária.`,
          variant: "default"
        });
        
      } catch (fallbackError) {
        console.error('Erro no fallback de emergência:', fallbackError);
        
        toast({
          title: "Erro na conexão",
          description: `Não foi possível conectar a "${connection.name}". Verifique a configuração do Guacamole.`,
          variant: "destructive"
        });
      }
    }
  };
  const handleCreateConnection = async (connectionData: Partial<GuacamoleConnection>) => {
    try {
      await createConnectionMutation.mutateAsync(connectionData);
      setConnectionDialog({
        open: false
      });
    } catch (error) {
      console.error('Erro ao criar conexão:', error);
    }
  };
  const handleUpdateConnection = async (connectionData: Partial<GuacamoleConnection>) => {
    console.log('Atualizando conexão:', connectionData);
    if (!connectionData.identifier) {
      toast({
        title: "Erro",
        description: "ID da conexão não encontrado",
        variant: "destructive"
      });
      return;
    }
    try {
      await updateConnectionMutation.mutateAsync({
        identifier: connectionData.identifier,
        updates: connectionData
      });
      setConnectionDialog({
        open: false,
        connection: null
      });
    } catch (error) {
      console.error('Erro ao atualizar conexão:', error);
    }
  };
  const handleDeleteConnection = async (identifier: string) => {
    if (!confirm('Tem certeza que deseja remover esta conexão?')) return;
    try {
      await deleteConnectionMutation.mutateAsync(identifier);
    } catch (error) {
      console.error('Erro ao deletar conexão:', error);
    }
  };
  const handleDisconnectSession = async (sessionId: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta sessão?')) return;
    try {
      await disconnectSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      console.error('Erro ao desconectar sessão:', error);
    }
  };
  const getProtocolColor = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'vnc':
        return 'bg-green-400/20 text-green-300 border-green-400/30';
      case 'ssh':
        return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
      case 'telnet':
        return 'bg-orange-400/20 text-orange-300 border-orange-400/30';
      default:
        return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
    }
  };
  if (!isConfigured) {
    return <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Monitor className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Conexão Remota</h1>
              <p className="text-slate-400">
                Gerencie conexões remotas e sessões ativas do Guacamole
              </p>
            </div>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Guacamole não configurado</h3>
              <p className="text-slate-400 mb-4">
                Para usar o gerenciamento do Apache Guacamole, configure a integração no painel de administração.
              </p>
              <Button variant="outline" asChild className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar Guacamole
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Monitor className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Conexão Remota</h1>
              <p className="text-slate-400">
                Gerencie conexões remotas e sessões ativas do Guacamole
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GuacamoleStatusPopover connections={connections} users={users} activeSessions={activeSessions} connectionGroups={connectionGroups} />
            <Button onClick={handleRefreshAll} disabled={refreshing} variant="outline" className="border-slate-600 text-slate-50 bg-slate-900 hover:bg-slate-800">
              <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>


        {/* Error Display */}
        {(connectionsError || usersError || sessionsError) && <Card className="bg-red-900/20 border-red-800/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Erros de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {connectionsError && <div className="bg-red-900/30 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-red-300">Erro ao buscar conexões:</strong> 
                    <span className="text-red-400 ml-2">{connectionsError.message}</span>
                  </div>}
                {usersError && <div className="bg-red-900/30 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-red-300">Erro ao buscar usuários:</strong> 
                    <span className="text-red-400 ml-2">{usersError.message}</span>
                  </div>}
                {sessionsError && <div className="bg-red-900/30 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-red-300">Erro ao buscar sessões:</strong> 
                    <span className="text-red-400 ml-2">{sessionsError.message}</span>
                  </div>}
              </div>
            </CardContent>
          </Card>}


        {/* Main Content */}
        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="connections" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Conexões ({connections?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Sessões Ativas ({activeSessions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Usuários ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Histórico
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Monitor className="h-5 w-5" />
                      Conexões Configuradas
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Gerencie e acesse suas conexões do Guacamole
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex border border-slate-600 rounded-md">
                      <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="bg-slate-700 text-white border-slate-600">
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="bg-slate-700 text-white border-slate-600">
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={() => setConnectionDialog({
                    open: true
                  })} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Conexão
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {connectionsLoading ? <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                    <p className="text-slate-300">Carregando conexões...</p>
                  </div> : !connections || connections.length === 0 ? <div className="text-center py-8">
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg font-medium text-white">Nenhuma conexão encontrada</p>
                    <p className="text-sm text-slate-400 mb-4">Configure suas primeiras conexões remotas.</p>
                    <Button onClick={() => setConnectionDialog({
                  open: true
                })} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Conexão
                    </Button>
                  </div> : viewMode === 'grid' ? <GuacamoleConnectionTree connections={connections} connectionGroups={connectionGroups} onConnect={handleConnectToGuacamole} onEdit={conn => setConnectionDialog({
                open: true,
                connection: conn
              })} onDelete={handleDeleteConnection} isDeleting={deleteConnectionMutation.isPending} /> : <div className="bg-slate-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Nome</TableHead>
                          <TableHead className="text-slate-300">Protocolo</TableHead>
                          <TableHead className="text-slate-300">Host</TableHead>
                          <TableHead className="text-slate-300">Conexões Ativas</TableHead>
                          <TableHead className="text-slate-300">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connections.map(connection => <TableRow key={connection.identifier} className="border-slate-700">
                            <TableCell className="font-medium text-white">{connection.name}</TableCell>
                            <TableCell>
                              <Badge className={getProtocolColor(connection.protocol)}>
                                {connection.protocol?.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {connection.parameters?.hostname || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={connection.activeConnections > 0 ? 'default' : 'secondary'}>
                                {connection.activeConnections || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleConnectToGuacamole(connection)} className="bg-blue-600 hover:bg-blue-700">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5" />
                  Sessões Ativas
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sessões atualmente conectadas ao Guacamole
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                    <p className="text-slate-300">Carregando sessões...</p>
                  </div> : !activeSessions || activeSessions.length === 0 ? <div className="text-center py-8 text-slate-400">
                    <Activity className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium text-white">Nenhuma sessão ativa</p>
                    <p className="text-sm">Todas as conexões estão desconectadas.</p>
                  </div> : <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Usuário</TableHead>
                        <TableHead className="text-slate-300">Conexão</TableHead>
                        <TableHead className="text-slate-300">Protocolo</TableHead>
                        <TableHead className="text-slate-300">Início</TableHead>
                        <TableHead className="text-slate-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.map((session, index) => <TableRow key={index} className="border-slate-700">
                          <TableCell className="font-medium text-white">{session.username || 'N/A'}</TableCell>
                          <TableCell className="text-slate-300">{session.connectionName || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getProtocolColor(session.protocol)}>
                              {session.protocol?.toUpperCase() || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {session.startTime ? new Date(session.startTime).toLocaleString('pt-BR') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleDisconnectSession(session.id)} disabled={disconnectSessionMutation.isPending} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                              <Power className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  Usuários do Sistema
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Lista de usuários cadastrados no Guacamole
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                    <p className="text-slate-300">Carregando usuários...</p>
                  </div> : <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Nome de Usuário</TableHead>
                        <TableHead className="text-slate-300">Última Atividade</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.map(user => <TableRow key={user.username} className="border-slate-700">
                          <TableCell className="font-medium text-white">{user.username}</TableCell>
                          <TableCell className="text-slate-300">
                            {user.lastActive ? new Date(user.lastActive).toLocaleString('pt-BR') : 'Nunca'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-emerald-600 text-white">Ativo</Badge>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Histórico de Conexões
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Registro de conexões realizadas no Guacamole
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Conexão</TableHead>
                      <TableHead className="text-slate-300">Usuário</TableHead>
                      <TableHead className="text-slate-300">Início</TableHead>
                      <TableHead className="text-slate-300">Fim</TableHead>
                      <TableHead className="text-slate-300">Duração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectionHistory && connectionHistory.length > 0 ? connectionHistory.map((record, index) => <TableRow key={index} className="border-slate-700">
                          <TableCell className="font-medium text-white">{record.connectionName}</TableCell>
                          <TableCell className="text-slate-300">{record.username}</TableCell>
                          <TableCell className="text-slate-300">
                            {record.startDate ? new Date(record.startDate).toLocaleString('pt-BR') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {record.endDate ? new Date(record.endDate).toLocaleString('pt-BR') : 'Em andamento'}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {record.duration ? `${Math.round(record.duration / 60)} min` : 'N/A'}
                          </TableCell>
                        </TableRow>) : <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          <FileText className="h-12 w-12 mx-auto mb-4" />
                          <p className="text-lg font-medium text-white">Nenhum registro encontrado</p>
                          <p className="text-sm">O histórico aparecerá conforme as conexões forem utilizadas.</p>
                        </TableCell>
                      </TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <GuacamoleLogs logs={logs} onClearLogs={clearLogs} onRefresh={handleRefreshAll} />
          </TabsContent>

        </Tabs>

        {/* Connection Dialog */}
        <GuacamoleConnectionDialog open={connectionDialog.open} onOpenChange={open => setConnectionDialog({
        open,
        connection: null
      })} connection={connectionDialog.connection} onSave={connectionDialog.connection ? handleUpdateConnection : handleCreateConnection} isSaving={createConnectionMutation.isPending || updateConnectionMutation.isPending} />
      </div>
    </div>;
};
export default Guacamole;