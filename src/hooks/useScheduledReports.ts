
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  report_type: string; // Changed from union type to string to match database
  phone_number: string;
  cron_expression: string;
  is_active: boolean;
  last_execution?: string;
  next_execution?: string;
  execution_count: number;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export const useScheduledReports = () => {
  return useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar relatórios agendados:', error);
        throw error;
      }
      
      return data as ScheduledReport[];
    },
  });
};

export const useCreateScheduledReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: Omit<ScheduledReport, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_execution' | 'next_execution'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          ...report,
          user_id: userData.user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Agendamento criado!",
        description: "Relatório agendado com sucesso.",
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

export const useUpdateScheduledReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduledReport> }) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Agendamento atualizado!",
        description: "Relatório atualizado com sucesso.",
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

export const useDeleteScheduledReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Agendamento removido!",
        description: "Relatório removido com sucesso.",
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

export const useToggleScheduledReportActive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: !is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useTestScheduledReport = () => {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase.functions.invoke('send-scheduled-report', {
        body: { report_id: reportId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Teste enviado!",
        description: "Relatório de teste enviado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
