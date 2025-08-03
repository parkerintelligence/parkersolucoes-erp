
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Contract {
  id: string;
  contract_number: string;
  company_id: string;
  budget_id: string | null;
  title: string;
  content: string;
  status: string | null;
  signed_date: string | null;
  start_date: string | null;
  end_date: string | null;
  total_value: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  companies?: {
    name: string;
  };
}

export const useContracts = () => {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          companies(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
      }

      return data as Contract[];
    },
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contracts')
        .insert([{
          ...contract,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating contract:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Contrato criado!",
        description: "O contrato foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating contract:', error);
      toast({
        title: "Erro ao criar contrato",
        description: "Ocorreu um erro ao criar o contrato.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contract> }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating contract:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Contrato atualizado!",
        description: "O contrato foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating contract:', error);
      toast({
        title: "Erro ao atualizar contrato",
        description: "Ocorreu um erro ao atualizar o contrato.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting contract:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Contrato excluído!",
        description: "O contrato foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting contract:', error);
      toast({
        title: "Erro ao excluir contrato",
        description: "Ocorreu um erro ao excluir o contrato.",
        variant: "destructive"
      });
    },
  });
};
