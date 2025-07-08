
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  budget_number: string;
  company_id: string;
  title: string;
  description: string | null;
  status: string | null;
  total_amount: number | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  companies?: {
    name: string;
  };
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number | null;
  total_price: number;
  created_at: string;
  services?: {
    name: string;
    unit: string | null;
  };
}

export const useBudgets = () => {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          companies(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budgets:', error);
        throw error;
      }

      return data as Budget[];
    },
  });
};

export const useBudgetItems = (budgetId: string) => {
  return useQuery({
    queryKey: ['budget-items', budgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_items')
        .select(`
          *,
          services(name, unit)
        `)
        .eq('budget_id', budgetId);

      if (error) {
        console.error('Error fetching budget items:', error);
        throw error;
      }

      return data as BudgetItem[];
    },
    enabled: !!budgetId,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          ...budget,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating budget:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Orçamento criado!",
        description: "O orçamento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating budget:', error);
      toast({
        title: "Erro ao criar orçamento",
        description: "Ocorreu um erro ao criar o orçamento.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Budget> }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating budget:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Orçamento atualizado!",
        description: "O orçamento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating budget:', error);
      toast({
        title: "Erro ao atualizar orçamento",
        description: "Ocorreu um erro ao atualizar o orçamento.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting budget:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Orçamento excluído!",
        description: "O orçamento foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting budget:', error);
      toast({
        title: "Erro ao excluir orçamento",
        description: "Ocorreu um erro ao excluir o orçamento.",
        variant: "destructive"
      });
    },
  });
};

export const useCreateBudgetItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<BudgetItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('budget_items')
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error('Error creating budget item:', error);
        throw error;
      }

      // Update budget total
      const { data: items } = await supabase
        .from('budget_items')
        .select('total_price')
        .eq('budget_id', item.budget_id);

      if (items) {
        const total = items.reduce((sum, item) => sum + item.total_price, 0);
        await supabase
          .from('budgets')
          .update({ total_amount: total })
          .eq('id', item.budget_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', variables.budget_id] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
};
