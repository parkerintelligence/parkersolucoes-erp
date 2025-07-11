
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  type: string;
  name: string;
  base_url: string;
  api_token?: string;
  username?: string;
  password?: string;
  region?: string;
  bucket_name?: string;
  port?: number;
  directory?: string;
  passive_mode?: boolean;
  use_ssl?: boolean;
  keep_logged?: boolean;
  phone_number?: string;
  webhook_url?: string;
  instance_name?: string; // Adicionado para Evolution API
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useIntegrations = () => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching integrations:', error);
        throw error;
      }

      return data as Integration[];
    },
  });
};

export const useCreateIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integration: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      console.log('🚀 Iniciando criação de integração:', integration);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('User not authenticated');
      }

      console.log('✅ Usuário autenticado:', user.id);

      const integrationWithUser = {
        ...integration,
        user_id: user.id
      };

      console.log('📝 Dados completos para inserção:', integrationWithUser);

      const { data, error } = await supabase
        .from('integrations')
        .insert([integrationWithUser])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro na inserção no banco:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Detalhes do erro:', error.details);
        console.error('❌ Hint do erro:', error.hint);
        throw error;
      }

      console.log('✅ Integração criada com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Sucesso na criação, invalidando cache...');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error) => {
      console.error('💥 Erro final no hook:', error);
    },
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Integration> }) => {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating integration:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração atualizada!",
        description: "A integração foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating integration:', error);
      toast({
        title: "Erro ao atualizar integração",
        description: "Ocorreu um erro ao atualizar a integração.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting integration:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração excluída!",
        description: "A integração foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting integration:', error);
      toast({
        title: "Erro ao excluir integração",
        description: "Ocorreu um erro ao excluir a integração.",
        variant: "destructive"
      });
    },
  });
};
