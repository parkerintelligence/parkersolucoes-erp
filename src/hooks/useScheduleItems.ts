import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScheduleItem {
  id: string;
  title: string;
  type: 'certificate' | 'license' | 'system_update';
  due_date: string;
  description: string | null;
  company: string;
  status: 'pending' | 'completed' | 'overdue';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useScheduleItems = () => {
  return useQuery({
    queryKey: ['schedule-items'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching schedule items:', error);
        throw error;
      }

      return data as ScheduleItem[];
    },
  });
};

export const useCreateScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      const itemData = {
        ...item,
        user_id: user.id,
        status: 'pending' as const
      };

      console.log('Creating schedule item with data:', itemData);

      const { data, error } = await supabase
        .from('schedule_items')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        console.error('Error creating schedule item:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-items'] });
      toast({
        title: "Agendamento criado!",
        description: "O item foi adicionado à agenda com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating schedule item:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Ocorreu um erro ao criar o agendamento. Tente novamente.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduleItem> }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('schedule_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating schedule item:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-items'] });
    },
    onError: (error) => {
      console.error('Error updating schedule item:', error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message || "Ocorreu um erro ao atualizar o agendamento.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting schedule item:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-items'] });
      toast({
        title: "Item removido!",
        description: "O agendamento foi removido da agenda.",
      });
    },
    onError: (error) => {
      console.error('Error deleting schedule item:', error);
      toast({
        title: "Erro ao remover agendamento",
        description: error.message || "Ocorreu um erro ao remover o agendamento.",
        variant: "destructive"
      });
    },
  });
};
