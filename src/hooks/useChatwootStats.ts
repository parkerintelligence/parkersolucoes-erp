import { useQuery } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';

const makeChatwootRequest = async (integrationId: string, endpoint: string) => {
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
        method: 'GET',
      }),
    }
  );

  if (!response.ok) throw new Error(`Erro ${response.status}`);
  return response.json();
};

export const useChatwootStats = () => {
  const { data: integrations } = useIntegrations();
  
  const chatwootIntegration = integrations?.find(
    integration => integration.type === 'chatwoot' && integration.is_active
  );

  const statsQuery = useQuery({
    queryKey: ['chatwoot-stats', chatwootIntegration?.id],
    queryFn: async () => {
      if (!chatwootIntegration?.id) return null;

      const profile = await makeChatwootRequest(chatwootIntegration.id, '/profile');
      const accountId = profile.account_id;

      // Fetch all conversations for stats
      const conversations = await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/conversations?status=all&page=1`
      );

      const convData = Array.isArray(conversations)
        ? conversations
        : (conversations.data?.payload || conversations.payload || []);

      // Calculate stats
      const total = convData.length;
      const open = convData.filter((c: any) => c.status === 'open').length;
      const pending = convData.filter((c: any) => c.status === 'pending').length;
      const resolved = convData.filter((c: any) => c.status === 'resolved').length;

      // Calculate average response time (simplified)
      const totalResponseTimes = convData
        .filter((c: any) => c.messages && c.messages.length > 1)
        .map((c: any) => {
          const firstMessage = c.messages[0];
          const firstResponse = c.messages.find((m: any) => m.message_type === 1);
          if (firstMessage && firstResponse) {
            return new Date(firstResponse.created_at).getTime() - new Date(firstMessage.created_at).getTime();
          }
          return 0;
        })
        .filter((t: number) => t > 0);

      const avgResponseTime = totalResponseTimes.length > 0
        ? totalResponseTimes.reduce((a: number, b: number) => a + b, 0) / totalResponseTimes.length
        : 0;

      // Resolution rate
      const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

      return {
        total,
        open,
        pending,
        resolved,
        avgResponseTime: Math.round(avgResponseTime / 1000 / 60), // in minutes
        resolutionRate: Math.round(resolutionRate),
      };
    },
    enabled: !!chatwootIntegration,
    refetchInterval: 30000,
    staleTime: 20000,
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
  };
};
