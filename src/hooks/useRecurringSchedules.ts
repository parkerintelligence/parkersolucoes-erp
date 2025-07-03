import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type RecurringSchedule = Tables<'recurring_schedules'>;
type RecurringScheduleInsert = TablesInsert<'recurring_schedules'>;
type RecurringScheduleUpdate = TablesUpdate<'recurring_schedules'>;

export const useRecurringSchedules = () => {
  return useQuery({
    queryKey: ['recurring_schedules'],
    queryFn: async (): Promise<RecurringSchedule[]> => {
      const { data, error } = await supabase
        .from('recurring_schedules')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateRecurringSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: Omit<RecurringScheduleInsert, 'user_id'>): Promise<RecurringSchedule> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('recurring_schedules')
        .insert({
          ...schedule,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_schedules'] });
      toast({
        title: "Agendamento criado!",
        description: "O agendamento recorrente foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRecurringSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RecurringScheduleUpdate }): Promise<RecurringSchedule> => {
      const { data, error } = await supabase
        .from('recurring_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_schedules'] });
      toast({
        title: "Agendamento atualizado!",
        description: "As informações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteRecurringSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('recurring_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_schedules'] });
      toast({
        title: "Agendamento removido!",
        description: "O agendamento foi removido do sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};