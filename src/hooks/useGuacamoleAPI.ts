
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
}

export const useGuacamoleAPI = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();

  const integration = integrations?.find(i => i.type === 'guacamole' && i.is_active);
  const isConfigured = Boolean(integration?.base_url && integration?.username && integration?.password);

  // Função para fazer chamadas à API do Guacamole via Edge Function
  const callGuacamoleAPI = async (endpoint: string, options: any = {}) => {
    if (!integration) {
      throw new Error('Integração do Guacamole não configurada');
    }

    console.log('Calling Guacamole API:', endpoint, options);

    const { data, error } = await supabase.functions.invoke('guacamole-proxy', {
      body: {
        integrationId: integration.id,
        endpoint,
        ...options
      }
    });

    console.log('Guacamole API response:', { data, error });

    if (error) {
      console.error('Erro na chamada da API Guacamole:', error);
      throw new Error(`Erro na comunicação: ${error.message}`);
    }

    if (data?.error) {
      console.error('Erro retornado pela API Guacamole:', data.error);
      throw new Error(data.error);
    }

    return data?.result || {};
  };

  // Hook para buscar conexões
  const useConnections = () => {
    return useQuery({
      queryKey: ['guacamole', 'connections', integration?.id],
      queryFn: async () => {
        const result = await callGuacamoleAPI('connections');
        console.log('Connections raw result:', result);
        
        // Processar resultado para garantir formato correto
        if (Array.isArray(result)) {
          return result;
        }
        
        // Se o resultado for um objeto, extrair as conexões
        if (typeof result === 'object' && result !== null) {
          const connections = Object.keys(result).map(key => ({
            identifier: key,
            name: result[key]?.name || key,
            protocol: result[key]?.protocol || 'unknown',
            parameters: result[key]?.parameters || {},
            attributes: result[key]?.attributes || {},
            activeConnections: result[key]?.activeConnections || 0
          }));
          return connections;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 30000, // 30 segundos
      retry: 1,
    });
  };

  // Hook para buscar usuários
  const useUsers = () => {
    return useQuery({
      queryKey: ['guacamole', 'users', integration?.id],
      queryFn: async () => {
        const result = await callGuacamoleAPI('users');
        console.log('Users raw result:', result);
        
        // Processar resultado para garantir formato correto
        if (Array.isArray(result)) {
          return result;
        }
        
        // Se o resultado for um objeto, extrair os usuários
        if (typeof result === 'object' && result !== null) {
          const users = Object.keys(result).map(username => ({
            username,
            attributes: result[username]?.attributes || {},
            lastActive: result[username]?.lastActive || null
          }));
          return users;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 60000, // 1 minuto
      retry: 1,
    });
  };

  // Hook para buscar sessões ativas
  const useActiveSessions = () => {
    return useQuery({
      queryKey: ['guacamole', 'sessions', integration?.id],
      queryFn: async () => {
        const result = await callGuacamoleAPI('sessions');
        console.log('Sessions raw result:', result);
        
        // Processar resultado para garantir formato correto
        if (Array.isArray(result)) {
          return result;
        }
        
        // Se o resultado for um objeto, extrair as sessões
        if (typeof result === 'object' && result !== null) {
          const sessions = Object.keys(result).map(sessionId => ({
            id: sessionId,
            username: result[sessionId]?.username || 'unknown',
            connectionName: result[sessionId]?.connectionName || 'unknown',
            protocol: result[sessionId]?.protocol || 'unknown',
            startTime: result[sessionId]?.startTime || new Date().toISOString()
          }));
          return sessions;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 10000, // 10 segundos
      retry: 1,
    });
  };

  // Hook para criar conexão
  const useCreateConnection = () => {
    return useMutation({
      mutationFn: (connectionData: Partial<GuacamoleConnection>) => 
        callGuacamoleAPI('connections', { 
          method: 'POST', 
          data: connectionData 
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['guacamole', 'connections'] });
        toast({
          title: "Conexão criada!",
          description: "A conexão foi criada com sucesso.",
        });
      },
      onError: (error: Error) => {
        console.error('Error creating connection:', error);
        toast({
          title: "Erro ao criar conexão",
          description: error.message,
          variant: "destructive"
        });
      },
    });
  };

  // Hook para atualizar conexão
  const useUpdateConnection = () => {
    return useMutation({
      mutationFn: ({ identifier, updates }: { identifier: string; updates: Partial<GuacamoleConnection> }) => 
        callGuacamoleAPI(`connections/${identifier}`, { 
          method: 'PUT', 
          data: updates 
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['guacamole', 'connections'] });
        toast({
          title: "Conexão atualizada!",
          description: "A conexão foi atualizada com sucesso.",
        });
      },
      onError: (error: Error) => {
        console.error('Error updating connection:', error);
        toast({
          title: "Erro ao atualizar conexão",
          description: error.message,
          variant: "destructive"
        });
      },
    });
  };

  // Hook para deletar conexão
  const useDeleteConnection = () => {
    return useMutation({
      mutationFn: (identifier: string) => 
        callGuacamoleAPI(`connections/${identifier}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['guacamole', 'connections'] });
        toast({
          title: "Conexão removida!",
          description: "A conexão foi removida com sucesso.",
        });
      },
      onError: (error: Error) => {
        console.error('Error deleting connection:', error);
        toast({
          title: "Erro ao remover conexão",
          description: error.message,
          variant: "destructive"
        });
      },
    });
  };

  // Hook para desconectar sessão
  const useDisconnectSession = () => {
    return useMutation({
      mutationFn: (sessionId: string) => 
        callGuacamoleAPI(`sessions/${sessionId}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['guacamole', 'sessions'] });
        toast({
          title: "Sessão desconectada!",
          description: "A sessão foi desconectada com sucesso.",
        });
      },
      onError: (error: Error) => {
        console.error('Error disconnecting session:', error);
        toast({
          title: "Erro ao desconectar sessão",
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
    useCreateConnection,
    useUpdateConnection,
    useDeleteConnection,
    useDisconnectSession,
    isConfigured,
    integration
  };
};
