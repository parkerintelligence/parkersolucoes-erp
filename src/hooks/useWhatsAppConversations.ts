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
      console.log('🔍 [WHATSAPP-CONVERSATIONS] Iniciando busca...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [WHATSAPP-CONVERSATIONS] Usuário não autenticado:', authError);
        throw new Error('User not authenticated');
      }

      console.log('👤 [WHATSAPP-CONVERSATIONS] Usuário autenticado:', user.id);
      
      // Buscar conversas do banco primeiro
      const { data: dbConversations, error: dbError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (dbError) {
        console.error('❌ [WHATSAPP-CONVERSATIONS] Erro ao buscar conversas do banco:', dbError);
      }

      console.log(`📊 [WHATSAPP-CONVERSATIONS] Conversas no banco: ${dbConversations?.length || 0}`);

      // Se há integração Evolution API ativa, tentar sincronizar
      if (evolutionIntegration) {
        try {
          console.log('🔌 [WHATSAPP-CONVERSATIONS] Integração Evolution API encontrada:', {
            id: evolutionIntegration.id,
            name: evolutionIntegration.name,
            base_url: evolutionIntegration.base_url,
            instance_name: evolutionIntegration.instance_name,
            has_api_token: !!evolutionIntegration.api_token
          });
          
          const evolutionService = new EvolutionApiService(evolutionIntegration);
          
          // Verificar status da instância primeiro
          console.log('📡 [WHATSAPP-CONVERSATIONS] Verificando status da instância...');
          const instanceStatus = await evolutionService.checkInstanceStatus();
          console.log('📡 [WHATSAPP-CONVERSATIONS] Status da instância:', instanceStatus);
          
          if (instanceStatus.active) {
            console.log('✅ [WHATSAPP-CONVERSATIONS] Instância ativa, sincronizando conversas...');
            
            try {
              // Buscar conversas da Evolution API
              console.log('🔄 [WHATSAPP-CONVERSATIONS] Buscando conversas da Evolution API...');
              const apiConversations = await evolutionService.getConversations();
              console.log(`📊 [WHATSAPP-CONVERSATIONS] Conversas da API: ${apiConversations.length}`);
              
              if (apiConversations.length > 0) {
                console.log('🔄 [WHATSAPP-CONVERSATIONS] Sincronizando conversas com banco...');
                console.log('📋 [WHATSAPP-CONVERSATIONS] Primeiras 3 conversas da API:', 
                  apiConversations.slice(0, 3).map(conv => ({
                    name: conv.name || conv.remoteJid?.split('@')[0],
                    remoteJid: conv.remoteJid,
                    lastMessage: conv.lastMessage?.substring(0, 50),
                    timestamp: conv.timestamp,
                    unreadCount: conv.unreadCount
                  }))
                );
                
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

                console.log('📝 [WHATSAPP-CONVERSATIONS] Dados para sincronizar:', conversationsToSync.length);
                console.log('📝 [WHATSAPP-CONVERSATIONS] Primeira conversa a sincronizar:', conversationsToSync[0]);

                // Sincronizar usando upsert
                const { data: syncedData, error: syncError } = await supabase
                  .from('whatsapp_conversations')
                  .upsert(conversationsToSync, {
                    onConflict: 'contact_phone,integration_id',
                    ignoreDuplicates: false
                  })
                  .select();

                if (syncError) {
                  console.error('❌ [WHATSAPP-CONVERSATIONS] Erro ao sincronizar conversas:', syncError);
                } else {
                  console.log('✅ [WHATSAPP-CONVERSATIONS] Conversas sincronizadas com sucesso');
                  console.log(`✅ [WHATSAPP-CONVERSATIONS] ${syncedData?.length || 0} conversas sincronizadas`);
                }

                // Buscar conversas atualizadas
                const { data: updatedConversations, error: updateError } = await supabase
                  .from('whatsapp_conversations')
                  .select('*')
                  .order('last_message_time', { ascending: false, nullsFirst: false });

                if (!updateError && updatedConversations) {
                  console.log(`✅ [WHATSAPP-CONVERSATIONS] Conversas atualizadas: ${updatedConversations.length}`);
                  return updatedConversations as WhatsAppConversation[];
                }
              } else {
                console.log('ℹ️ [WHATSAPP-CONVERSATIONS] Nenhuma conversa encontrada na API');
              }
            } catch (apiError) {
              console.error('❌ [WHATSAPP-CONVERSATIONS] Erro ao buscar conversas da API:', apiError);
              // Continuar com dados do banco
            }
          } else {
            console.warn('⚠️ [WHATSAPP-CONVERSATIONS] Instância não conectada ou inativa');
            console.warn('⚠️ [WHATSAPP-CONVERSATIONS] Status completo:', instanceStatus);
          }
        } catch (integrationError) {
          console.error('❌ [WHATSAPP-CONVERSATIONS] Erro na integração Evolution API:', integrationError);
          // Continuar com dados do banco
        }
      } else {
        console.log('⚠️ [WHATSAPP-CONVERSATIONS] Nenhuma integração Evolution API ativa');
        console.log('📋 [WHATSAPP-CONVERSATIONS] Integrações disponíveis:', 
          integrations.map(int => ({ type: int.type, active: int.is_active, name: int.name }))
        );
      }

      // Retornar dados do banco
      console.log(`📊 [WHATSAPP-CONVERSATIONS] Retornando ${(dbConversations || []).length} conversas do banco`);
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
      console.log('🔄 [WHATSAPP-SYNC] Forçando sincronização manual...');
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

// Hook para testar conectividade da Evolution API
export const useTestEvolutionConnection = () => {
  const { data: integrations = [] } = useIntegrations();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🧪 [EVOLUTION-TEST] Testando conectividade...');
      
      const evolutionIntegration = integrations.find(int => 
        int.type === 'evolution_api' && int.is_active
      );

      if (!evolutionIntegration) {
        throw new Error('Nenhuma integração Evolution API ativa encontrada');
      }

      const evolutionService = new EvolutionApiService(evolutionIntegration);
      const status = await evolutionService.checkInstanceStatus();
      
      console.log('🧪 [EVOLUTION-TEST] Resultado do teste:', status);
      return status;
    },
    onSuccess: (data) => {
      toast({
        title: data.active ? "✅ Conexão OK" : "⚠️ Instância inativa",
        description: data.active ? "Evolution API conectada com sucesso" : "Instância não está conectada",
        variant: data.active ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      console.error('❌ [EVOLUTION-TEST] Erro no teste:', error);
      toast({
        title: "❌ Erro de conexão",
        description: `Falha ao conectar: ${error.message}`,
        variant: "destructive"
      });
    },
  });
};
