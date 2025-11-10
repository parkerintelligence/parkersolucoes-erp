import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusHistoryEntry {
  id: string;
  conversation_id: number;
  previous_status: string;
  new_status: string;
  changed_by_name: string | null;
  changed_by_email: string | null;
  created_at: string;
  metadata: any;
}

export const useChatwootStatusHistory = (
  integrationId: string | undefined,
  conversationId: string | null
) => {
  return useQuery({
    queryKey: ['chatwoot-status-history', integrationId, conversationId],
    queryFn: async () => {
      if (!integrationId || !conversationId) return [];

      const { data, error } = await supabase
        .from('chatwoot_status_history')
        .select('*')
        .eq('integration_id', integrationId)
        .eq('conversation_id', parseInt(conversationId))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico de status:', error);
        throw error;
      }

      return data as StatusHistoryEntry[];
    },
    enabled: !!integrationId && !!conversationId,
    staleTime: 0,
  });
};
