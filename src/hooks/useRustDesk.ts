import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RustDeskConnection {
  id: string;
  user_id: string;
  name: string;
  rustdesk_id: string;
  password?: string;
  alias?: string;
  company_id?: string;
  hostname?: string;
  os_type?: string;
  notes?: string;
  tags?: string[];
  is_online?: boolean;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export const useRustDeskConnections = () => {
  return useQuery({
    queryKey: ['rustdesk-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rustdesk_connections')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as RustDeskConnection[];
    },
  });
};

export const useCreateRustDeskConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection: Omit<RustDeskConnection, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('rustdesk_connections')
        .insert([{ ...connection, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rustdesk-connections'] });
      toast({ title: "Conexão salva!", description: "Conexão RustDesk salva com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateRustDeskConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RustDeskConnection> }) => {
      const { data, error } = await supabase
        .from('rustdesk_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rustdesk-connections'] });
      toast({ title: "Conexão atualizada!", description: "Conexão RustDesk atualizada." });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteRustDeskConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rustdesk_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rustdesk-connections'] });
      toast({ title: "Conexão removida!", description: "Conexão RustDesk removida." });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });
};
