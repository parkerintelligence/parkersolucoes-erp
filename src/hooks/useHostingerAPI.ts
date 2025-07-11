import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HostingerVPS {
  id: string;
  name: string;
  status: string;
  ipv4: string;
  ipv6?: string;
  region: string;
  plan: string;
  os: string;
  cpu: number;
  memory: number;
  disk: number;
  bandwidth: number;
  created_at: string;
  snapshot_count?: number;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_in?: number;
  network_out?: number;
}

export interface HostingerSnapshot {
  id: string;
  name: string;
  vps_id: string;
  size: number;
  created_at: string;
  status: string;
}

const useHostingerIntegrations = () => {
  return useQuery({
    queryKey: ['integrations', 'hostinger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'hostinger')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });
};

const useHostingerVPS = (integrationId?: string) => {
  return useQuery({
    queryKey: ['hostinger-vps', integrationId],
    queryFn: async () => {
      if (!integrationId) return [];
      
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: '/vps',
          method: 'GET'
        }
      });

      if (error) throw error;
      return data?.data || [];
    },
    enabled: !!integrationId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};

const useHostingerVPSDetails = (integrationId: string, vpsId: string) => {
  return useQuery({
    queryKey: ['hostinger-vps-details', integrationId, vpsId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/vps/${vpsId}`,
          method: 'GET'
        }
      });

      if (error) throw error;
      return data?.data;
    },
    enabled: !!integrationId && !!vpsId,
    refetchInterval: 15000, // Atualizar a cada 15 segundos para dados detalhados
  });
};

const useHostingerVPSMetrics = (integrationId: string, vpsId: string) => {
  return useQuery({
    queryKey: ['hostinger-vps-metrics', integrationId, vpsId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/vps/${vpsId}/metrics`,
          method: 'GET'
        }
      });

      if (error) throw error;
      return data?.data;
    },
    enabled: !!integrationId && !!vpsId,
    refetchInterval: 10000, // Atualizar a cada 10 segundos para métricas
  });
};

const useHostingerActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const restartVPS = useMutation({
    mutationFn: async ({ integrationId, vpsId }: { integrationId: string; vpsId: string }) => {
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/vps/${vpsId}/restart`,
          method: 'POST'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "VPS reiniciado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['hostinger-vps'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao reiniciar VPS",
        variant: "destructive",
      });
    },
  });

  const createSnapshot = useMutation({
    mutationFn: async ({ 
      integrationId, 
      vpsId, 
      name 
    }: { 
      integrationId: string; 
      vpsId: string; 
      name?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/vps/${vpsId}/snapshots`,
          method: 'POST',
          data: {
            name: name || `Snapshot ${new Date().toLocaleString()}`
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Snapshot criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['hostinger-vps'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar snapshot",
        variant: "destructive",
      });
    },
  });

  return {
    restartVPS,
    createSnapshot,
  };
};

export {
  useHostingerIntegrations,
  useHostingerVPS,
  useHostingerVPSDetails,
  useHostingerVPSMetrics,
  useHostingerActions,
};