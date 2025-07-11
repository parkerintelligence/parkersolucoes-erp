import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HostingerVPS {
  id: string;
  name: string;
  hostname?: string;
  status: string;
  ipv4: string | { address: string }[];
  ipv6?: string | { address: string }[];
  region: string | { name: string };
  plan: string | { name: string };
  os: string | { name: string };
  cpu: number;
  cpus?: number;
  memory: number;
  disk: number;
  bandwidth?: number;
  created_at: string;
  snapshot_count?: number;
  // Dados reais da API quando disponíveis
  datacenter?: string;
  template?: string;
  // Métricas (simuladas quando não disponíveis na API)
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
      
      console.log('🔄 Buscando VPS para integração:', integrationId);
      
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: '/virtual-machines',
          method: 'GET'
        }
      });

      console.log('📡 Resposta completa do proxy:', { data, error });

      if (error) {
        console.error('❌ Erro detalhado:', {
          message: error.message,
          details: error,
          functionError: data
        });
        
        // Se há dados de erro da função, mostra eles também
        if (data && typeof data === 'object') {
          console.error('📄 Detalhes do erro da função:', data);
        }
        
        throw error;
      }
      
      const vpsList = data?.data || [];
      console.log('✅ VPS encontrados:', vpsList);
      
      // Enriquecer dados com informações processadas e mapeamento correto
      const enrichedVpsList = vpsList.map((vps: any) => ({
        ...vps,
        // Mapear os campos corretos da API do Hostinger
        status: vps.state || vps.status, // Hostinger usa 'state', não 'status'
        // Processar dados reais da API
        realData: {
          id: vps.id,
          hostname: vps.hostname || vps.name,
          status: vps.state || vps.status, // Mapear corretamente
          ipv4: vps.ipv4,
          ipv6: vps.ipv6,
          region: vps.region,
          plan: vps.plan,
          os: vps.template?.name || vps.os,
          cpus: vps.cpus || vps.cpu,
          memory: vps.memory,
          disk: vps.disk,
          datacenter: vps.datacenter,
          template: vps.template?.name,
          created_at: vps.created_at,
          last_updated: new Date().toISOString()
        }
      }));
      
      console.log('🔍 VPS enriquecidos:', enrichedVpsList);
      
      return enrichedVpsList;
    },
    enabled: !!integrationId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: 1, // Tentar apenas 1 vez para evitar spam de erros
  });
};

const useHostingerVPSDetails = (integrationId: string, vpsId: string) => {
  return useQuery({
    queryKey: ['hostinger-vps-details', integrationId, vpsId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/virtual-machines/${vpsId}`,
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
      console.log('📊 Buscando métricas para VPS:', vpsId);
      
      // Tentar buscar métricas reais primeiro
      let realMetrics = null;
      try {
        const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
          body: {
            integration_id: integrationId,
            endpoint: `/virtual-machines/${vpsId}/metrics`,
            method: 'GET'
          }
        });

        // Se obtivemos dados reais, usar eles
        if (!error && data?.data && typeof data.data === 'object' && data.data.cpu_usage !== undefined) {
          console.log('✅ Métricas reais encontradas:', data.data);
          realMetrics = {
            ...data.data,
            isReal: true,
            lastUpdated: new Date().toISOString()
          };
        }
      } catch (e) {
        console.log('⚠️ API de métricas não disponível:', e.message);
      }

      // Se temos métricas reais, retornar elas
      if (realMetrics) {
        return realMetrics;
      }

      // Fallback: gerar métricas simuladas realísticas
      console.log('🔄 Gerando métricas simuladas para VPS:', vpsId);
      const now = Date.now();
      const seed = parseInt(vpsId.replace(/\D/g, '')) || vpsId.charCodeAt(0) || 1;
      
      // Usar seed para gerar variações consistentes mas realísticas
      const timeVariation = Math.sin(now / 120000 + seed) * 0.3 + 0.5; // Variação temporal mais lenta
      const dailyPattern = Math.sin((now / 86400000) * 2 * Math.PI + seed) * 0.2 + 0.8; // Padrão diário
      const randomVariation = Math.sin(now / 45000 + seed * 3) * 0.15 + 0.85; // Variação menor
      
      const variation = timeVariation * dailyPattern * randomVariation;
      
      const simulatedMetrics = {
        // CPU: Varia entre 5% e 85%, com padrões realísticos
        cpu_usage: Math.max(5, Math.min(85, 
          (25 + variation * 35 + (Math.random() - 0.5) * 8)
        )),
        // Memória: Geralmente mais estável, entre 20% e 80%
        memory_usage: Math.max(20, Math.min(80, 
          (40 + variation * 25 + (Math.random() - 0.5) * 6)
        )),
        // Disco: Cresce lentamente ao longo do tempo, entre 15% e 75%
        disk_usage: Math.max(15, Math.min(75, 
          (30 + variation * 20 + (Math.random() - 0.5) * 5)
        )),
        // Rede: Picos ocasionais
        network_in: Math.random() * 800000 * (variation + 0.2), // bytes/s
        network_out: Math.random() * 400000 * (variation + 0.2), // bytes/s
        // Uptime: Entre 1 hora e 90 dias
        uptime: Math.floor(Math.random() * 7776000) + 3600,
        // Load average: Entre 0.1 e 3.0
        load_average: Math.max(0.1, Math.min(3.0, variation * 1.5 + Math.random() * 0.5)),
        // Processos: Entre 50 e 300
        processes: Math.floor(50 + variation * 150 + Math.random() * 50),
        // Marca como simulado
        isReal: false,
        simulated: true,
        lastUpdated: new Date().toISOString(),
        note: 'Dados simulados - API do Hostinger não fornece métricas em tempo real'
      };
      
      console.log('📈 Métricas simuladas geradas:', { vpsId, metrics: simulatedMetrics });
      return simulatedMetrics;
    },
    enabled: !!integrationId && !!vpsId,
    refetchInterval: 15000, // Atualizar a cada 15 segundos
    retry: 1,
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
          endpoint: `/virtual-machines/${vpsId}/restart`,
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
          endpoint: `/virtual-machines/${vpsId}/snapshots`,
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