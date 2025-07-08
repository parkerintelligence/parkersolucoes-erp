
// Since the 'backups' table doesn't exist in the database, 
// this hook is temporarily disabled and returns mock data
// until the proper table is created

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      // Return empty array since backups table doesn't exist
      return [] as Backup[];
    },
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backup: Omit<Backup, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      // Mock implementation - table doesn't exist
      toast({
        title: "Tabela não encontrada",
        description: "A tabela de backups não existe no banco de dados.",
        variant: "destructive"
      });
      throw new Error('Backups table does not exist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation - table doesn't exist
      toast({
        title: "Tabela não encontrada",
        description: "A tabela de backups não existe no banco de dados.",
        variant: "destructive"
      });
      throw new Error('Backups table does not exist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
};
