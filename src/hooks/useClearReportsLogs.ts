
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClearReportsLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('🗑️ Limpando logs de execução...');
      
      const { error } = await supabase
        .from('scheduled_reports_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.error('❌ Erro ao limpar logs:', error);
        throw error;
      }
      
      console.log('✅ Logs limpos com sucesso');
    },
    onSuccess: () => {
      // Invalidate and refetch logs
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports-logs'] });
    },
  });
};
