
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Company[]> => {
      console.log('Fetching companies (auth removed)');

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      console.log('Companies fetched successfully:', data?.length || 0, 'companies');
      return data || [];
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      console.log('Creating company:', company, '(auth removed)');

      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...company,
          user_id: 'system'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      console.log('Company created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa criada com sucesso!",
        description: "A empresa foi adicionada ao sistema.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating company:', error);
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...company }: Partial<Company> & { id: string }) => {
      console.log('Updating company:', id, company, '(auth removed)');

      const { data, error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company:', error);
        throw error;
      }

      console.log('Company updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa atualizada com sucesso!",
        description: "As informações da empresa foram atualizadas.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating company:', error);
      toast({
        title: "Erro ao atualizar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting company:', id, '(auth removed)');

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting company:', error);
        throw error;
      }

      console.log('Company deleted successfully:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa excluída com sucesso!",
        description: "A empresa foi removida do sistema.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro ao excluir empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};
