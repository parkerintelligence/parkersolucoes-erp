
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Backup {
  id: string;
  name: string;
  type: string;
  frequency: string;
  company_id: string;
  retention_days: number;
  status: string;
  file_size?: number;
  progress?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useBackups = () => {
  return useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching backups:', error);
        throw error;
      }

      return data as Backup[];
    },
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backup: Omit<Backup, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('backups')
        .insert([{
          ...backup,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating backup:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast({
        title: "Backup criado!",
        description: "O backup foi configurado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating backup:', error);
      toast({
        title: "Erro ao criar backup",
        description: "Ocorreu um erro ao configurar o backup.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting backup:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast({
        title: "Backup excluído!",
        description: "O backup foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting backup:', error);
      toast({
        title: "Erro ao excluir backup",
        description: "Ocorreu um erro ao excluir o backup.",
        variant: "destructive"
      });
    },
  });
};
