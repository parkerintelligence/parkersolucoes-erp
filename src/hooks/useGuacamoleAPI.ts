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
  const isConfigured = Boolean(
    integration?.base_url && 
    integration?.username && 
    integration?.password &&
    integration?.directory
  );

  console.log('=== useGuacamoleAPI Debug ===');
  console.log('Integration found:', !!integration);
  console.log('Is configured:', isConfigured);
  if (integration) {
    console.log('Integration details:', {
      id: integration.id,
      name: integration.name,
      base_url: integration.base_url,
      username: integration.username,
      has_password: !!integration.password,
      dataSource: integration.directory,
      is_active: integration.is_active
    });
  }

  const callGuacamoleAPI = async (endpoint: string, options: any = {}) => {
    if (!integration) {
      throw new Error('Integração do Guacamole não configurada');
    }

    console.log('=== Calling Guacamole API ===');
    console.log('Integration ID:', integration.id);
    console.log('Endpoint:', endpoint);
    console.log('Data Source:', integration.directory);
    console.log('Options:', options);

    try {
      const { data, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: {
          integrationId: integration.id,
          endpoint,
          ...options
        }
      });

      console.log('=== Guacamole API Response ===');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('Erro na chamada da função Edge:', error);
        throw new Error(`Erro na comunicação: ${error.message || 'Erro desconhecido'}`);
      }

      if (data?.error) {
        console.error('Erro retornado pela API Guacamole:', data.error);
        console.log('Detalhes do erro:', data.details);
        
        if (data.details?.needsAdminPermissions) {
          const errorMsg = `ERRO DE PERMISSÕES: O usuário "${integration.username}" não tem permissões administrativas no Guacamole. Para acessar conexões, usuários e sessões ativas via API, o usuário precisa ter privilégios de administrador no sistema Guacamole.

SOLUÇÃO:
1. Acesse o painel administrativo do Guacamole
2. Vá em "Settings" → "Users"  
3. Edite o usuário "${integration.username}"
4. Marque a opção "Administer system" ou similar
5. Salve as alterações e teste novamente

OU crie um novo usuário administrativo e atualize as credenciais na integração.`;
          
          throw new Error(errorMsg);
        }
        
        if (data.error.includes('Token') || data.details?.status === 401 || data.details?.status === 403) {
          console.log('Invalidando cache devido a erro de autenticação');
          queryClient.invalidateQueries({ queryKey: ['guacamole'] });
        }
        
        throw new Error(data.error);
      }

      return data?.result || {};
    } catch (error) {
      console.error('Erro geral na chamada da API:', error);
      throw error;
    }
  };

  const useConnections = () => {
    return useQuery({
      queryKey: ['guacamole', 'connections', integration?.id],
      queryFn: async () => {
        console.log('=== Fetching Connections ===');
        const result = await callGuacamoleAPI('connections');
        console.log('Connections raw result:', result);
        
        if (Array.isArray(result)) {
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const connections = Object.keys(result).map(key => ({
            identifier: key,
            name: result[key]?.name || key,
            protocol: result[key]?.protocol || 'unknown',
            parameters: result[key]?.parameters || {},
            attributes: result[key]?.attributes || {},
            activeConnections: result[key]?.activeConnections || 0
          }));
          console.log('Processed connections:', connections);
          return connections;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 30000,
      retry: (failureCount, error) => {
        console.log(`Retry attempt ${failureCount} for connections:`, error);
        
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
        console.log('=== Fetching Users ===');
        const result = await callGuacamoleAPI('users');
        console.log('Users raw result:', result);
        
        if (Array.isArray(result)) {
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const users = Object.keys(result).map(username => ({
            username,
            attributes: result[username]?.attributes || {},
            lastActive: result[username]?.lastActive || null
          }));
          console.log('Processed users:', users);
          return users;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 60000,
      retry: (failureCount, error) => {
        console.log(`Retry attempt ${failureCount} for users:`, error);
        
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
        console.log('=== Fetching Active Sessions ===');
        const result = await callGuacamoleAPI('sessions');
        console.log('Sessions raw result:', result);
        
        if (Array.isArray(result)) {
          return result;
        }
        
        if (typeof result === 'object' && result !== null) {
          const sessions = Object.keys(result).map(sessionId => ({
            id: sessionId,
            username: result[sessionId]?.username || 'unknown',
            connectionName: result[sessionId]?.connectionName || 'unknown',
            protocol: result[sessionId]?.protocol || 'unknown',
            startTime: result[sessionId]?.startTime || new Date().toISOString()
          }));
          console.log('Processed sessions:', sessions);
          return sessions;
        }
        
        return [];
      },
      enabled: isConfigured,
      staleTime: 10000,
      retry: (failureCount, error) => {
        console.log(`Retry attempt ${failureCount} for sessions:`, error);
        
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

  return {
    useConnections,
    useUsers,
    useActiveSessions,
    useCreateConnection: () => {
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
    },
    useUpdateConnection: () => {
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
    },
    useDeleteConnection: () => {
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
    },
    useDisconnectSession: () => {
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
    },
    isConfigured,
    integration
  };
};
