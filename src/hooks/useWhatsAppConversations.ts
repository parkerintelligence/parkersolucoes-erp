
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
    queryKey: ['whatsapp_conversations'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      console.log('🔍 Buscando conversas do WhatsApp...');
      
      // Primeiro, buscar conversas do banco de dados
      const { data: dbConversations, error: dbError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (dbError) {
        console.error('❌ Erro ao buscar conversas do banco:', dbError);
      }

      console.log(`📊 Conversas no banco: ${dbConversations?.length || 0}`);

      // Se temos integração Evolution API ativa, buscar conversas da API também
      if (evolutionIntegration) {
        try {
          console.log('🔌 Integração Evolution API ativa, buscando conversas da API...');
          const evolutionService = new EvolutionApiService(evolutionIntegration);
          
          // Verificar se a instância está conectada
          const instanceStatus = await evolutionService.checkInstanceStatus();
          
          if (instanceStatus.active) {
            console.log('✅ Instância Evolution API conectada, buscando conversas...');
            const apiConversations = await evolutionService.getConversations();
            
            console.log(`📊 Conversas da API: ${apiConversations.length}`);
            
            // Sincronizar conversas da API com o banco de dados
            if (apiConversations.length > 0) {
              const conversationsToSync = apiConversations.map(conv => ({
                contact_name: conv.name,
                contact_phone: conv.remoteJid,
                last_message: conv.lastMessage || null,
                last_message_time: new Date(conv.timestamp).toISOString(),
                unread_count: conv.unreadCount || 0,
                status: 'active',
                integration_id: evolutionIntegration.id,
                user_id: user.id
              }));

              // Usar upsert para inserir ou atualizar conversas
              const { error: syncError } = await supabase
                .from('whatsapp_conversations')
                .upsert(conversationsToSync, {
                  onConflict: 'contact_phone,integration_id',
                  ignoreDuplicates: false
                });

              if (syncError) {
                console.error('❌ Erro ao sincronizar conversas:', syncError);
              } else {
                console.log('✅ Conversas sincronizadas com sucesso');
              }

              // Buscar novamente as conversas atualizadas do banco
              const { data: updatedConversations, error: updateError } = await supabase
                .from('whatsapp_conversations')
                .select('*')
                .order('last_message_time', { ascending: false, nullsFirst: false });

              if (!updateError && updatedConversations) {
                console.log(`✅ Conversas atualizadas: ${updatedConversations.length}`);
                return updatedConversations as WhatsAppConversation[];
              }
            }
          } else {
            console.warn('⚠️ Instância Evolution API não está conectada:', instanceStatus.error);
            toast({
              title: "⚠️ WhatsApp desconectado",
              description: "A instância do WhatsApp não está conectada. Verifique a configuração.",
              variant: "destructive"
            });
          }
        } catch (apiError) {
          console.error('❌ Erro ao buscar conversas da Evolution API:', apiError);
          toast({
            title: "❌ Erro no WhatsApp",
            description: `Erro ao conectar com WhatsApp: ${apiError.message}`,
            variant: "destructive"
          });
        }
      } else {
        console.log('⚠️ Nenhuma integração Evolution API ativa encontrada');
      }

      // Retornar conversas do banco de dados (seja original ou atualizada)
      return (dbConversations || []) as WhatsAppConversation[];
    },
    enabled: true,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considerar dados stale após 10 segundos
  });
};

export const useCreateWhatsAppConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversation: Omit<WhatsAppConversation, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      const conversationData = {
        ...conversation,
        user_id: user.id
      };

      console.log('Creating WhatsApp conversation with data:', conversationData);

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
    onError: (error) => {
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
        console.error('User not authenticated:', authError);
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
    onError: (error) => {
      console.error('Error updating WhatsApp conversation:', error);
      toast({
        title: "Erro ao atualizar conversa",
        description: error.message || "Ocorreu um erro ao atualizar a conversa.",
        variant: "destructive"
      });
    },
  });
};
