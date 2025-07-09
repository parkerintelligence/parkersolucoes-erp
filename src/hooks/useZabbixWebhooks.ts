import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';
import { EvolutionApiService } from '@/utils/evolutionApiService';

export interface ZabbixWebhook {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
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
  return useQuery({
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
};

export const useCreateZabbixWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhook: Omit<ZabbixWebhook, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .insert([{
          ...webhook,
          user_id: user.id
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
};

export const useUpdateZabbixWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZabbixWebhook> }) => {
      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .update(updates)
        .eq('id', id)
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
};

export const useDeleteZabbixWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
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
};

export const useZabbixAlerts = () => {
  return useQuery({
    queryKey: ['zabbix-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zabbix_alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching alerts:', error);
        throw error;
      }

      return data as ZabbixAlert[];
    },
  });
};

export const useCreateZabbixAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: Omit<ZabbixAlert, 'id' | 'created_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('zabbix_alerts')
        .insert([{
          ...alert,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating alert:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-alerts'] });
    },
    onError: (error) => {
      console.error('Error creating alert:', error);
    },
  });
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

      // Criar objeto compatível com o tipo esperado pelo serviço
      const serviceIntegration = {
        ...evolutionApiIntegration,
        api_token: evolutionApiIntegration.api_token,
        instance_name: evolutionApiIntegration.instance_name
      } as const;

      const evolutionService = new EvolutionApiService(serviceIntegration);
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
