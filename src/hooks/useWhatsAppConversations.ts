
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrations } from '@/hooks/useIntegrations';
import { EvolutionApiService } from '@/utils/evolutionApiService';
import { toast } from '@/hooks/use-toast';

export interface WhatsAppConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number | null;
  status: string | null;
  integration_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useWhatsAppConversations = () => {
  const { data: integrations = [] } = useIntegrations();
  
  const evolutionIntegration = integrations.find(int => 
    int.type === 'evolution_api' && int.is_active
  );

  return useQuery({
    queryKey: ['whatsapp_conversations', evolutionIntegration?.id],
    queryFn: async () => {
      console.log('🔍 useWhatsAppConversations: Iniciando busca...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Usuário não autenticado:', authError);
        throw new Error('User not authenticated');
      }

      console.log('👤 Usuário autenticado:', user.id);
      
      // Buscar conversas do banco primeiro
      const { data: dbConversations, error: dbError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (dbError) {
        console.error('❌ Erro ao buscar conversas do banco:', dbError);
      }

      console.log(`📊 Conversas no banco: ${dbConversations?.length || 0}`);

      // Se há integração Evolution API ativa, tentar sincronizar
      if (evolutionIntegration) {
        try {
          console.log('🔌 Integração Evolution API encontrada, verificando status...');
          const evolutionService = new EvolutionApiService(evolutionIntegration);
          
          // Verificar status da instância
          const instanceStatus = await evolutionService.checkInstanceStatus();
          console.log('📡 Status da instância:', instanceStatus);
          
          if (instanceStatus.active) {
            console.log('✅ Instância ativa, sincronizando conversas...');
            
            try {
              // Buscar conversas da Evolution API
              const apiConversations = await evolutionService.getConversations();
              console.log(`📊 Conversas da API: ${apiConversations.length}`);
              
              if (apiConversations.length > 0) {
                console.log('🔄 Sincronizando conversas com banco...');
                
                // Preparar dados para sincronização
                const conversationsToSync = apiConversations.map(conv => ({
                  contact_name: conv.name || conv.remoteJid?.split('@')[0] || 'Contato Desconhecido',
                  contact_phone: conv.remoteJid || '',
                  last_message: conv.lastMessage || null,
                  last_message_time: conv.timestamp ? new Date(conv.timestamp).toISOString() : new Date().toISOString(),
                  unread_count: conv.unreadCount || 0,
                  status: 'active',
                  integration_id: evolutionIntegration.id,
                  user_id: user.id
                }));

                console.log('📝 Dados para sincronizar:', conversationsToSync.length);

                // Sincronizar usando upsert
                const { data: syncedData, error: syncError } = await supabase
                  .from('whatsapp_conversations')
                  .upsert(conversationsToSync, {
                    onConflict: 'contact_phone,integration_id',
                    ignoreDuplicates: false
                  })
                  .select();

                if (syncError) {
                  console.error('❌ Erro ao sincronizar conversas:', syncError);
                } else {
                  console.log('✅ Conversas sincronizadas com sucesso');
                }

                // Buscar conversas atualizadas
                const { data: updatedConversations, error: updateError } = await supabase
                  .from('whatsapp_conversations')
                  .select('*')
                  .order('last_message_time', { ascending: false, nullsFirst: false });

                if (!updateError && updatedConversations) {
                  console.log(`✅ Conversas atualizadas: ${updatedConversations.length}`);
                  return updatedConversations as WhatsAppConversation[];
                }
              } else {
                console.log('ℹ️ Nenhuma conversa encontrada na API');
              }
            } catch (apiError) {
              console.error('❌ Erro ao buscar conversas da API:', apiError);
              // Não mostrar toast aqui, continuar com dados do banco
            }
          } else {
            console.warn('⚠️ Instância não conectada');
          }
        } catch (integrationError) {
          console.error('❌ Erro na integração Evolution API:', integrationError);
          // Não mostrar toast aqui, continuar com dados do banco
        }
      } else {
        console.log('⚠️ Nenhuma integração Evolution API ativa');
      }

      // Retornar dados do banco
      console.log(`📊 Retornando ${(dbConversations || []).length} conversas do banco`);
      return (dbConversations || []) as WhatsAppConversation[];
    },
    enabled: true,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 15000, // Dados ficam stale após 15 segundos
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

export const useCreateWhatsAppConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversation: Omit<WhatsAppConversation, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const conversationData = {
        ...conversation,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .insert([conversationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating WhatsApp conversation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_conversations'] });
      toast({
        title: "Conversa adicionada!",
        description: "A conversa foi adicionada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating WhatsApp conversation:', error);
      toast({
        title: "Erro ao adicionar conversa",
        description: error.message || "Ocorreu um erro ao adicionar a conversa.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateWhatsAppConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WhatsAppConversation> }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating WhatsApp conversation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_conversations'] });
      toast({
        title: "Conversa atualizada!",
        description: "A conversa foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating WhatsApp conversation:', error);
      toast({
        title: "Erro ao atualizar conversa",
        description: error.message || "Ocorreu um erro ao atualizar a conversa.",
        variant: "destructive"
      });
    },
  });
};

// Hook para forçar sincronização manual
export const useSyncWhatsAppConversations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Forçando sincronização manual...');
      // Invalidar cache para forçar refetch
      await queryClient.invalidateQueries({ queryKey: ['whatsapp_conversations'] });
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Sincronização iniciada",
        description: "As conversas estão sendo atualizadas...",
      });
    },
    onError: (error: any) => {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar as conversas.",
        variant: "destructive"
      });
    },
  });
};
