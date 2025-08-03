"use client"

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

interface InstanceStatus {
  active: boolean;
  error?: string;
}

interface ApiConversation {
  remoteJid: string;
  name?: string;
  lastMessage?: string;
  timestamp?: number;
  unreadCount?: number;
}

export const useWhatsAppConversations = () => {
  const { data: integrations = [] } = useIntegrations();
  
  const evolutionIntegration = integrations.find(int => 
    int.type === 'evolution_api' && int.is_active
  );

  return useQuery({
    queryKey: ['whatsapp_conversations', evolutionIntegration?.id],
    queryFn: async () => {
      console.log('🔍 Buscando conversas WhatsApp...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('User not authenticated');
      }

      // Buscar conversas do banco primeiro
      const { data: dbConversations, error: dbError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (dbError) {
        console.error('❌ Erro ao buscar conversas do banco:', dbError);
      }

      console.log(`📊 ${dbConversations?.length || 0} conversas no banco`);

      // Se há integração Evolution API ativa, sincronizar
      if (evolutionIntegration?.api_token && evolutionIntegration?.instance_name) {
        try {
          console.log('🔌 Sincronizando com Evolution API...');
          
          const evolutionService = new EvolutionApiService(evolutionIntegration);
          
          // Verificar status da instância
          const instanceStatus = await evolutionService.checkInstanceStatus();
          console.log('📡 Status da instância:', instanceStatus);
          
          if (instanceStatus.active) {
            // Buscar conversas da API
            const apiConversations = await evolutionService.getConversations();
            console.log(`📊 ${apiConversations.length} conversas da API`);
            
            if (apiConversations.length > 0) {
              // Sincronizar com o banco
              const conversationsToSync = apiConversations
                .filter(conv => conv.remoteJid && conv.remoteJid.includes('@'))
                .map(conv => ({
                  contact_name: conv.name || conv.remoteJid?.split('@')[0] || 'Contato',
                  contact_phone: conv.remoteJid || '',
                  last_message: conv.lastMessage || null,
                  last_message_time: conv.timestamp ? new Date(conv.timestamp).toISOString() : new Date().toISOString(),
                  unread_count: conv.unreadCount || 0,
                  status: 'active',
                  integration_id: evolutionIntegration.id,
                  user_id: user.id
                }));

              if (conversationsToSync.length > 0) {
                const { data: syncedData, error: syncError } = await supabase
                  .from('whatsapp_conversations')
                  .upsert(conversationsToSync, {
                    onConflict: 'contact_phone,integration_id',
                    ignoreDuplicates: false
                  })
                  .select();

                if (syncError) {
                  console.error('❌ Erro ao sincronizar:', syncError);
                } else {
                  console.log(`✅ ${syncedData?.length || 0} conversas sincronizadas`);
                }

                // Buscar dados atualizados
                const { data: updatedConversations } = await supabase
                  .from('whatsapp_conversations')
                  .select('*')
                  .order('last_message_time', { ascending: false, nullsFirst: false });

                if (updatedConversations) {
                  return updatedConversations as WhatsAppConversation[];
                }
              }
            }
          } else {
            console.warn('⚠️ Instância não conectada');
          }
        } catch (error) {
          console.error('❌ Erro na sincronização:', error);
        }
      }

      return (dbConversations || []) as WhatsAppConversation[];
    },
    enabled: true,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2,
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
      console.log('✅ Sincronização manual iniciada');
      toast({
        title: "Sincronização iniciada",
        description: "As conversas estão sendo atualizadas...",
      });
    },
    onError: (error: any) => {
      console.error('Erro na sincronização manual:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar as conversas.",
        variant: "destructive"
      });
    },
  });
};

// Hook para testar conectividade
export const useTestEvolutionConnection = () => {
  const { data: integrations = [] } = useIntegrations();
  
  return useMutation({
    mutationFn: async () => {
      const evolutionIntegration = integrations.find(int => 
        int.type === 'evolution_api' && int.is_active
      );

      if (!evolutionIntegration) {
        throw new Error('Nenhuma integração Evolution API ativa');
      }

      const evolutionService = new EvolutionApiService(evolutionIntegration);
      
      // Testar status
      const instanceStatus = await evolutionService.checkInstanceStatus();
      
      if (!instanceStatus.active) {
        throw new Error(`Instância inativa: ${instanceStatus.error || 'Status desconhecido'}`);
      }

      // Testar conversas
      const conversations = await evolutionService.getConversations();
      
      return {
        success: true,
        instanceStatus,
        conversationsCount: conversations.length,
        message: `Conexão OK! ${conversations.length} conversas encontradas.`
      };
    },
    onSuccess: (result) => {
      toast({
        title: "✅ Conectividade OK",
        description: result.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro de conectividade",
        description: error.message || "Falha ao conectar com Evolution API",
        variant: "destructive"
      });
    },
  });
};
