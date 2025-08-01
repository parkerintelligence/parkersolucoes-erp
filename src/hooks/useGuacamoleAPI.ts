import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

export interface GuacamoleConnection {
  identifier: string;
  name: string;
  protocol: string;
  parameters: Record<string, any>;
  attributes: Record<string, any>;
  activeConnections: number;
}

export interface GuacamoleUser {
  username: string;
  attributes: Record<string, any>;
  lastActive: string;
}

export interface GuacamoleSession {
  id: string;
  username: string;
  connectionName: string;
  protocol: string;
  startTime: string;
  remoteHost?: string;
  tunnel?: any;
}

export interface GuacamoleConnectionGroup {
  identifier: string;
  name: string;
  type: string;
  childConnections: string[];
  childConnectionGroups: string[];
  attributes: Record<string, any>;
}

export interface GuacamoleConnectionHistory {
  connectionIdentifier: string;
  connectionName: string;
  username: string;
  startDate: string;
  endDate?: string;
  duration?: number;
}

export const useGuacamoleAPI = (onLog?: (type: string, message: string, options?: any) => void) => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();

  const integration = integrations?.find(i => i.type === 'guacamole' && i.is_active);
  const isConfigured = Boolean(
    integration?.base_url && 
    integration?.username && 
    integration?.password
  );


  const callGuacamoleAPI = async (endpoint: string, options: any = {}) => {
    if (!integration) {
      const error = 'Integração do Guacamole não configurada';
      onLog?.('error', error);
      throw new Error(error);
    }

    const dataSource = integration.directory || 'postgresql';
    
    onLog?.('request', `Chamando API do Guacamole: ${endpoint}`, {
      integrationId: integration.id,
      baseUrl: integration.base_url,
      dataSource,
      endpoint,
      options
    });

    try {
      const { data, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: {
          integrationId: integration.id,
          endpoint,
          ...options
        }
      });

      onLog?.('info', 'Resposta da função Edge recebida', {
        hasData: !!data,
        hasError: !!error,
        dataType: typeof data
      });

      if (error) {
        onLog?.('error', `Erro na função Edge: ${error.message || 'Erro desconhecido'}`, {
          error,
          endpoint
        });
        throw new Error(`Erro na comunicação: ${error.message || 'Erro desconhecido'}`);
      }

      if (data?.error) {
        onLog?.('error', `Erro da API Guacamole: ${data.error}`, {
          error: data.error,
          details: data.details,
          endpoint,
          dataSource
        });
        
        // Invalidar cache em caso de erro de autenticação
        if (data.details?.status === 401 || data.details?.status === 403 || data.error.includes('Token')) {
          onLog?.('info', 'Invalidando cache devido a erro de autenticação');
          queryClient.invalidateQueries({ queryKey: ['guacamole'] });
        }
        
        throw new Error(data.error);
      }

      onLog?.('response', 'Resposta da API Guacamole bem-sucedida', {
        resultType: typeof data?.result,
        resultKeys: data?.result ? Object.keys(data.result) : [],
        endpoint,
        dataSource
      });

      return data?.result || {};
    } catch (error) {
      onLog?.('error', `Erro geral na chamada da API: ${error.message}`, {
        error: error.message,
        endpoint,
        dataSource
      });
      throw error;
    }
  };

  const useConnections = () => {
    return useQuery({
      queryKey: ['guacamole', 'connections', integration?.id],
      queryFn: async () => {
        onLog?.('info', 'Iniciando busca de conexões');
        const result = await callGuacamoleAPI('connections');
        
        onLog?.('info', 'Resultado bruto das conexões recebido', {
          resultType: typeof result,
          isArray: Array.isArray(result),
          resultKeys: result ? Object.keys(result) : []
        });
        
        if (Array.isArray(result)) {
          onLog?.('response', `${result.length} conexões encontradas (formato array)`);
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const connections = Object.keys(result).map(key => {
            const connectionData = result[key];
            return {
              identifier: key,
              name: connectionData?.name || key,
              protocol: connectionData?.protocol || 'unknown',
              parameters: connectionData?.parameters || {},
              attributes: connectionData?.attributes || {},
              activeConnections: connectionData?.activeConnections || 0
            };
          });
          
          // Buscar sessões ativas para atualizar status das conexões
          try {
            const sessionsResult = await callGuacamoleAPI('sessions');
            const activeSessions = Array.isArray(sessionsResult) ? sessionsResult : 
              (typeof sessionsResult === 'object' && sessionsResult !== null) ? Object.values(sessionsResult) : [];
            
            // Contar sessões ativas por conexão
            const sessionCounts = {};
            activeSessions.forEach(session => {
              if (session?.connectionIdentifier) {
                sessionCounts[session.connectionIdentifier] = (sessionCounts[session.connectionIdentifier] || 0) + 1;
              }
            });
            
            // Atualizar contadores de sessões ativas
            connections.forEach(connection => {
              connection.activeConnections = sessionCounts[connection.identifier] || 0;
            });
            
          } catch (sessionError) {
            onLog?.('warning', 'Erro ao buscar sessões ativas para atualizar status', { error: sessionError.message });
          }
          
          onLog?.('response', `${connections.length} conexões processadas (formato objeto)`, {
            connections: connections.map(c => ({ id: c.identifier, name: c.name, protocol: c.protocol, active: c.activeConnections }))
          });
          
          return connections;
        }
        
        onLog?.('info', 'Nenhuma conexão encontrada ou formato inesperado');
        return [];
      },
      enabled: isConfigured,
      staleTime: 30000,
      retry: (failureCount, error) => {
        onLog?.('info', `Tentativa ${failureCount + 1} de buscar conexões falhou`, {
          error: error.message,
          shouldRetry: failureCount < 2
        });
        
        // Não tentar novamente em caso de erros de configuração ou permissão
        if (error.message.includes('Configuração incompleta') || 
            error.message.includes('Credenciais inválidas') ||
            error.message.includes('URL base inválida') ||
            error.message.includes('ERRO DE PERMISSÕES') ||
            error.message.includes('Acesso negado')) {
          return false;
        }
        
        return failureCount < 2;
      },
      retryDelay: 2000,
    });
  };

  const useUsers = () => {
    return useQuery({
      queryKey: ['guacamole', 'users', integration?.id],
      queryFn: async () => {
        onLog?.('info', 'Iniciando busca de usuários');
        const result = await callGuacamoleAPI('users');
        
        if (Array.isArray(result)) {
          onLog?.('response', `${result.length} usuários encontrados (formato array)`);
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const users = Object.keys(result).map(username => ({
            username,
            attributes: result[username]?.attributes || {},
            lastActive: result[username]?.lastActive || null
          }));
          
          onLog?.('response', `${users.length} usuários processados (formato objeto)`);
          return users;
        }
        
        onLog?.('info', 'Nenhum usuário encontrado');
        return [];
      },
      enabled: isConfigured,
      staleTime: 60000,
      retry: (failureCount, error) => {
        onLog?.('info', `Tentativa ${failureCount + 1} de buscar usuários falhou`, {
          error: error.message
        });
        
        if (error.message.includes('Configuração incompleta') || 
            error.message.includes('Credenciais inválidas') ||
            error.message.includes('URL base inválida') ||
            error.message.includes('ERRO DE PERMISSÕES') ||
            error.message.includes('Acesso negado')) {
          return false;
        }
        
        return failureCount < 2;
      },
      retryDelay: 2000,
    });
  };

  const useActiveSessions = () => {
    return useQuery({
      queryKey: ['guacamole', 'sessions', integration?.id],
      queryFn: async () => {
        onLog?.('info', 'Iniciando busca de sessões ativas');
        const result = await callGuacamoleAPI('sessions');
        
        if (Array.isArray(result)) {
          onLog?.('response', `${result.length} sessões encontradas (formato array)`);
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const sessions = Object.keys(result).map(sessionId => ({
            id: sessionId,
            username: result[sessionId]?.username || 'unknown',
            connectionName: result[sessionId]?.connectionName || 'unknown',
            protocol: result[sessionId]?.protocol || 'unknown',
            startTime: result[sessionId]?.startTime || new Date().toISOString(),
            remoteHost: result[sessionId]?.remoteHost,
            tunnel: result[sessionId]?.tunnel
          }));
          
          onLog?.('response', `${sessions.length} sessões processadas (formato objeto)`);
          return sessions;
        }
        
        onLog?.('info', 'Nenhuma sessão ativa encontrada');
        return [];
      },
      enabled: isConfigured,
      staleTime: 10000,
      retry: (failureCount, error) => {
        onLog?.('info', `Tentativa ${failureCount + 1} de buscar sessões falhou`, {
          error: error.message
        });
        
        if (error.message.includes('Configuração incompleta') || 
            error.message.includes('Credenciais inválidas') ||
            error.message.includes('URL base inválida') ||
            error.message.includes('ERRO DE PERMISSÕES') ||
            error.message.includes('Acesso negado')) {
          return false;
        }
        
        return failureCount < 2;
      },
      retryDelay: 2000,
    });
  };

  const useConnectionGroups = () => {
    return useQuery({
      queryKey: ['guacamole', 'connectionGroups', integration?.id],
      queryFn: async () => {
        onLog?.('info', 'Iniciando busca de grupos de conexão');
        const result = await callGuacamoleAPI('connectionGroups');
        
        if (Array.isArray(result)) {
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const groups = Object.keys(result).map(groupId => ({
            identifier: groupId,
            name: result[groupId]?.name || groupId,
            type: result[groupId]?.type || 'organizational',
            childConnections: result[groupId]?.childConnections || [],
            childConnectionGroups: result[groupId]?.childConnectionGroups || [],
            attributes: result[groupId]?.attributes || {}
          }));
          
          onLog?.('response', `${groups.length} grupos processados`);
          return groups;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 60000,
      retry: (failureCount, error) => {
        if (error.message.includes('Configuração incompleta') || 
            error.message.includes('Credenciais inválidas') ||
            error.message.includes('ERRO DE PERMISSÕES')) {
          return false;
        }
        return failureCount < 2;
      },
    });
  };

  const useConnectionHistory = () => {
    return useQuery({
      queryKey: ['guacamole', 'history', integration?.id],
      queryFn: async () => {
        onLog?.('info', 'Iniciando busca de histórico de conexões');
        const result = await callGuacamoleAPI('history');
        
        if (Array.isArray(result)) {
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const history = Object.keys(result).map(recordId => ({
            connectionIdentifier: result[recordId]?.connectionIdentifier || 'unknown',
            connectionName: result[recordId]?.connectionName || 'unknown',
            username: result[recordId]?.username || 'unknown',
            startDate: result[recordId]?.startDate || new Date().toISOString(),
            endDate: result[recordId]?.endDate,
            duration: result[recordId]?.duration
          }));
          
          onLog?.('response', `${history.length} registros de histórico processados`);
          return history;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 120000, // 2 minutos
      retry: (failureCount, error) => {
        if (error.message.includes('Configuração incompleta') || 
            error.message.includes('Credenciais inválidas') ||
            error.message.includes('ERRO DE PERMISSÕES')) {
          return false;
        }
        return failureCount < 2;
      },
    });
  };

  const useTestConnection = () => {
    return useMutation({
      mutationFn: async (connectionId: string) => {
        onLog?.('info', 'Testando conectividade da conexão', { connectionId });
        return callGuacamoleAPI(`connections/${connectionId}/test`, { method: 'GET' });
      },
      onSuccess: (data, connectionId) => {
        onLog?.('response', 'Teste de conexão bem-sucedido', { connectionId });
        toast({
          title: "Teste bem-sucedido!",
          description: "A conexão está funcionando corretamente.",
        });
      },
      onError: (error: Error, connectionId) => {
        onLog?.('error', `Erro no teste de conexão: ${error.message}`, { connectionId });
        toast({
          title: "Teste falhou",
          description: error.message,
          variant: "destructive"
        });
      },
    });
  };

  return {
    useConnections,
    useUsers,
    useActiveSessions,
    useConnectionGroups,
    useConnectionHistory,
    useTestConnection,
    useCreateConnection: () => {
      return useMutation({
        mutationFn: (connectionData: Partial<GuacamoleConnection>) => {
          onLog?.('info', 'Criando nova conexão', { connectionData });
          return callGuacamoleAPI('connections', { 
            method: 'POST', 
            data: connectionData 
          });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['guacamole', 'connections'] });
          onLog?.('response', 'Conexão criada com sucesso');
          toast({
            title: "Conexão criada!",
            description: "A conexão foi criada com sucesso.",
          });
        },
        onError: (error: Error) => {
          onLog?.('error', `Erro ao criar conexão: ${error.message}`);
          toast({
            title: "Erro ao criar conexão",
            description: error.message,
            variant: "destructive"
          });
        },
      });
    },
    useUpdateConnection: () => {
      return useMutation({
        mutationFn: ({ identifier, updates }: { identifier: string; updates: Partial<GuacamoleConnection> }) => {
          onLog?.('info', 'Atualizando conexão', { identifier, updates });
          return callGuacamoleAPI(`connections/${identifier}`, { 
            method: 'PUT', 
            data: updates 
          });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['guacamole', 'connections'] });
          onLog?.('response', 'Conexão atualizada com sucesso');
          toast({
            title: "Conexão atualizada!",
            description: "A conexão foi atualizada com sucesso.",
          });
        },
        onError: (error: Error) => {
          onLog?.('error', `Erro ao atualizar conexão: ${error.message}`);
          toast({
            title: "Erro ao atualizar conexão",
            description: error.message,
            variant: "destructive"
          });
        },
      });
    },
    useDeleteConnection: () => {
      return useMutation({
        mutationFn: (identifier: string) => {
          onLog?.('info', 'Removendo conexão', { identifier });
          return callGuacamoleAPI(`connections/${identifier}`, { method: 'DELETE' });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['guacamole', 'connections'] });
          onLog?.('response', 'Conexão removida com sucesso');
          toast({
            title: "Conexão removida!",
            description: "A conexão foi removida com sucesso.",
          });
        },
        onError: (error: Error) => {
          onLog?.('error', `Erro ao remover conexão: ${error.message}`);
          toast({
            title: "Erro ao remover conexão",
            description: error.message,
            variant: "destructive"
          });
        },
      });
    },
    useDisconnectSession: () => {
      return useMutation({
        mutationFn: (sessionId: string) => {
          onLog?.('info', 'Desconectando sessão', { sessionId });
          return callGuacamoleAPI(`sessions/${sessionId}`, { method: 'DELETE' });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['guacamole', 'sessions'] });
          onLog?.('response', 'Sessão desconectada com sucesso');
          toast({
            title: "Sessão desconectada!",
            description: "A sessão foi desconectada com sucesso.",
          });
        },
        onError: (error: Error) => {
          onLog?.('error', `Erro ao desconectar sessão: ${error.message}`);
          toast({
            title: "Erro ao desconectar sessão",
            description: error.message,
            variant: "destructive"
          });
        },
      });
    },
    isConfigured,
    integration
  };
};
