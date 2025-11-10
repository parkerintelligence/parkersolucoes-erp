import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from '@/hooks/use-toast';

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

export interface ChatwootAgent {
  id: number;
  name: string;
  email: string;
  available_name: string;
  avatar_url?: string;
  availability_status: string;
}

export const useChatwootAgents = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  
  const chatwootIntegration = integrations?.find(
    integration => integration.type === 'chatwoot' && integration.is_active
  );

  const agentsQuery = useQuery({
    queryKey: ['chatwoot-agents', chatwootIntegration?.id],
    queryFn: async () => {
      if (!chatwootIntegration?.id) return [];

      const profile = await makeChatwootRequest(chatwootIntegration.id, '/profile');
      const accountId = profile.account_id;

      const agents = await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/agents`
      );

      return (agents || []) as ChatwootAgent[];
    },
    enabled: !!chatwootIntegration,
    staleTime: 60000,
  });

  const assignAgent = useMutation({
    mutationFn: async ({ conversationId, agentId }: { conversationId: string; agentId: number }) => {
      if (!chatwootIntegration?.id) throw new Error('Chatwoot não configurado');

      const profile = await makeChatwootRequest(chatwootIntegration.id, '/profile');
      const accountId = profile.account_id;

      await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/conversations/${conversationId}/assignments`,
        {
          method: 'POST',
          body: { assignee_id: agentId }
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatwoot-conversations'] });
      toast({
        title: "Agente atribuído!",
        description: "O agente foi atribuído à conversa com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atribuir agente",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  return {
    agents: agentsQuery.data || [],
    isLoading: agentsQuery.isLoading,
    assignAgent,
  };
};
