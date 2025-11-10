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

      // Get profile to get account ID
      const profile = await makeChatwootRequest(integrationId, '/profile');
      const accountId = profile.account_id;

      // Get full conversation details including all messages
      const conversation = await makeChatwootRequest(
        integrationId,
        `/accounts/${accountId}/conversations/${conversationId}`
      );

      return (conversation.messages || []) as ChatwootMessage[];
    },
    enabled: !!integrationId && !!conversationId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    staleTime: 3000,
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
