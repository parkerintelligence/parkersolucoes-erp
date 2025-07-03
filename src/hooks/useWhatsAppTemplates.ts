import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WhatsAppTemplate {
  id: string;
  user_id: string;
  name: string;
  template_type: 'backup_alert' | 'schedule_critical' | 'glpi_summary';
  subject: string;
  body: string;
  variables?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppTemplates = () => {
  return useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .order('template_type', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar templates:', error);
        throw error;
      }
      
      return data as WhatsAppTemplate[];
    },
  });
};

export const useCreateWhatsAppTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<WhatsAppTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .insert({
          ...template,
          user_id: userData.user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({
        title: "Template criado!",
        description: "Template de mensagem criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateWhatsAppTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WhatsAppTemplate> }) => {
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({
        title: "Template atualizado!",
        description: "Template de mensagem atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteWhatsAppTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_message_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({
        title: "Template removido!",
        description: "Template de mensagem removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};