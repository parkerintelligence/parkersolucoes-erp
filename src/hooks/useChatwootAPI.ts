
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from '@/hooks/use-toast';

export interface ChatwootConversation {
  id: number;
  account_id: number;
  inbox_id: number;
  status: 'open' | 'resolved' | 'pending';
  assignee_last_seen_at: string | null;
  agent_last_seen_at: string | null;
  unread_count: number;
  additional_attributes: any;
  can_reply: boolean;
  channel: string;
  contact_last_seen_at: string | null;
  created_at: string;
  identifier: string | null;
  last_activity_at: string;
  messages: ChatwootMessage[];
  meta: {
    sender: {
      id: number;
      name: string;
      phone_number: string;
      email?: string;
    };
    channel: string;
  };
  timestamp: string;
  updated_at: string;
}

export interface ChatwootMessage {
  id: number;
  content: string;
  content_type: string;
  content_attributes: any;
  message_type: 0 | 1; // 0 = incoming, 1 = outgoing
  created_at: string;
  updated_at: string;
  private: boolean;
  status: 'sent' | 'delivered' | 'read';
  source_id: string | null;
  sender: {
    id: number;
    name: string;
    email?: string;
    phone_number?: string;
  } | null;
}

const makeChatwootRequest = async (integrationId: string, endpoint: string, options: { method?: string; body?: any } = {}) => {
  console.log('=== CHATWOOT PROXY REQUEST ===');
  console.log('Integration ID:', integrationId);
  console.log('Endpoint:', endpoint);
  console.log('Método:', options.method || 'GET');

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Refresh session to ensure we have a valid token
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    
    if (sessionError) {
      console.error('Erro ao renovar sessão:', sessionError);
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!session) {
      throw new Error('Usuário não autenticado. Por favor, faça login.');
    }

    console.log('✅ Token renovado com sucesso');

    const response = await fetch(
      'https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/chatwoot-proxy',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          integrationId,
          endpoint,
          method: options.method || 'GET',
          body: options.body,
        }),
      }
    );

    console.log('Status da resposta Chatwoot Proxy:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro do Proxy Chatwoot:', errorData);
      
      // Create detailed error object
      const error: any = new Error(errorData.error || `Erro do Proxy ${response.status}`);
      error.details = errorData.details;
      error.status = response.status;
      
      throw error;
    }

    const data = await response.json();
    console.log('Dados da resposta Chatwoot:', data);
    
    return data;
  } catch (error) {
    console.error('Erro de requisição Chatwoot:', error);
    throw error;
  }
};

export const useChatwootAPI = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  
  const chatwootIntegration = integrations?.find(integration => 
    integration.type === 'chatwoot' && integration.is_active
  );

  console.log('=== CHATWOOT INTEGRAÇÃO ===');
  console.log('Integração encontrada:', chatwootIntegration);
  console.log('URL Base configurada:', chatwootIntegration?.base_url);
  console.log('Token:', chatwootIntegration?.api_token ? '***' + chatwootIntegration.api_token.slice(-4) : 'não configurado');

  const testConnection = useMutation({
    mutationFn: async () => {
      if (!chatwootIntegration?.id) {
        throw new Error('Nenhuma integração Chatwoot configurada');
      }
      
      console.log('Testando conexão Chatwoot via proxy...');
      
      try {
        const result = await makeChatwootRequest(chatwootIntegration.id, '/accounts');
        console.log('Teste de conexão Chatwoot bem-sucedido:', result);
        return result;
      } catch (error) {
        console.error('Teste de conexão Chatwoot falhou:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Conexão Chatwoot bem-sucedida:', data);
      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado ao Chatwoot com sucesso. Contas encontradas: ${data?.length || 0}`,
      });
    },
    onError: (error: Error) => {
      console.error('Conexão Chatwoot falhou:', error);
      toast({
        title: "Erro de Conexão Chatwoot",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const conversationsQuery = useQuery({
    queryKey: ['chatwoot-conversations', chatwootIntegration?.id],
    queryFn: async () => {
      if (!chatwootIntegration?.id) {
        throw new Error('Chatwoot não configurado');
      }

      console.log('Fetching Chatwoot conversations via proxy...');
      
      // First get accounts to get the account ID
      const accounts = await makeChatwootRequest(
        chatwootIntegration.id,
        '/accounts'
      );

      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada no Chatwoot');
      }

      const accountId = accounts[0].id;
      console.log('Using account ID:', accountId);

      // Get conversations for the account
      const conversations = await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/conversations?status=all&page=1`
      );

      return conversations.data as ChatwootConversation[];
    },
    enabled: !!chatwootIntegration,
    refetchInterval: 30000,
    retry: 1,
    staleTime: 10000,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      if (!chatwootIntegration?.id) {
        throw new Error('Chatwoot não configurado');
      }

      const accounts = await makeChatwootRequest(
        chatwootIntegration.id,
        '/accounts'
      );

      const accountId = accounts[0].id;

      const message = await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: {
            content: content,
            message_type: 'outgoing'
          }
        }
      );

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatwoot-conversations'] });
      toast({
        title: "Mensagem enviada!",
        description: "A mensagem foi enviada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateConversationStatus = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: number; status: 'open' | 'resolved' | 'pending' }) => {
      if (!chatwootIntegration?.id) {
        throw new Error('Chatwoot não configurado');
      }

      const accounts = await makeChatwootRequest(
        chatwootIntegration.id,
        '/accounts'
      );

      const accountId = accounts[0].id;

      const conversation = await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/conversations/${conversationId}`,
        {
          method: 'PATCH',
          body: {
            status: status
          }
        }
      );

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatwoot-conversations'] });
      toast({
        title: "Status atualizado!",
        description: "O status da conversa foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating conversation status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const refetchConversations = () => {
    console.log('Refetching Chatwoot conversations...');
    queryClient.invalidateQueries({ queryKey: ['chatwoot-conversations'] });
  };

  return {
    isConfigured: !!chatwootIntegration,
    conversations: conversationsQuery?.data || [],
    isLoading: conversationsQuery?.isLoading || false,
    error: conversationsQuery?.error,
    testConnection,
    sendMessage,
    updateConversationStatus,
    refetchConversations,
  };
};
