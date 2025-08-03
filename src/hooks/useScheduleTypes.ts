"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScheduleType {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type CreateScheduleTypeData = Omit<ScheduleType, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateScheduleTypeData = Partial<CreateScheduleTypeData>;

export const useScheduleTypes = () => {
  return useQuery({
    queryKey: ['schedule-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ScheduleType[];
    },
  });
};

export const useCreateScheduleType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduleTypeData) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: result, error } = await supabase
        .from('schedule_types')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-types'] });
      toast({
        title: "Tipo criado",
        description: "Tipo de agenda criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tipo",
        description: error.message || "Ocorreu um erro ao criar o tipo de agenda.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateScheduleType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateScheduleTypeData }) => {
      const { data, error } = await supabase
        .from('schedule_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-types'] });
      toast({
        title: "Tipo atualizado",
        description: "Tipo de agenda atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tipo",
        description: error.message || "Ocorreu um erro ao atualizar o tipo de agenda.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteScheduleType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativa o tipo
      const { error } = await supabase
        .from('schedule_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-types'] });
      toast({
        title: "Tipo removido",
        description: "Tipo de agenda removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover tipo",
        description: error.message || "Ocorreu um erro ao remover o tipo de agenda.",
        variant: "destructive",
      });
    },
  });
};