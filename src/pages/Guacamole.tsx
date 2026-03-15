import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Monitor, Activity, Plus, RefreshCcw, Power, AlertTriangle, Settings, ExternalLink, Grid, List, FileText, FolderOpen, Clock, User } from 'lucide-react';
import { useGuacamoleAPI, GuacamoleConnection } from '@/hooks/useGuacamoleAPI';
import { GuacamoleConnectionCard } from '@/components/guacamole/GuacamoleConnectionCard';
import { GuacamoleStatusPopover } from '@/components/guacamole/GuacamoleStatusPopover';
import { GuacamoleConnectionTree } from '@/components/guacamole/GuacamoleConnectionTree';
import { GuacamoleConnectionDialog } from '@/components/guacamole/GuacamoleConnectionDialog';
import { RustDeskPanel } from '@/components/rustdesk/RustDeskPanel';
import { useRustDeskConnections } from '@/hooks/useRustDesk';
import { useAuth } from '@/contexts/AuthContext';

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SessionLog {
  id: string;
  timestamp: string;
  source: 'remoto-pk' | 'servidores-rdp';
  connectionName: string;
  userName: string;
  userEmail: string;
  protocol?: string;
  details?: string;
}

const Guacamole = () => {
  const { user, userProfile } = useAuth();
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  // RustDesk connections
  const { data: rustDeskConnections = [] } = useRustDeskConnections();

  const addSessionLog = (source: SessionLog['source'], connectionName: string, protocol?: string, details?: string) => {
    const newLog: SessionLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      source,
      connectionName,
      userName: userProfile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Desconhecido',
      userEmail: userProfile?.email || user?.email || '',
      protocol,
      details,
    };
    setSessionLogs(prev => [newLog, ...prev]);
  };
  
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
  } = useGuacamoleAPI();
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
    try {
      await Promise.all([refetchConnections(), refetchUsers(), refetchSessions(), refetchGroups(), refetchHistory()]);
      toast({
        title: "Dados atualizados",
        description: "Informações foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados.",
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
      
      // Log session for history
      addSessionLog('servidores-rdp', connection.name, connection.protocol?.toUpperCase(), `Método: ${result.method}`);

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

      // Fallback final: URL básica do Guacamole
      try {
        const baseUrl = integration.base_url.replace(/\/$/, '');
        const fallbackUrl = `${baseUrl}/#/client/${encodeURIComponent(connection.identifier)}`;
        
        addSessionLog('servidores-rdp', connection.name, connection.protocol?.toUpperCase(), 'Fallback de emergência');
        
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
                Gerencie conexões remotas via Remoto PK e Servidores RDP
              </p>
            </div>
          </div>

          <Tabs defaultValue="rustdesk" className="space-y-4">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="rustdesk" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400">
                🖥️ Remoto PK
              </TabsTrigger>
              <TabsTrigger value="guacamole" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                Servidores RDP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guacamole" className="mt-6">
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
            </TabsContent>

            <TabsContent value="rustdesk" className="mt-6">
              <RustDeskPanel onSessionLog={(name, details) => addSessionLog('remoto-pk', name, 'RustDesk', details)} />
            </TabsContent>
          </Tabs>
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
                Gerencie conexões remotas via Remoto PK e Servidores RDP
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


        <Tabs defaultValue="rustdesk" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="rustdesk" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400">
              🖥️ Remoto PK
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Servidores RDP ({connections?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Sessões Ativas ({activeSessions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rustdesk" className="mt-6">
            <RustDeskPanel onSessionLog={(name, details) => addSessionLog('remoto-pk', name, 'RustDesk', details)} />
          </TabsContent>

          <TabsContent value="connections" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between bg-secondary/30 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Monitor className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">Servidores RDP</span>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">
                    {connections?.length || 0} conexões
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <div className="flex border border-border rounded-md">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-7 w-7 p-0">
                      <Grid className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 w-7 p-0">
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button onClick={() => setConnectionDialog({ open: true })} size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Nova Conexão
                  </Button>
                </div>
              </div>

              <div className="p-0">
                {connectionsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-xs text-muted-foreground">Carregando conexões...</p>
                  </div>
                ) : !connections || connections.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">Nenhuma conexão encontrada</p>
                    <p className="text-xs text-muted-foreground mb-3">Configure suas primeiras conexões remotas.</p>
                    <Button onClick={() => setConnectionDialog({ open: true })} size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Criar Primeira Conexão
                    </Button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="p-3">
                    <GuacamoleConnectionTree connections={connections} connectionGroups={connectionGroups} onConnect={handleConnectToGuacamole} onEdit={conn => setConnectionDialog({ open: true, connection: conn })} onDelete={handleDeleteConnection} onDisconnect={handleDisconnectSession} isDeleting={deleteConnectionMutation.isPending} />
                  </div>
                ) : (
                  <div>
                    {/* Column Header */}
                    <div className="grid grid-cols-[1fr_90px_140px_100px_80px] gap-0 px-4 py-2 bg-secondary/10 border-b border-border">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Protocolo</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Host</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ativas</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Ações</span>
                    </div>
                    {connections.map((connection, idx) => (
                      <div
                        key={connection.identifier}
                        className={`grid grid-cols-[1fr_90px_140px_100px_80px] gap-0 px-4 py-2 items-center border-b border-border/50 last:border-b-0 transition-colors ${idx % 2 === 0 ? 'bg-background hover:bg-primary/5' : 'bg-card hover:bg-primary/5'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Monitor className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">{connection.name}</span>
                        </div>
                        <div>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${getProtocolColor(connection.protocol)}`}>
                            {connection.protocol?.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground truncate" title={connection.parameters?.hostname}>
                          {connection.parameters?.hostname || 'N/A'}
                        </span>
                        <div>
                          <Badge variant={connection.activeConnections > 0 ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {connection.activeConnections || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => handleConnectToGuacamole(connection)} className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 bg-secondary/30 border-b border-border px-4 py-3">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground">Sessões Ativas</span>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">
                  {activeSessions?.length || 0}
                </Badge>
              </div>

              <div className="p-0">
                {sessionsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-xs text-muted-foreground">Carregando sessões...</p>
                  </div>
                ) : !activeSessions || activeSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">Nenhuma sessão ativa</p>
                    <p className="text-xs text-muted-foreground">Todas as conexões estão desconectadas.</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-[1fr_1fr_90px_140px_70px] gap-0 px-4 py-2 bg-secondary/10 border-b border-border">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Usuário</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conexão</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Protocolo</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Início</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Ações</span>
                    </div>
                    {activeSessions.map((session, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-[1fr_1fr_90px_140px_70px] gap-0 px-4 py-2 items-center border-b border-border/50 last:border-b-0 transition-colors ${index % 2 === 0 ? 'bg-background hover:bg-primary/5' : 'bg-card hover:bg-primary/5'}`}
                      >
                        <span className="text-xs font-medium text-foreground truncate">{session.username || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground truncate">{session.connectionName || 'N/A'}</span>
                        <div>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${getProtocolColor(session.protocol)}`}>
                            {session.protocol?.toUpperCase() || 'N/A'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {session.startTime ? new Date(session.startTime).toLocaleString('pt-BR') : 'N/A'}
                        </span>
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleDisconnectSession(session.id)} disabled={disconnectSessionMutation.isPending} className="h-6 w-6 p-0 border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Power className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between bg-secondary/30 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">Histórico de Sessões</span>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">
                    {sessionLogs.length + (connectionHistory?.length || 0)}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSessionLogs([])}>
                  Limpar
                </Button>
              </div>

              <div>
                {/* Column Header */}
                <div className="grid grid-cols-[140px_110px_1fr_80px_120px_1fr] gap-0 px-4 py-2 bg-secondary/10 border-b border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data/Hora</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Origem</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conexão</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Protocolo</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Usuário</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Detalhes</span>
                </div>

                {/* Session logs */}
                {sessionLogs.map((log, idx) => (
                  <div key={log.id} className={`grid grid-cols-[140px_110px_1fr_80px_120px_1fr] gap-0 px-4 py-2 items-center border-b border-border/50 last:border-b-0 transition-colors ${idx % 2 === 0 ? 'bg-background hover:bg-primary/5' : 'bg-card hover:bg-primary/5'}`}>
                    <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    <div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${log.source === 'remoto-pk' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {log.source === 'remoto-pk' ? '🖥️ Remoto PK' : '🖧 Servidor RDP'}
                      </Badge>
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">{log.connectionName}</span>
                    <div>
                      {log.protocol && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted">
                          {log.protocol}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate" title={log.userEmail}>{log.userName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{log.details || '-'}</span>
                  </div>
                ))}

                {/* Guacamole history */}
                {connectionHistory && connectionHistory.map((record, index) => {
                  const rowIdx = sessionLogs.length + index;
                  return (
                    <div key={`hist-${index}`} className={`grid grid-cols-[140px_110px_1fr_80px_120px_1fr] gap-0 px-4 py-2 items-center border-b border-border/50 last:border-b-0 transition-colors ${rowIdx % 2 === 0 ? 'bg-background hover:bg-primary/5' : 'bg-card hover:bg-primary/5'}`}>
                      <span className="text-xs text-muted-foreground">
                        {record.startDate ? new Date(record.startDate).toLocaleString('pt-BR') : 'N/A'}
                      </span>
                      <div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border bg-blue-500/10 text-blue-400 border-blue-500/20">
                          🖧 Servidor RDP
                        </Badge>
                      </div>
                      <span className="text-xs font-medium text-foreground truncate">{record.connectionName}</span>
                      <div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted">RDP</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{record.username || 'N/A'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {record.duration ? `Duração: ${Math.round(record.duration / 60)} min` : record.endDate ? 'Finalizado' : 'Em andamento'}
                      </span>
                    </div>
                  );
                })}

                {sessionLogs.length === 0 && (!connectionHistory || connectionHistory.length === 0) && (
                  <div className="text-center py-8">
                    <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">Nenhum registro encontrado</p>
                    <p className="text-xs text-muted-foreground">O histórico aparecerá conforme as conexões forem utilizadas.</p>
                  </div>
                )}
              </div>
            </div>
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