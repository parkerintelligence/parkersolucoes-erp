
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
  assignee?: {
    id: number;
    name: string;
    email?: string;
    available_name?: string;
  } | null;
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
    
    // Usar sessão existente ao invés de refresh para evitar rate limiting
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
      throw new Error('Erro ao obter sessão de autenticação.');
    }
    
    if (!session) {
      console.warn('⚠️ Nenhuma sessão encontrada');
      throw new Error('Usuário não autenticado. Por favor, faça login.');
    }

    console.log('✅ Sessão obtida com sucesso');

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

    // Se receber 401, tentar refresh uma única vez
    if (response.status === 401) {
      console.log('🔄 Token expirado (401), tentando renovar sessão...');
      
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !newSession) {
        console.error('❌ Erro ao renovar sessão após 401:', refreshError);
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      console.log('✅ Sessão renovada, tentando requisição novamente...');
      
      // Retry com novo token
      const retryResponse = await fetch(
        'https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/chatwoot-proxy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newSession.access_token}`,
          },
          body: JSON.stringify({
            integrationId,
            endpoint,
            method: options.method || 'GET',
            body: options.body,
          }),
        }
      );
      
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || `Erro ${retryResponse.status}`);
      }
      
      return retryResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da resposta Chatwoot:', errorData);
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Requisição bem-sucedida');
    return data;
    
  } catch (error: any) {
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
        // Use /profile endpoint which is more reliable than /accounts
        const result = await makeChatwootRequest(chatwootIntegration.id, '/profile');
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
        return []; // Return empty array instead of throwing
      }

      console.log('Fetching Chatwoot conversations via proxy...');
      
      try {
        // Get profile to get the account ID
        const profile = await makeChatwootRequest(
          chatwootIntegration.id,
          '/profile'
        );

        if (!profile || !profile.account_id) {
          console.warn('Nenhuma conta encontrada no perfil Chatwoot');
          return [];
        }

        const accountId = profile.account_id;
        console.log('Using account ID from profile:', accountId);

        // Get conversations for the account
        const conversations = await makeChatwootRequest(
          chatwootIntegration.id,
          `/accounts/${accountId}/conversations?status=all&page=1`
        );

        console.log('Estrutura completa da resposta:', JSON.stringify(conversations, null, 2).substring(0, 1000));

        // Ensure we return an array
        if (!conversations) {
          console.warn('Resposta vazia ao buscar conversas');
          return [];
        }

        // Handle the Chatwoot API response structure:
        // { data: { meta: {...}, payload: [...] } }
        const conversationsData = Array.isArray(conversations) 
          ? conversations 
          : (conversations.data?.payload || conversations.payload || conversations.data || []);

        // Map the conversations to preserve all properties including status
        const mappedConversations = conversationsData.map((conv: any) => ({
          ...conv,
          status: conv.status, // Explicitly preserve status
          assignee: conv.meta?.assignee || conv.assignee || null
        }));

        console.log('Conversas extraídas:', mappedConversations.length, 'conversas');
        return mappedConversations as ChatwootConversation[];
      } catch (error: any) {
        console.error('Erro ao buscar conversas Chatwoot:', error);
        // Return empty array on error to prevent blank screen
        return [];
      }
    },
    enabled: !!chatwootIntegration,
    refetchInterval: false,
    retry: false,
    staleTime: 60000, // 60 segundos - evitar refetch prematuro
  });

  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!chatwootIntegration?.id) {
        throw new Error('Chatwoot não configurado');
      }

      try {
        // Get profile to get the account ID
        const profile = await makeChatwootRequest(
          chatwootIntegration.id,
          '/profile'
        );

        const accountId = profile.account_id;

        const message = await makeChatwootRequest(
          chatwootIntegration.id,
          `/accounts/${accountId}/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            body: {
              content: content,
              message_type: 1, // 0 = incoming, 1 = outgoing
              private: false
            }
          }
        );

        return message;
      } catch (error: any) {
        console.error('Erro ao enviar mensagem:', error);
        throw new Error(error.message || 'Erro ao enviar mensagem');
      }
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

  // Função para salvar histórico de mudanças de status
  const saveStatusHistory = async (
    conversationId: string,
    previousStatus: string,
    newStatus: string
  ) => {
    if (!chatwootIntegration?.id) return;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('chatwoot_status_history')
        .insert({
          integration_id: chatwootIntegration.id,
          conversation_id: parseInt(conversationId),
          user_id: user?.id,
          previous_status: previousStatus,
          new_status: newStatus,
          changed_by_name: user?.user_metadata?.name || user?.email || 'Sistema',
          changed_by_email: user?.email,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'web_interface'
          }
        });
      
      if (error) {
        console.error('❌ Erro ao salvar histórico de status:', error);
      } else {
        console.log('✅ Histórico de status salvo com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
    }
  };

  const updateConversationStatus = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: 'open' | 'resolved' | 'pending' }) => {
      console.log('🚀 MUTATION STATUS INICIADA!', { conversationId, status });
      
      if (!chatwootIntegration?.id) {
        console.error('❌ Sem integração Chatwoot configurada');
        throw new Error('Chatwoot não configurado');
      }

      try {
        console.log('🔍 Buscando profile...');
        const profile = await makeChatwootRequest(
          chatwootIntegration.id,
          '/profile'
        );

        const accountId = profile.account_id;
        console.log('✅ Profile obtido, accountId:', accountId);

        // Pegar status anterior antes de atualizar
        const oldData: any = queryClient.getQueryData(['chatwoot-conversations', chatwootIntegration?.id]);
        const conversationData = oldData?.find((c: any) => c.id.toString() === conversationId);
        const previousStatus = conversationData?.status || 'open';

        let conversation = null;
        let lastError = null;

        // Tentativa 1: POST no /toggle_status (mais comum e confiável)
        try {
          console.log('🔄 [1/3] Tentando POST /toggle_status...');
          conversation = await makeChatwootRequest(
            chatwootIntegration.id,
            `/accounts/${accountId}/conversations/${conversationId}/toggle_status`,
            {
              method: 'POST',
              body: { status }
            }
          );
          console.log('✅ POST /toggle_status bem-sucedido!');
        } catch (error1) {
          console.warn('⚠️ [1/3] POST /toggle_status falhou:', error1);
          lastError = error1;
          
          // Tentativa 2: PATCH no endpoint padrão
          try {
            console.log('🔄 [2/3] Tentando PATCH /conversations/:id...');
            conversation = await makeChatwootRequest(
              chatwootIntegration.id,
              `/accounts/${accountId}/conversations/${conversationId}`,
              {
                method: 'PATCH',
                body: { status }
              }
            );
            console.log('✅ PATCH bem-sucedido!');
          } catch (error2) {
            console.warn('⚠️ [2/3] PATCH falhou:', error2);
            lastError = error2;
            
            // Tentativa 3: PUT no endpoint padrão
            try {
              console.log('🔄 [3/3] Tentando PUT /conversations/:id...');
              conversation = await makeChatwootRequest(
                chatwootIntegration.id,
                `/accounts/${accountId}/conversations/${conversationId}`,
                {
                  method: 'PUT',
                  body: { status }
                }
              );
              console.log('✅ PUT bem-sucedido!');
            } catch (error3) {
              console.error('❌ [3/3] PUT falhou:', error3);
              throw new Error(`Todos os métodos falharam. Último erro: ${lastError}`);
            }
          }
        }

        if (!conversation) {
          throw new Error('Nenhuma resposta da API do Chatwoot');
        }

        console.log('✅ Status atualizado com sucesso:', conversation.status);

        // Salvar no histórico após sucesso da API
        try {
          console.log('💾 Salvando histórico de status...');
          await saveStatusHistory(conversationId, previousStatus, status);
          console.log('✅ Histórico salvo!');
        } catch (historyError) {
          console.warn('⚠️ Erro ao salvar histórico (não crítico):', historyError);
        }

        return conversation;
      } catch (error: any) {
        console.error('❌ Erro ao atualizar status:', error);
        throw new Error(error.message || 'Erro ao atualizar status da conversa');
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ Status atualizado com sucesso na API:', data.status);
      console.log('📝 Atualizando conversa ID:', variables.conversationId);
      
      // Update cache IMEDIATAMENTE para resposta visual instantânea
      queryClient.setQueryData(
        ['chatwoot-conversations', chatwootIntegration?.id], 
        (oldData: any) => {
          if (!oldData) {
            console.warn('⚠️ Nenhum dado no cache para atualizar');
            return oldData;
          }
          
          console.log('📊 Total de conversas no cache:', oldData.length);
          
          const updatedData = oldData.map((conv: any) => {
            // Garantir comparação correta convertendo ambos para string
            const convIdStr = String(conv.id);
            const targetIdStr = String(variables.conversationId);
            
            if (convIdStr === targetIdStr) {
              console.log(`🔄 Conversa ${convIdStr}: ${conv.status} → ${data.status}`);
              return { 
                ...conv, 
                status: data.status,
                updated_at: new Date().toISOString() // Atualizar timestamp
              };
            }
            return conv;
          });
          
          const wasUpdated = oldData.some((conv: any) => 
            String(conv.id) === String(variables.conversationId)
          );
          
          if (!wasUpdated) {
            console.error('❌ Conversa não encontrada no cache!', variables.conversationId);
          } else {
            console.log('✅ Cache atualizado com sucesso!');
          }
          
          return updatedData;
        }
      );
      
      toast({
        title: "Status atualizado!",
        description: `Conversa marcada como ${
          data.status === 'resolved' ? 'resolvida' : 
          data.status === 'pending' ? 'pendente' : 
          'aberta'
        }.`,
      });
    },
    onError: (error: Error, variables) => {
      console.error('❌ Mutation onError:', error);
      
      // Revert otimistic update
      queryClient.invalidateQueries({ 
        queryKey: ['chatwoot-conversations', chatwootIntegration?.id] 
      });
      
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

  // Nova função para marcar conversa como lida
  const markConversationAsRead = async (conversationId: string) => {
    if (!chatwootIntegration?.id) {
      console.warn('⚠️ Chatwoot não configurado, não é possível marcar como lida');
      return;
    }

    try {
      console.log('📖 Marcando conversa como lida:', conversationId);
      
      const profile = await makeChatwootRequest(
        chatwootIntegration.id,
        '/profile'
      );

      const accountId = profile.account_id;
      
      // Marcar todas as mensagens da conversa como lidas
      await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/conversations/${conversationId}/update_last_seen`,
        {
          method: 'POST',
          body: {}
        }
      );
      
      console.log('✅ Conversa marcada como lida!');
      
      // Atualizar o cache local para refletir unread_count = 0
      queryClient.setQueryData(
        ['chatwoot-conversations', chatwootIntegration.id],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((conv: any) => {
            if (String(conv.id) === String(conversationId)) {
              return { ...conv, unread_count: 0 };
            }
            return conv;
          });
        }
      );
      
      // Forçar refresh após 2 segundos para garantir sincronização
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['chatwoot-conversations', chatwootIntegration.id] 
        });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao marcar conversa como lida:', error);
      // Não bloquear a interface se falhar
    }
  };

  const getConversationDetails = async (conversationId: string) => {
    if (!chatwootIntegration?.id) {
      throw new Error('Chatwoot não configurado');
    }

    const profile = await makeChatwootRequest(chatwootIntegration.id, '/profile');
    const accountId = profile.account_id;

    return await makeChatwootRequest(
      chatwootIntegration.id,
      `/accounts/${accountId}/conversations/${conversationId}`
    );
  };

  return {
    isConfigured: !!chatwootIntegration,
    integrationId: chatwootIntegration?.id,
    conversations: conversationsQuery?.data || [],
    isLoading: conversationsQuery?.isLoading || false,
    error: conversationsQuery?.error,
    testConnection,
    sendMessage,
    updateConversationStatus,
    refetchConversations,
    getConversationDetails,
    markConversationAsRead,
  };
};
