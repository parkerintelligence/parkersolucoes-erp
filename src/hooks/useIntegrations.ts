import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  type: string;
  name: string;
  base_url: string;
  api_token?: string;
  username?: string;
  password?: string;
  region?: string;
  bucket_name?: string;
  port?: number;
  directory?: string;
  passive_mode?: boolean;
  use_ssl?: boolean;
  keep_logged?: boolean;
  phone_number?: string;
  webhook_url?: string;
  instance_name?: string;
  is_active: boolean;
  is_global?: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
}

export const useIntegrations = () => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching integrations:', error);
        throw error;
      }

      return data as Integration[];
    },
  });
};

export const useCreateIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integration: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      console.log('🚀 [useCreateIntegration] Iniciando criação de integração global:', integration);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [useCreateIntegration] Usuário não autenticado');
        throw new Error('User not authenticated');
      }

      console.log('✅ [useCreateIntegration] Usuário autenticado:', user.id);

      // Integrações globais usam user_id do criador para RLS funcionar
      const globalIntegration = {
        ...integration,
        is_global: true,
        user_id: user.id
      };

      console.log('📝 [useCreateIntegration] Dados completos para inserção:', globalIntegration);

      const { data, error } = await supabase
        .from('integrations')
        .insert([globalIntegration])
        .select()
        .single();

      if (error) {
        console.error('❌ [useCreateIntegration] Erro na inserção no banco:', error);
        console.error('❌ [useCreateIntegration] Código do erro:', error.code);
        console.error('❌ [useCreateIntegration] Detalhes do erro:', error.details);
        console.error('❌ [useCreateIntegration] Hint do erro:', error.hint);
        throw error;
      }

      console.log('✅ [useCreateIntegration] Integração global criada com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 [useCreateIntegration] Sucesso na criação, invalidando cache...');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error) => {
      console.error('💥 [useCreateIntegration] Erro final no hook:', error);
    },
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Integration> }) => {
      console.log('🚀 [useUpdateIntegration] Iniciando atualização:', { id, updates });
      
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ [useUpdateIntegration] Erro na atualização:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        // Try with maybeSingle - RLS might be blocking, try upsert approach
        console.warn('⚠️ [useUpdateIntegration] Update retornou 0 rows, tentando sem filtro de user_id...');
        
        // Check if it's a global integration (user_id is null)
        const { data: existing } = await supabase
          .from('integrations')
          .select('id, user_id, is_global')
          .eq('id', id)
          .maybeSingle();
        
        if (existing) {
          // Integration exists but update failed - likely RLS issue
          // Try updating without is_global in the payload
          const { user_id, ...cleanUpdates } = updates as any;
          const { data: retryData, error: retryError } = await supabase
            .from('integrations')
            .update(cleanUpdates)
            .eq('id', id)
            .select();
          
          if (retryError) throw retryError;
          if (retryData && retryData.length > 0) return retryData[0];
        }
        
        throw new Error('Não foi possível atualizar a integração. Verifique suas permissões.');
      }

      console.log('✅ [useUpdateIntegration] Integração atualizada com sucesso:', data[0]);
      return data[0];
    },
    onSuccess: () => {
      console.log('🎉 [useUpdateIntegration] Sucesso na atualização, invalidando cache...');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração atualizada!",
        description: "A integração foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('💥 [useUpdateIntegration] Erro final no hook:', error);
      toast({
        title: "Erro ao atualizar integração",
        description: "Ocorreu um erro ao atualizar a integração.",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting integration:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração excluída!",
        description: "A integração foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting integration:', error);
      toast({
        title: "Erro ao excluir integração",
        description: "Ocorreu um erro ao excluir a integração.",
        variant: "destructive"
      });
    },
  });
};
