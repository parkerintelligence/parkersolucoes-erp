import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClientSafe } from './useQueryClientSafe';

export interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  report_type: string; // Agora é sempre um ID do template
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
  const { isReady, error: contextError } = useQueryClientSafe();

  return useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      console.log('Buscando relatórios agendados...');
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar relatórios agendados:', error);
        throw error;
      }
      
      console.log('Relatórios encontrados:', data?.length || 0);
      return data as ScheduledReport[];
    },
    enabled: isReady && !contextError,
    retry: 3,
    staleTime: 30000,
  });
};

export const useCreateScheduledReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: Omit<ScheduledReport, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_execution' | 'next_execution'>) => {
      console.log('Criando novo relatório agendado:', report);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o template existe e está ativo
      const { data: template, error: templateError } = await supabase
        .from('whatsapp_message_templates')
        .select('id, name, is_active')
        .eq('id', report.report_type)
        .eq('user_id', userData.user.id)
        .single();

      if (templateError || !template) {
        throw new Error('Template não encontrado ou não pertence ao usuário');
      }

      if (!template.is_active) {
        throw new Error('Template está inativo e não pode ser usado');
      }

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          ...report,
          user_id: userData.user.id,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar relatório:', error);
        throw error;
      }
      
      console.log('Relatório criado com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Agendamento criado!",
        description: "Relatório agendado com sucesso.",
      });
      console.log('Relatório criado e cache invalidado');
    },
    onError: (error: any) => {
      console.error('Erro na criação do relatório:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateScheduledReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduledReport> }) => {
      console.log('Atualizando relatório:', id, updates);
      
      // Se está atualizando o template, verificar se existe e está ativo
      if (updates.report_type) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('Usuário não autenticado');
        }

        const { data: template, error: templateError } = await supabase
          .from('whatsapp_message_templates')
          .select('id, name, is_active')
          .eq('id', updates.report_type)
          .eq('user_id', userData.user.id)
          .single();

        if (templateError || !template) {
          throw new Error('Template não encontrado ou não pertence ao usuário');
        }

        if (!template.is_active) {
          throw new Error('Template está inativo e não pode ser usado');
        }
      }
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar relatório:', error);
        throw error;
      }
      
      console.log('Relatório atualizado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Agendamento atualizado!",
        description: "Relatório atualizado com sucesso.",
      });
      console.log('Relatório atualizado e cache invalidado');
    },
    onError: (error: any) => {
      console.error('Erro na atualização do relatório:', error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteScheduledReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Excluindo relatório:', id);
      
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir relatório:', error);
        throw error;
      }
      
      console.log('Relatório excluído com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Agendamento removido!",
        description: "Relatório removido com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir relatório:', error);
      toast({
        title: "Erro ao remover agendamento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useToggleScheduledReportActive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      console.log('Alterando status do relatório:', id, 'para:', !is_active);
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: !is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao alterar status:', error);
        throw error;
      }
      
      console.log('Status alterado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error: any) => {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useTestScheduledReport = () => {
  return useMutation({
    mutationFn: async (reportId: string) => {
      console.log('Executando teste do relatório:', reportId);
      
      const { data, error } = await supabase.functions.invoke('send-scheduled-report', {
        body: { report_id: reportId }
      });
      
      if (error) {
        console.error('Erro no teste do relatório:', error);
        throw error;
      }
      
      console.log('Teste executado com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Resultado do teste:', data);
      if (data?.success) {
        toast({
          title: "Teste enviado!",
          description: `Relatório enviado com sucesso. Próxima execução: ${data.next_execution ? new Date(data.next_execution).toLocaleString('pt-BR') : 'N/A'}`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao executar o teste do relatório.",
        variant: "destructive",
      });
    },
  });
};
