
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

const makeChatwootRequest = async (baseUrl: string, token: string, endpoint: string, options: RequestInit = {}) => {
  // Clean URL and ensure it doesn't end with slash
  let apiUrl = baseUrl.replace(/\/$/, '');
  if (!apiUrl.includes('/api/v1')) {
    apiUrl = apiUrl + '/api/v1';
  }
  
  const fullUrl = `${apiUrl}${endpoint}`;
  
  console.log('Making Chatwoot request:', { fullUrl, method: options.method || 'GET' });

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': token,
        ...options.headers,
      },
    });

    console.log('Chatwoot response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chatwoot API error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText
      });
      
      throw new Error(`Erro da API Chatwoot ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Chatwoot response data:', data);
    
    return data;
  } catch (error) {
    console.error('Chatwoot fetch error:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Erro de conexão com Chatwoot. Verifique se a URL está correta e acessível: ${fullUrl}`);
    }
    
    throw error;
  }
};

export const useChatwootAPI = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  
  const chatwootIntegration = integrations?.find(integration => 
    integration.type === 'chatwoot' && integration.is_active
  );

  console.log('Chatwoot integration found:', chatwootIntegration);

  const testConnection = useMutation({
    mutationFn: async ({ base_url, api_token }: { base_url: string; api_token: string }) => {
      console.log('Testing Chatwoot connection...');
      
      try {
        const result = await makeChatwootRequest(base_url, api_token, '/accounts');
        console.log('Chatwoot connection test successful:', result);
        return result;
      } catch (error) {
        console.error('Chatwoot connection test failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Chatwoot connection successful:', data);
      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado ao Chatwoot com sucesso. Contas encontradas: ${data?.length || 0}`,
      });
    },
    onError: (error: Error) => {
      console.error('Chatwoot connection failed:', error);
      toast({
        title: "Erro de Conexão Chatwoot",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const conversationsQuery = useQuery({
    queryKey: ['chatwoot-conversations'],
    queryFn: async () => {
      if (!chatwootIntegration?.base_url || !chatwootIntegration?.api_token) {
        throw new Error('Chatwoot não configurado');
      }

      console.log('Fetching Chatwoot conversations...');
      
      // First get accounts to get the account ID
      const accounts = await makeChatwootRequest(
        chatwootIntegration.base_url,
        chatwootIntegration.api_token,
        '/accounts'
      );

      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada no Chatwoot');
      }

      const accountId = accounts[0].id;
      console.log('Using account ID:', accountId);

      // Get conversations for the account
      const conversations = await makeChatwootRequest(
        chatwootIntegration.base_url,
        chatwootIntegration.api_token,
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
      if (!chatwootIntegration?.base_url || !chatwootIntegration?.api_token) {
        throw new Error('Chatwoot não configurado');
      }

      const accounts = await makeChatwootRequest(
        chatwootIntegration.base_url,
        chatwootIntegration.api_token,
        '/accounts'
      );

      const accountId = accounts[0].id;

      const message = await makeChatwootRequest(
        chatwootIntegration.base_url,
        chatwootIntegration.api_token,
        `/accounts/${accountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: content,
            message_type: 'outgoing'
          })
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
      if (!chatwootIntegration?.base_url || !chatwootIntegration?.api_token) {
        throw new Error('Chatwoot não configurado');
      }

      const accounts = await makeChatwootRequest(
        chatwootIntegration.base_url,
        chatwootIntegration.api_token,
        '/accounts'
      );

      const accountId = accounts[0].id;

      const conversation = await makeChatwootRequest(
        chatwootIntegration.base_url,
        chatwootIntegration.api_token,
        `/accounts/${accountId}/conversations/${conversationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: status
          })
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
    conversations: conversationsQuery.data || [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    testConnection,
    sendMessage,
    updateConversationStatus,
    refetchConversations,
  };
};
