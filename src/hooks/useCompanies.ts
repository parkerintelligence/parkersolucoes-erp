
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      console.log('Fetching companies...');
      
      // Primeiro verificar se temos uma sessão válida
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Erro de sessão');
      }

      if (!session?.user) {
        console.error('No user session found');
        throw new Error('Usuário não autenticado');
      }

      console.log('User authenticated:', session.user.id);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      console.log('Companies fetched:', data?.length || 0);
      return data as Company[];
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      console.log('Creating company...');
      
      // Verificar sessão antes de criar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error during create:', sessionError);
        throw new Error('Erro de sessão ao criar empresa');
      }

      if (!session?.user) {
        console.error('No user session found during create');
        throw new Error('Usuário não autenticado para criar empresa');
      }

      const companyData = {
        ...company,
        user_id: session.user.id
      };

      console.log('Creating company with data:', companyData);

      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
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
        title: "Empresa criada!",
        description: "A empresa foi cadastrada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating company:', error);
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Ocorreu um erro ao criar a empresa. Tente novamente.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('User not authenticated:', sessionError);
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa atualizada!",
        description: "A empresa foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating company:', error);
      toast({
        title: "Erro ao atualizar empresa",
        description: error.message || "Ocorreu um erro ao atualizar a empresa.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('User not authenticated:', sessionError);
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting company:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa removida!",
        description: "A empresa foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro ao remover empresa",
        description: error.message || "Ocorreu um erro ao remover a empresa.",
        variant: "destructive"
      });
    },
  });
};
