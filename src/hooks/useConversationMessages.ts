import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatwootMessage } from './useChatwootAPI';

const makeChatwootRequest = async (integrationId: string, endpoint: string, options: { method?: string; body?: any } = {}) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data: { session } } = await supabase.auth.refreshSession();
  if (!session) throw new Error('Não autenticado');

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

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Erro ${response.status}`);
  }

  return response.json();
};

export const useConversationMessages = (integrationId: string | undefined, conversationId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chatwoot-messages', integrationId, conversationId],
    queryFn: async () => {
      if (!integrationId || !conversationId) return [];

      console.log('🔍 Buscando mensagens da conversa:', conversationId);

      // Get profile to get account ID
      const profile = await makeChatwootRequest(integrationId, '/profile');
      const accountId = profile.account_id;
      
      console.log('✅ AccountId:', accountId);

      // Usar endpoint específico de mensagens que retorna TODAS as mensagens
      const messagesResponse = await makeChatwootRequest(
        integrationId,
        `/accounts/${accountId}/conversations/${conversationId}/messages`
      );

      console.log(`✅ Mensagens encontradas: ${messagesResponse.payload?.length || messagesResponse.length || 0}`);
      
      // O endpoint retorna { payload: [...mensagens], meta: {...} }
      const messages = (messagesResponse.payload || messagesResponse || []) as ChatwootMessage[];
      
      // Buscar dados da conversa para pegar o assignee
      const conversationData = await makeChatwootRequest(
        integrationId,
        `/accounts/${accountId}/conversations/${conversationId}`
      );
      
      const assignee = conversationData?.meta?.assignee || conversationData?.assignee;
      const inbox = conversationData?.meta?.inbox || conversationData?.inbox;
      
      console.log('👤 Agente atribuído:', assignee?.name || 'Nenhum');
      console.log('📥 Caixa de entrada:', inbox?.name || 'N/A');
      
      // Enriquecer mensagens outgoing com dados do agente ou inbox
      const enrichedMessages = messages.map(msg => {
        if (msg.message_type === 1) { // Mensagem outgoing (enviada)
          // SEMPRE usar dados do agente ou inbox para mensagens outgoing
          return {
            ...msg,
            sender: assignee ? {
              id: assignee.id,
              name: assignee.name || assignee.available_name,
              email: assignee.email,
            } : inbox ? {
              id: inbox.id,
              name: inbox.name,
            } : msg.sender
          };
        }
        return msg;
      });
      
      // Ordenar por data (mais antiga primeiro)
      const sortedMessages = enrichedMessages.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });
      
      console.log('📊 Total de mensagens ordenadas:', sortedMessages.length);
      
      return sortedMessages;
    },
    enabled: !!integrationId && !!conversationId,
    refetchInterval: 10000, // Aumentado para 10 segundos para reduzir chamadas
    staleTime: 8000, // Aumentado para 8 segundos
  });

  const refetch = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['chatwoot-messages', integrationId, conversationId] 
    });
  };

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  };
};
