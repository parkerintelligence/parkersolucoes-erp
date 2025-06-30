
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CompanyLink {
  id: string;
  company_id: string;
  name: string;
  url: string;
  service: string | null;
  username: string | null;
  password: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useCompanyLinks = (companyId?: string) => {
  return useQuery({
    queryKey: ['company-links', companyId],
    queryFn: async () => {
      let query = supabase
        .from('company_links')
        .select('*')
        .order('name');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching company links:', error);
        throw error;
      }

      return data as CompanyLink[];
    },
    enabled: !!companyId,
  });
};

export const useCreateCompanyLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: Omit<CompanyLink, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('company_links')
        .insert([{
          ...link,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating company link:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-links'] });
      toast({
        title: "Link criado!",
        description: "O link foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating company link:', error);
      toast({
        title: "Erro ao criar link",
        description: "Ocorreu um erro ao criar o link. Tente novamente.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateCompanyLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CompanyLink> }) => {
      const { data, error } = await supabase
        .from('company_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company link:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-links'] });
      toast({
        title: "Link atualizado!",
        description: "O link foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating company link:', error);
      toast({
        title: "Erro ao atualizar link",
        description: "Ocorreu um erro ao atualizar o link.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteCompanyLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_links')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting company link:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-links'] });
      toast({
        title: "Link removido!",
        description: "O link foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting company link:', error);
      toast({
        title: "Erro ao remover link",
        description: "Ocorreu um erro ao remover o link.",
        variant: "destructive"
      });
    },
  });
};
