
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Monitor, 
  Users, 
  Activity, 
  Plus,
  RefreshCcw, 
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  Settings,
  Power,
  ExternalLink
} from 'lucide-react';
import { useGuacamoleAPI } from '@/hooks/useGuacamoleAPI';
import { toast } from '@/hooks/use-toast';

const Guacamole = () => {
  const { 
    useConnections, 
    useUsers, 
    useActiveSessions,
    useDeleteConnection,
    useDisconnectSession,
    isConfigured,
    integration 
  } = useGuacamoleAPI();

  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados do Guacamole
  const { data: connections = [], isLoading: connectionsLoading, refetch: refetchConnections, error: connectionsError } = useConnections();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers, error: usersError } = useUsers();
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions, error: sessionsError } = useActiveSessions();

  const deleteConnectionMutation = useDeleteConnection();
  const disconnectSessionMutation = useDisconnectSession();

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchConnections(),
        refetchUsers(),
        refetchSessions()
      ]);
      toast({
        title: "Dados atualizados",
        description: "Informações do Guacamole foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do Guacamole.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
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
      case 'rdp': return 'bg-blue-100 text-blue-800';
      case 'vnc': return 'bg-green-100 text-green-800';
      case 'ssh': return 'bg-purple-100 text-purple-800';
      case 'telnet': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Guacamole não configurado</h3>
            <p className="text-yellow-700 mb-4">
              Para usar o gerenciamento do Apache Guacamole, configure a integração no painel de administração.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              Configurar Guacamole
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
          <div className="bg-orange-100 p-2 rounded-lg">
            <Monitor className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Apache Guacamole</h1>
            <p className="text-muted-foreground">
              Gerencie conexões remotas e sessões ativas
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
      {(connectionsError || usersError || sessionsError) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erros de Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {connectionsError && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <strong>Erro ao buscar conexões:</strong> {connectionsError.message}
                </div>
              )}
              {usersError && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <strong>Erro ao buscar usuários:</strong> {usersError.message}
                </div>
              )}
              {sessionsError && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <strong>Erro ao buscar sessões:</strong> {sessionsError.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conexões Totais</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground">
              Conexões configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Conexões em uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">Conexões</TabsTrigger>
          <TabsTrigger value="sessions">Sessões Ativas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Conexões Configuradas
                  </CardTitle>
                  <CardDescription>
                    Lista de todas as conexões disponíveis no Guacamole
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conexão
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {connectionsLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando conexões...</p>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Nenhuma conexão encontrada</p>
                  <p className="text-sm text-muted-foreground">Configure suas primeiras conexões remotas.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Conexões Ativas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections.map((connection) => (
                      <TableRow key={connection.identifier}>
                        <TableCell className="font-medium">{connection.name}</TableCell>
                        <TableCell>
                          <Badge className={getProtocolColor(connection.protocol)}>
                            {connection.protocol?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {connection.parameters?.hostname || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={connection.activeConnections > 0 ? 'default' : 'secondary'}>
                            {connection.activeConnections || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteConnection(connection.identifier)}
                              disabled={deleteConnectionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Sessões Ativas
              </CardTitle>
              <CardDescription>
                Sessões atualmente conectadas ao Guacamole
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando sessões...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhuma sessão ativa</p>
                  <p className="text-sm">Todas as conexões estão desconectadas.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Conexão</TableHead>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{session.username || 'N/A'}</TableCell>
                        <TableCell>{session.connectionName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getProtocolColor(session.protocol)}>
                            {session.protocol?.toUpperCase() || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {session.startTime ? new Date(session.startTime).toLocaleString('pt-BR') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnectSession(session.id)}
                            disabled={disconnectSessionMutation.isPending}
                          >
                            <Power className="h-4 w-4" />
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

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários do Sistema
                  </CardTitle>
                  <CardDescription>
                    Lista de usuários cadastrados no Guacamole
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando usuários...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome de Usuário</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.username}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          {user.lastActive ? new Date(user.lastActive).toLocaleString('pt-BR') : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
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

export default Guacamole;
