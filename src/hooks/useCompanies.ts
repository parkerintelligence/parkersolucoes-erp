
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, isMaster } = useAuth();
  
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Company[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching companies, isMaster:', isMaster, 'userEmail:', user.email);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      console.log('Companies fetched:', data);
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const { user, isMaster } = useAuth();

  return useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Allow master users or the specific email to create companies
      const canCreate = isMaster || user.email === 'contato@parkersolucoes.com.br';
      
      if (!canCreate) {
        throw new Error('Only master users can create companies');
      }

      console.log('Creating company:', company, 'User is master:', isMaster);

      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...company,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      console.log('Company created:', data);
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
  const { user, isMaster } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...company }: Partial<Company> & { id: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Allow master users or the specific email to update companies
      const canUpdate = isMaster || user.email === 'contato@parkersolucoes.com.br';

      if (!canUpdate) {
        throw new Error('Only master users can update companies');
      }

      console.log('Updating company:', id, company, 'User is master:', isMaster);

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

      console.log('Company updated:', data);
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
  const { user, isMaster } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Allow master users or the specific email to delete companies
      const canDelete = isMaster || user.email === 'contato@parkersolucoes.com.br';

      if (!canDelete) {
        throw new Error('Only master users can delete companies');
      }

      console.log('Deleting company:', id, 'User is master:', isMaster);

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting company:', error);
        throw error;
      }

      console.log('Company deleted:', id);
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
