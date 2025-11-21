import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HostingerSnapshotSchedule {
  id: string;
  user_id: string;
  integration_id: string;
  vps_id: string;
  vps_name: string;
  name: string;
  description?: string;
  cron_expression: string;
  is_active: boolean;
  retention_days: number;
  next_execution?: string;
  last_execution?: string;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

// Hook para listar agendamentos
export const useSnapshotSchedules = (integrationId?: string) => {
  return useQuery({
    queryKey: ['hostinger-snapshot-schedules', integrationId],
    queryFn: async () => {
      let query = supabase
        .from('hostinger_snapshot_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as HostingerSnapshotSchedule[];
    },
    enabled: !!integrationId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};

// Hook para criar agendamento
export const useCreateSnapshotSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (schedule: Omit<HostingerSnapshotSchedule, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'execution_count'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('hostinger_snapshot_schedules')
        .insert([{
          user_id: user.id,
          integration_id: schedule.integration_id,
          vps_id: schedule.vps_id,
          vps_name: schedule.vps_name,
          name: schedule.name,
          description: schedule.description,
          cron_expression: schedule.cron_expression,
          is_active: schedule.is_active,
          retention_days: schedule.retention_days,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Agendamento Criado",
        description: "O snapshot foi agendado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['hostinger-snapshot-schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Criar Agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para atualizar agendamento
export const useUpdateSnapshotSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HostingerSnapshotSchedule> }) => {
      const { data, error } = await supabase
        .from('hostinger_snapshot_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Agendamento Atualizado",
        description: "O agendamento foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['hostinger-snapshot-schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para deletar agendamento
export const useDeleteSnapshotSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hostinger_snapshot_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Agendamento Excluído",
        description: "O agendamento foi excluído com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['hostinger-snapshot-schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
