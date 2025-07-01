
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  type: 'chatwoot' | 'evolution_api' | 'wasabi' | 'grafana' | 'bomcontrole';
  name: string;
  base_url: string;
  api_token: string;
  webhook_url: string | null;
  phone_number: string | null;
  username: string | null;
  password: string | null;
  is_active: boolean | null;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          ...integration,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating integration:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração criada!",
        description: "A integração foi configurada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating integration:', error);
      toast({
        title: "Erro ao criar integração",
        description: "Ocorreu um erro ao criar a integração. Tente novamente.",
        variant: "destructive"
      });
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
        title: "Integração removida!",
        description: "A integração foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting integration:', error);
      toast({
        title: "Erro ao remover integração",
        description: "Ocorreu um erro ao remover a integração.",
        variant: "destructive"
      });
    },
  });
};
