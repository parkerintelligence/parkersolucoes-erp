import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatwootLabel } from './useChatwootAPI';
import { toast } from '@/hooks/use-toast';

const makeChatwootRequest = async (integrationId: string, endpoint: string, options: { method?: string; body?: any } = {}) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('Usuário não autenticado');
  }

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

export const useChatwootLabels = (integrationId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch all available labels
  const labelsQuery = useQuery({
    queryKey: ['chatwoot-labels', integrationId],
    queryFn: async () => {
      if (!integrationId) return [];

      console.log('🏷️ Buscando labels do Chatwoot...');

      const profile = await makeChatwootRequest(integrationId, '/profile');
      const accountId = profile.account_id;

      const labels = await makeChatwootRequest(
        integrationId,
        `/accounts/${accountId}/labels`
      );

      console.log('✅ Labels encontradas:', labels?.length || 0);
      
      return (labels?.payload || labels || []) as ChatwootLabel[];
    },
    enabled: !!integrationId,
    staleTime: 300000, // 5 minutes
  });

  // Add labels to conversation
  const addLabels = useMutation({
    mutationFn: async ({ conversationId, labels }: { conversationId: string; labels: string[] }) => {
      if (!integrationId) throw new Error('Integração não configurada');

      console.log('➕ Adicionando labels:', labels, 'à conversa:', conversationId);

      const profile = await makeChatwootRequest(integrationId, '/profile');
      const accountId = profile.account_id;

      const result = await makeChatwootRequest(
        integrationId,
        `/accounts/${accountId}/conversations/${conversationId}/labels`,
        {
          method: 'POST',
          body: { labels }
        }
      );

      return result;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Labels adicionadas com sucesso');
      
      // Update conversation cache
      queryClient.setQueryData(
        ['chatwoot-conversations', integrationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((conv: any) => {
            if (String(conv.id) === String(variables.conversationId)) {
              return {
                ...conv,
                labels: data.payload?.labels || data.labels || conv.labels || []
              };
            }
            return conv;
          });
        }
      );

      toast({
        title: "Etiquetas atualizadas",
        description: "As etiquetas foram adicionadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao adicionar labels:', error);
      toast({
        title: "Erro ao adicionar etiquetas",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Remove label from conversation
  const removeLabel = useMutation({
    mutationFn: async ({ conversationId, label }: { conversationId: string; label: string }) => {
      if (!integrationId) throw new Error('Integração não configurada');

      console.log('➖ Removendo label:', label, 'da conversa:', conversationId);

      const profile = await makeChatwootRequest(integrationId, '/profile');
      const accountId = profile.account_id;

      // Buscar labels atuais da conversa
      const conversation = await makeChatwootRequest(
        integrationId,
        `/accounts/${accountId}/conversations/${conversationId}`
      );

      const currentLabels = conversation.labels || [];
      console.log('🏷️ Labels atuais:', currentLabels);
      
      // Filtrar a label que queremos remover
      const updatedLabels = currentLabels.filter((l: string) => l !== label);
      console.log('🏷️ Labels após remoção:', updatedLabels);

      // Chatwoot API: POST substitui todas as labels (não há endpoint DELETE)
      // Enviamos a lista atualizada sem a label removida
      const result = await makeChatwootRequest(
        integrationId,
        `/accounts/${accountId}/conversations/${conversationId}/labels`,
        {
          method: 'POST',
          body: { labels: updatedLabels }
        }
      );

      return result;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Label removida com sucesso');
      
      // Update conversation cache
      queryClient.setQueryData(
        ['chatwoot-conversations', integrationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((conv: any) => {
            if (String(conv.id) === String(variables.conversationId)) {
              const currentLabels = conv.labels || [];
              return {
                ...conv,
                labels: currentLabels.filter((l: string) => l !== variables.label)
              };
            }
            return conv;
          });
        }
      );

      toast({
        title: "Etiqueta removida",
        description: "A etiqueta foi removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao remover label:', error);
      toast({
        title: "Erro ao remover etiqueta",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  return {
    labels: labelsQuery.data || [],
    isLoadingLabels: labelsQuery.isLoading,
    addLabels,
    removeLabel,
  };
};
