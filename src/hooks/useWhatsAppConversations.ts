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
      console.log('🔍 useWhatsAppConversations: Iniciando busca de conversas...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ useWhatsAppConversations: Usuário não autenticado:', authError);
        throw new Error('User not authenticated');
      }

      console.log('👤 useWhatsAppConversations: Usuário autenticado:', user.id);
      
      // Primeiro, buscar conversas do banco de dados
      const { data: dbConversations, error: dbError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (dbError) {
        console.error('❌ useWhatsAppConversations: Erro ao buscar conversas do banco:', dbError);
      }

      console.log(`📊 useWhatsAppConversations: Conversas no banco: ${dbConversations?.length || 0}`);

      // Se temos integração Evolution API ativa, buscar conversas da API também
      if (evolutionIntegration) {
        try {
          console.log('🔌 useWhatsAppConversations: Integração Evolution API ativa, verificando conexão...');
          const evolutionService = new EvolutionApiService(evolutionIntegration);
          
          // Verificar se a instância está conectada
          const instanceStatus = await evolutionService.checkInstanceStatus();
          console.log('📡 useWhatsAppConversations: Status da instância:', instanceStatus);
          
          if (instanceStatus.active) {
            console.log('✅ useWhatsAppConversations: Instância conectada, buscando conversas da API...');
            
            try {
              const apiConversations = await evolutionService.getConversations();
              console.log(`📊 useWhatsAppConversations: Conversas da API: ${apiConversations.length}`);
              
              // Sincronizar conversas da API com o banco de dados
              if (apiConversations.length > 0) {
                console.log('🔄 useWhatsAppConversations: Sincronizando conversas...');
                
                const conversationsToSync = apiConversations.map(conv => ({
                  contact_name: conv.name || conv.remoteJid || 'Contato Desconhecido',
                  contact_phone: conv.remoteJid || '',
                  last_message: conv.lastMessage || null,
                  last_message_time: conv.timestamp ? new Date(conv.timestamp).toISOString() : new Date().toISOString(),
                  unread_count: conv.unreadCount || 0,
                  status: 'active',
                  integration_id: evolutionIntegration.id,
                  user_id: user.id
                }));

                console.log('📝 useWhatsAppConversations: Dados para sincronizar:', conversationsToSync.length);

                // Usar upsert para inserir ou atualizar conversas
                const { error: syncError } = await supabase
                  .from('whatsapp_conversations')
                  .upsert(conversationsToSync, {
                    onConflict: 'contact_phone,integration_id',
                    ignoreDuplicates: false
                  });

                if (syncError) {
                  console.error('❌ useWhatsAppConversations: Erro ao sincronizar conversas:', syncError);
                } else {
                  console.log('✅ useWhatsAppConversations: Conversas sincronizadas com sucesso');
                }

                // Buscar novamente as conversas atualizadas do banco
                const { data: updatedConversations, error: updateError } = await supabase
                  .from('whatsapp_conversations')
                  .select('*')
                  .order('last_message_time', { ascending: false, nullsFirst: false });

                if (!updateError && updatedConversations) {
                  console.log(`✅ useWhatsAppConversations: Conversas atualizadas: ${updatedConversations.length}`);
                  return updatedConversations as WhatsAppConversation[];
                }
              } else {
                console.log('ℹ️ useWhatsAppConversations: Nenhuma conversa encontrada na API');
              }
            } catch (apiError) {
              console.error('❌ useWhatsAppConversations: Erro ao buscar conversas da API:', apiError);
              // Não mostrar toast aqui, apenas log - deixar que a UI trate
            }
          } else {
            console.warn('⚠️ useWhatsAppConversations: Instância não conectada:', instanceStatus.error);
            // Não mostrar toast aqui - a UI deve verificar o status de conexão
          }
        } catch (apiError) {
          console.error('❌ useWhatsAppConversations: Erro geral da Evolution API:', apiError);
          // Não mostrar toast aqui - a UI deve tratar erros de conexão
        }
      } else {
        console.log('⚠️ useWhatsAppConversations: Nenhuma integração Evolution API ativa encontrada');
      }

      // Retornar conversas do banco de dados (seja original ou atualizada)
      console.log(`📊 useWhatsAppConversations: Retornando ${(dbConversations || []).length} conversas`);
      return (dbConversations || []) as WhatsAppConversation[];
    },
    enabled: true,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considerar dados stale após 10 segundos
    retry: 3, // Tentar 3 vezes em caso de erro
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
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
