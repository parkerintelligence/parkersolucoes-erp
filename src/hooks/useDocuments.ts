
// Since the 'documents' table doesn't exist in the database, 
// this hook is temporarily disabled and returns mock data
// until the proper table is created

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  category?: string;
  type: string;
  status: string;
  file_path?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      // Return empty array since documents table doesn't exist
      return [] as Document[];
    },
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      // Mock implementation - table doesn't exist
      toast({
        title: "Tabela não encontrada",
        description: "A tabela de documentos não existe no banco de dados.",
        variant: "destructive"
      });
      throw new Error('Documents table does not exist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Document> }) => {
      // Mock implementation - table doesn't exist
      toast({
        title: "Tabela não encontrada",
        description: "A tabela de documentos não existe no banco de dados.",
        variant: "destructive"
      });
      throw new Error('Documents table does not exist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation - table doesn't exist
      toast({
        title: "Tabela não encontrada",
        description: "A tabela de documentos não existe no banco de dados.",
        variant: "destructive"
      });
      throw new Error('Documents table does not exist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
