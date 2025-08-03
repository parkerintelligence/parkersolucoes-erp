
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';
import { EvolutionApiService } from '@/utils/evolutionApiService';

export interface ZabbixWebhook {
  id: string;
  name: string;
  trigger_type: string;
  actions: {
    create_glpi_ticket: boolean;
    send_whatsapp: boolean;
    whatsapp_number: string;
    glpi_entity_id: number;
    custom_message: string;
  };
  is_active: boolean;
  trigger_count: number;
  last_triggered?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ZabbixAlert {
  id: string;
  webhook_id: string;
  alert_name: string;
  severity: string;
  status: string;
  host: string;
  description: string;
  timestamp: string;
  raw_data: any;
  created_at: string;
  user_id: string;
}

export const useZabbixWebhooks = () => {
  const { data: integrations } = useIntegrations();
  
  const webhooksQuery = useQuery({
    queryKey: ['zabbix-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching webhooks:', error);
        throw error;
      }

      return data as ZabbixWebhook[];
    },
  });

  const createWebhook = useMutation({
    mutationFn: async (webhook: Omit<ZabbixWebhook, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'trigger_count' | 'last_triggered'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .insert([{
          ...webhook,
          user_id: user.id,
          trigger_count: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating webhook:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });
      toast({
        title: "Webhook criado!",
        description: "O webhook foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating webhook:', error);
      toast({
        title: "Erro ao criar webhook",
        description: "Ocorreu um erro ao criar o webhook.",
        variant: "destructive"
      });
    },
  });

  const updateWebhook = useMutation({
    mutationFn: async (webhook: ZabbixWebhook) => {
      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .update(webhook)
        .eq('id', webhook.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating webhook:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });
      toast({
        title: "Webhook atualizado!",
        description: "O webhook foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating webhook:', error);
      toast({
        title: "Erro ao atualizar webhook",
        description: "Ocorreu um erro ao atualizar o webhook.",
        variant: "destructive"
      });
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('zabbix_webhooks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting webhook:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });
      toast({
        title: "Webhook excluído!",
        description: "O webhook foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Erro ao excluir webhook",
        description: "Ocorreu um erro ao excluir o webhook.",
        variant: "destructive"
      });
    },
  });

  const queryClient = useQueryClient();

  const evolutionIntegration = integrations?.find(int => int.type === 'evolution_api' && int.is_active);
  const glpiIntegration = integrations?.find(int => int.type === 'glpi' && int.is_active);

  return {
    webhooks: webhooksQuery.data || [],
    isLoading: webhooksQuery.isLoading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook: () => {}, // Placeholder
    executeWebhook: () => {}, // Placeholder
    toggleWebhook: updateWebhook,
    testingWebhook: null,
    executingWebhook: null,
    evolutionIntegration,
    glpiIntegration
  };
};

export const useSendWhatsAppMessage = () => {
  const { data: integrations } = useIntegrations();

  return useMutation({
    mutationFn: async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
      const evolutionApiIntegration = integrations?.find(int => int.type === 'evolution_api' && int.is_active);
      
      if (!evolutionApiIntegration) {
        throw new Error('Evolution API não configurada ou inativa');
      }

      // Validar se api_token e instance_name existem
      if (!evolutionApiIntegration.api_token || !evolutionApiIntegration.instance_name) {
        throw new Error('API Token e Nome da Instância são obrigatórios na configuração da Evolution API');
      }

      // Usar a integração completa diretamente
      const evolutionService = new EvolutionApiService(evolutionApiIntegration);
      const result = await evolutionService.sendMessage(phoneNumber, message);

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao enviar mensagem');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada!",
        description: "Mensagem WhatsApp enviada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    },
  });
};
