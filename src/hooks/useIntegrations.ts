
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  type: 'chatwoot' | 'evolution_api' | 'wasabi' | 'grafana' | 'bomcontrole' | 'zabbix' | 'ftp' | 'glpi';
  name: string;
  base_url: string;
  api_token: string | null;
  webhook_url: string | null;
  phone_number: string | null;
  username: string | null;
  password: string | null;
  region: string | null;
  bucket_name: string | null;
  port: number | null;
  directory: string | null;
  passive_mode: boolean | null;
  use_ssl: boolean | null;
  keep_logged: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useIntegrations = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      console.log('Fetching integrations for user:', user.email);

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching integrations:', error);
        throw error;
      }

      console.log('Integrations fetched successfully:', data?.length || 0, 'integrations');
      return data as Integration[];
    },
  });

  const createIntegration = useMutation({
    mutationFn: async (integration: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      const integrationData = {
        type: integration.type,
        name: integration.name,
        base_url: integration.base_url,
        api_token: integration.api_token || null,
        webhook_url: integration.webhook_url || null,
        phone_number: integration.phone_number || null,
        username: integration.username || null,
        password: integration.password || null,
        region: integration.region || null,
        bucket_name: integration.bucket_name || null,
        port: integration.port || null,
        directory: integration.directory || null,
        passive_mode: integration.passive_mode || null,
        use_ssl: integration.use_ssl || null,
        keep_logged: integration.keep_logged || null,
        is_active: integration.is_active ?? true,
        user_id: user.id
      };

      console.log('Creating integration:', integrationData);

      const { data, error } = await supabase
        .from('integrations')
        .insert([integrationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating integration:', error);
        throw error;
      }

      console.log('Integration created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração criada!",
        description: "A integração foi configurada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating integration:', error);
      toast({
        title: "Erro ao criar integração",
        description: error.message || "Ocorreu um erro ao criar a integração. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Integration> }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      const updateData = {
        ...updates,
        api_token: updates.api_token === undefined ? null : updates.api_token,
        webhook_url: updates.webhook_url === undefined ? null : updates.webhook_url,
        phone_number: updates.phone_number === undefined ? null : updates.phone_number,
        username: updates.username === undefined ? null : updates.username,
        password: updates.password === undefined ? null : updates.password,
        region: updates.region === undefined ? null : updates.region,
        bucket_name: updates.bucket_name === undefined ? null : updates.bucket_name,
        port: updates.port === undefined ? null : updates.port,
        directory: updates.directory === undefined ? null : updates.directory,
        passive_mode: updates.passive_mode === undefined ? null : updates.passive_mode,
        use_ssl: updates.use_ssl === undefined ? null : updates.use_ssl,
        keep_logged: updates.keep_logged === undefined ? null : updates.keep_logged,
      };

      console.log('Updating integration:', id, updateData);

      const { data, error } = await supabase
        .from('integrations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating integration:', error);
        throw error;
      }

      console.log('Integration updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração atualizada!",
        description: "A integração foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating integration:', error);
      toast({
        title: "Erro ao atualizar integração",
        description: error.message || "Ocorreu um erro ao atualizar a integração.",
        variant: "destructive"
      });
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      console.log('Deleting integration:', id);

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting integration:', error);
        throw error;
      }

      console.log('Integration deleted successfully:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integração removida!",
        description: "A integração foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting integration:', error);
      toast({
        title: "Erro ao remover integração",
        description: error.message || "Ocorreu um erro ao remover a integração.",
        variant: "destructive"
      });
    },
  });

  return {
    ...query,
    createIntegration,
    updateIntegration,
    deleteIntegration,
  };
};
