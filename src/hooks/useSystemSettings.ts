
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SystemSetting {
  id: string;
  user_id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'text' | 'number' | 'boolean';
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export const useSystemSettings = (category?: string) => {
  return useQuery({
    queryKey: ['system-settings', category],
    queryFn: async () => {
      let query = supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }
      
      return data as SystemSetting[];
    },
  });
};

export const useSystemSetting = (settingKey: string, defaultValue?: string) => {
  return useQuery({
    queryKey: ['system-setting', settingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', settingKey)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configuração:', error);
        throw error;
      }
      
      // Se não encontrou a configuração e tem valor padrão, criar automaticamente
      if (!data && defaultValue !== undefined) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const newSetting = {
            user_id: userData.user.id,
            setting_key: settingKey,
            setting_value: defaultValue,
            setting_type: 'text' as const,
            category: 'general'
          };
          
          const { data: created, error: createError } = await supabase
            .from('system_settings')
            .insert(newSetting)
            .select()
            .single();
          
          if (createError) {
            console.error('Erro ao criar configuração padrão:', createError);
            return null;
          }
          
          return created as SystemSetting;
        }
      }
      
      return data as SystemSetting | null;
    },
  });
};

export const useCreateSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (setting: Omit<SystemSetting, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('system_settings')
        .insert({
          ...setting,
          user_id: userData.user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-setting'] });
      toast({
        title: "Configuração criada!",
        description: "A configuração foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SystemSetting> }) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-setting'] });
      toast({
        title: "Configuração atualizada!",
        description: "A configuração foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpsertSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (setting: Omit<SystemSetting, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          ...setting,
          user_id: userData.user.id,
        }, {
          onConflict: 'user_id,setting_key'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-setting'] });
      toast({
        title: "Configuração salva!",
        description: "A configuração foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-setting'] });
      toast({
        title: "Configuração removida!",
        description: "A configuração foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
