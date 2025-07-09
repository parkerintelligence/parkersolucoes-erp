
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EvolutionApiService } from '@/utils/evolutionApiService';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';

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
  
  const { data: integrations } = useIntegrations();
  const { createTicket } = useGLPIExpanded();

  // Get Evolution API integration
  const evolutionIntegration = integrations?.find(integration => 
    integration.type === 'evolution_api' && integration.is_active
  );

  // Get GLPI integration
  const glpiIntegration = integrations?.find(integration => 
    integration.type === 'glpi' && integration.is_active
  );

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

  // Real WhatsApp sending function
  const sendWhatsAppMessage = async (webhook: ZabbixWebhook, testData: any) => {
    if (!evolutionIntegration) {
      throw new Error('Evolution API não está configurada');
    }

    if (!webhook.actions.whatsapp_number) {
      throw new Error('Número do WhatsApp não configurado no webhook');
    }

    console.log('📱 Enviando WhatsApp via Evolution API...');
    
    const evolutionService = new EvolutionApiService(evolutionIntegration);
    
    let message = webhook.actions.custom_message || 
      '🚨 Alerta Zabbix: {problem_name} no host {host_name}';
    
    // Replace variables in message
    message = message
      .replace('{problem_name}', testData.problem_name)
      .replace('{host_name}', testData.host_name)
      .replace('{severity}', testData.severity)
      .replace('{timestamp}', new Date(testData.timestamp).toLocaleString('pt-BR'));

    console.log('📲 Mensagem a ser enviada:', message);
    console.log('📞 Número:', webhook.actions.whatsapp_number);

    const result = await evolutionService.sendMessage(webhook.actions.whatsapp_number, message);
    
    if (!result.success) {
      console.error('❌ Erro ao enviar WhatsApp:', result.error);
      throw new Error(result.error?.message || 'Erro ao enviar WhatsApp');
    }

    console.log('✅ WhatsApp enviado com sucesso');
    return result;
  };

  // Real GLPI ticket creation function
  const createGLPITicket = async (webhook: ZabbixWebhook, testData: any) => {
    if (!glpiIntegration) {
      throw new Error('GLPI não está configurado');
    }

    console.log('📝 Criando chamado GLPI...');
    
    const ticketData = {
      name: `Zabbix Alert: ${testData.problem_name}`,
      content: `Problema detectado pelo Zabbix:

🔍 Problema: ${testData.problem_name}
🖥️ Host: ${testData.host_name}
⚠️ Severidade: ${testData.severity}
📅 Data/Hora: ${new Date(testData.timestamp).toLocaleString('pt-BR')}
🆔 Event ID: ${testData.event_id}

Este chamado foi criado automaticamente pelo sistema de monitoramento Zabbix através do webhook "${webhook.name}".`,
      urgency: parseInt(testData.severity) >= 4 ? 4 : 3,
      impact: parseInt(testData.severity) >= 4 ? 4 : 3,
      priority: parseInt(testData.severity) >= 4 ? 4 : 3,
      status: 1, // New
      type: 1, // Incident
      entities_id: webhook.actions.glpi_entity_id || 0
    };

    console.log('🎫 Dados do chamado:', ticketData);

    const result = await createTicket.mutateAsync(ticketData);
    console.log('✅ Chamado GLPI criado:', result);
    
    return result;
  };

  // Test webhook function with real integrations
  const testWebhook = async (webhook: ZabbixWebhook) => {
    setTestingWebhook(webhook.id);
    
    try {
      console.log('🧪 Testing webhook with real integrations:', webhook.name);
      
      // Test data simulation
      const testData = {
        problem_name: 'Teste - Problema de conectividade',
        host_name: 'servidor-teste.empresa.com',
        severity: '4',
        timestamp: new Date().toISOString(),
        event_id: 'test_' + Date.now()
      };

      const results = [];

      // Test GLPI ticket creation if enabled
      if (webhook.actions.create_glpi_ticket) {
        try {
          console.log('🎫 Testando criação de chamado GLPI...');
          const glpiResult = await createGLPITicket(webhook, testData);
          results.push('✅ Chamado GLPI criado com sucesso');
          console.log('✅ GLPI ticket created successfully');
        } catch (error) {
          const errorMsg = `❌ Erro ao criar chamado GLPI: ${error.message}`;
          results.push(errorMsg);
          console.error('❌ GLPI Error:', error);
        }
      }

      // Test WhatsApp message if enabled
      if (webhook.actions.send_whatsapp) {
        try {
          console.log('📱 Testando envio de WhatsApp...');
          const whatsappResult = await sendWhatsAppMessage(webhook, testData);
          results.push('✅ WhatsApp enviado com sucesso');
          console.log('✅ WhatsApp sent successfully');
        } catch (error) {
          const errorMsg = `❌ Erro ao enviar WhatsApp: ${error.message}`;
          results.push(errorMsg);
          console.error('❌ WhatsApp Error:', error);
        }
      }

      if (results.length === 0) {
        results.push('⚠️ Nenhuma ação configurada para teste');
      }

      toast({
        title: "🧪 Teste concluído",
        description: results.join('\n')
      });

    } catch (error) {
      console.error('❌ Erro geral no teste:', error);
      toast({
        title: "❌ Erro no teste",
        description: `Falha ao testar o webhook: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  // Execute webhook function (production execution)
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
      console.log('🚀 Executando webhook em produção:', webhook.name);
      
      // This would normally be called by Zabbix with real data
      // For now, we'll use test data but mark it as production execution
      const productionData = {
        problem_name: 'Produção - High CPU usage',
        host_name: 'prod-server-01.company.com',
        severity: '4',
        timestamp: new Date().toISOString(),
        event_id: 'prod_' + Date.now()
      };

      let successCount = 0;
      const totalActions = (webhook.actions.create_glpi_ticket ? 1 : 0) + (webhook.actions.send_whatsapp ? 1 : 0);

      // Execute GLPI ticket creation
      if (webhook.actions.create_glpi_ticket) {
        try {
          await createGLPITicket(webhook, productionData);
          successCount++;
        } catch (error) {
          console.error('❌ GLPI execution error:', error);
        }
      }

      // Execute WhatsApp message
      if (webhook.actions.send_whatsapp) {
        try {
          await sendWhatsAppMessage(webhook, productionData);
          successCount++;
        } catch (error) {
          console.error('❌ WhatsApp execution error:', error);
        }
      }

      // Update statistics
      const { error } = await supabase
        .from('zabbix_webhooks')
        .update({
          trigger_count: webhook.trigger_count + 1,
          last_triggered: new Date().toISOString()
        })
        .eq('id', webhook.id);

      if (error) {
        console.error('❌ Error updating webhook stats:', error);
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['zabbix-webhooks'] });

      if (successCount === totalActions) {
        toast({
          title: "✅ Webhook executado!",
          description: `O webhook "${webhook.name}" foi executado com sucesso. Todas as ${totalActions} ações foram processadas.`
        });
      } else {
        toast({
          title: "⚠️ Execução parcial",
          description: `${successCount} de ${totalActions} ações foram executadas com sucesso.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erro na execução:', error);
      toast({
        title: "❌ Erro na execução",
        description: `Falha ao executar o webhook: ${error.message}`,
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
    executingWebhook,
    evolutionIntegration,
    glpiIntegration
  };
};
