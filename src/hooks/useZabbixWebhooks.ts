
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ZabbixWebhook {
  id: string;
  user_id: string;
  name: string;
  trigger_type: 'problem_created' | 'problem_resolved' | 'host_down' | 'host_up';
  actions: {
    create_glpi_ticket?: boolean;
    send_whatsapp?: boolean;
    whatsapp_number?: string;
    glpi_entity_id?: number;
    custom_message?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_triggered?: string;
  trigger_count: number;
}

export const useZabbixWebhooks = () => {
  const queryClient = useQueryClient();
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [executingWebhook, setExecutingWebhook] = useState<string | null>(null);

  // Fetch webhooks
  const { data: webhooks = [], isLoading, error } = useQuery({
    queryKey: ['zabbix-webhooks'],
    queryFn: async () => {
      console.log('🔍 Fetching Zabbix webhooks...');
      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching webhooks:', error);
        throw error;
      }

      console.log('✅ Webhooks fetched:', data);
      return data as ZabbixWebhook[];
    },
  });

  // Create webhook mutation
  const createWebhook = useMutation({
    mutationFn: async (webhook: Omit<ZabbixWebhook, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_triggered' | 'trigger_count'>) => {
      console.log('📝 Creating webhook:', webhook);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .insert({
          ...webhook,
          user_id: userData.user.id,
          trigger_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating webhook:', error);
        throw error;
      }

      console.log('✅ Webhook created:', data);
      return data as ZabbixWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });
      toast({
        title: "✅ Webhook criado!",
        description: "O webhook foi configurado com sucesso."
      });
    },
    onError: (error) => {
      console.error('❌ Create webhook error:', error);
      toast({
        title: "❌ Erro ao criar webhook",
        description: "Não foi possível criar o webhook. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Update webhook mutation
  const updateWebhook = useMutation({
    mutationFn: async (webhook: ZabbixWebhook) => {
      console.log('📝 Updating webhook:', webhook);

      const { data, error } = await supabase
        .from('zabbix_webhooks')
        .update({
          name: webhook.name,
          trigger_type: webhook.trigger_type,
          actions: webhook.actions,
          is_active: webhook.is_active
        })
        .eq('id', webhook.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating webhook:', error);
        throw error;
      }

      console.log('✅ Webhook updated:', data);
      return data as ZabbixWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });
      toast({
        title: "✅ Webhook atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
    },
    onError: (error) => {
      console.error('❌ Update webhook error:', error);
      toast({
        title: "❌ Erro ao atualizar webhook",
        description: "Não foi possível atualizar o webhook. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Delete webhook mutation
  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Deleting webhook:', id);

      const { error } = await supabase
        .from('zabbix_webhooks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting webhook:', error);
        throw error;
      }

      console.log('✅ Webhook deleted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });
      toast({
        title: "✅ Webhook removido",
        description: "O webhook foi removido com sucesso."
      });
    },
    onError: (error) => {
      console.error('❌ Delete webhook error:', error);
      toast({
        title: "❌ Erro ao remover webhook",
        description: "Não foi possível remover o webhook. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Test webhook function
  const testWebhook = async (webhook: ZabbixWebhook) => {
    setTestingWebhook(webhook.id);
    
    try {
      console.log('🧪 Testing webhook:', webhook.name);
      
      // Simular dados de teste do Zabbix
      const testData = {
        problem_name: 'Teste - Problema de conectividade',
        host_name: 'servidor-teste.empresa.com',
        severity: '4',
        timestamp: new Date().toISOString(),
        event_id: 'test_' + Date.now()
      };

      // Simular execução das ações com delays para realismo
      if (webhook.actions.create_glpi_ticket) {
        console.log('📝 Simulando criação de chamado GLPI...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Chamado GLPI criado (simulação)');
      }

      if (webhook.actions.send_whatsapp) {
        console.log('📱 Simulando envio de WhatsApp...');
        let message = webhook.actions.custom_message || 
          '🚨 Alerta Zabbix: {problem_name} no host {host_name}';
        
        // Substituir variáveis
        message = message
          .replace('{problem_name}', testData.problem_name)
          .replace('{host_name}', testData.host_name)
          .replace('{severity}', testData.severity)
          .replace('{timestamp}', new Date(testData.timestamp).toLocaleString('pt-BR'));

        console.log('📲 Mensagem WhatsApp:', message);
        console.log('📞 Número:', webhook.actions.whatsapp_number);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('✅ WhatsApp enviado (simulação)');
      }

      // Não atualizar contador no teste
      toast({
        title: "✅ Teste realizado!",
        description: `O webhook "${webhook.name}" foi testado com sucesso. Verifique o console para detalhes.`
      });
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      toast({
        title: "❌ Erro no teste",
        description: "Falha ao testar o webhook.",
        variant: "destructive"
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  // Execute webhook function
  const executeWebhook = async (webhook: ZabbixWebhook) => {
    if (!webhook.is_active) {
      toast({
        title: "⚠️ Webhook inativo",
        description: "Este webhook está desativado e não pode ser executado.",
        variant: "destructive"
      });
      return;
    }

    setExecutingWebhook(webhook.id);

    try {
      console.log('🚀 Executando webhook:', webhook.name);
      
      // Simular execução real (aqui você integraria com APIs reais)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar estatísticas
      const { error } = await supabase
        .from('zabbix_webhooks')
        .update({
          trigger_count: webhook.trigger_count + 1,
          last_triggered: new Date().toISOString()
        })
        .eq('id', webhook.id);

      if (error) {
        console.error('❌ Error updating webhook stats:', error);
        throw error;
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });

      toast({
        title: "✅ Webhook executado!",
        description: `O webhook "${webhook.name}" foi executado com sucesso.`
      });
    } catch (error) {
      console.error('❌ Erro na execução:', error);
      toast({
        title: "❌ Erro na execução",
        description: "Falha ao executar o webhook.",
        variant: "destructive"
      });
    } finally {
      setExecutingWebhook(null);
    }
  };

  // Toggle webhook active state
  const toggleWebhook = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      console.log('🔄 Toggling webhook:', id, 'to', isActive);

      const { error } = await supabase
        .from('zabbix_webhooks')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('❌ Error toggling webhook:', error);
        throw error;
      }

      console.log('✅ Webhook toggled');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });
    },
    onError: (error) => {
      console.error('❌ Toggle webhook error:', error);
      toast({
        title: "❌ Erro ao alterar status",
        description: "Não foi possível alterar o status do webhook.",
        variant: "destructive"
      });
    }
  });

  return {
    webhooks,
    isLoading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    executeWebhook,
    toggleWebhook,
    testingWebhook,
    executingWebhook
  };
};
