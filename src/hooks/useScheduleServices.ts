import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ScheduleService = Tables<'schedule_services'>;
type ScheduleServiceInsert = TablesInsert<'schedule_services'>;
type ScheduleServiceUpdate = TablesUpdate<'schedule_services'>;

export const useScheduleServices = () => {
  return useQuery({
    queryKey: ['schedule_services'],
    queryFn: async (): Promise<ScheduleService[]> => {
      const { data, error } = await supabase
        .from('schedule_services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateScheduleService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Omit<ScheduleServiceInsert, 'user_id'>): Promise<ScheduleService> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('schedule_services')
        .insert({
          ...service,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_services'] });
      toast({
        title: "Sistema/Serviço criado!",
        description: "O sistema/serviço foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateScheduleService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ScheduleServiceUpdate }): Promise<ScheduleService> => {
      const { data, error } = await supabase
        .from('schedule_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_services'] });
      toast({
        title: "Sistema/Serviço atualizado!",
        description: "O sistema/serviço foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteScheduleService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('schedule_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_services'] });
      toast({
        title: "Sistema/Serviço excluído!",
        description: "O sistema/serviço foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};