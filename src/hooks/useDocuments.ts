
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      return data as Document[];
    },
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...document,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Documento criado!",
        description: "O documento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating document:', error);
      toast({
        title: "Erro ao criar documento",
        description: "Ocorreu um erro ao criar o documento.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Document> }) => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating document:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Documento atualizado!",
        description: "O documento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating document:', error);
      toast({
        title: "Erro ao atualizar documento",
        description: "Ocorreu um erro ao atualizar o documento.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Documento excluído!",
        description: "O documento foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast({
        title: "Erro ao excluir documento",
        description: "Ocorreu um erro ao excluir o documento.",
        variant: "destructive"
      });
    },
  });
};
