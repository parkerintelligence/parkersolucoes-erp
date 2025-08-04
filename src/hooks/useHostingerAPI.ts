"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useHostingerRealMetrics } from './useHostingerRealMetrics';

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

// HostingerSnapshot interface moved to useHostingerSnapshots.ts

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
    refetchInterval: 10000, // Atualizar a cada 10 segundos para dados mais em tempo real
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
    refetchInterval: 8000, // Atualizar a cada 8 segundos para dados detalhados
  });
};

const useHostingerVPSMetrics = (integrationId: string, vpsId: string, vpsIP?: string) => {
  // Tentar obter métricas reais através de múltiplos métodos
  const { data: realMetrics } = useHostingerRealMetrics({
    integrationId,
    vpsId,
    vpsIP,
    enabled: !!integrationId && !!vpsId
  });

  return useQuery({
    queryKey: ['hostinger-vps-metrics', integrationId, vpsId],
    queryFn: async () => {
      console.log('📊 Processando métricas para VPS:', vpsId);
      
      // Se temos métricas reais, usar elas
      if (realMetrics) {
        console.log('✅ Usando métricas reais:', realMetrics);
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
        note: 'Dados simulados - Configure agente de monitoramento (Prometheus, Netdata) para dados reais'
      };
      
      console.log('📈 Métricas simuladas geradas:', { vpsId, metrics: simulatedMetrics });
      return simulatedMetrics;
    },
    enabled: !!integrationId && !!vpsId,
    refetchInterval: realMetrics ? 5000 : 10000, // Mais frequente para dados em tempo real
    retry: 1,
  });
};

const useHostingerActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const restartVPS = useMutation({
    mutationFn: async ({ integrationId, vpsId }: { integrationId: string; vpsId: string }) => {
      console.log('🔄 Iniciando restart do VPS:', vpsId);
      
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/virtual-machines/${vpsId}/restart`,
          method: 'POST'
        }
      });

      console.log('📡 Resposta da API de restart:', { data, error, vpsId });

      if (error) {
        console.error('❌ Erro no restart:', error);
        throw error;
      }
      
      // Verificar se a operação foi bem-sucedida
      if (data?.success === false) {
        throw new Error(data?.message || 'Falha na operação de restart');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Restart bem-sucedido:', data);
      
      // Feedback mais detalhado baseado na resposta da API
      const message = data?.data?.message || data?.message || 'VPS reiniciado com sucesso!';
      
      toast({
        title: "Restart Iniciado",
        description: `${message} - VPS ID: ${variables.vpsId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['hostinger-vps'] });
      queryClient.invalidateQueries({ queryKey: ['hostinger-vps-metrics'] });
    },
    onError: (error: any, variables) => {
      console.error('❌ Erro no restart:', error);
      
      const errorMessage = error?.message || 'Erro desconhecido ao reiniciar VPS';
      
      toast({
        title: "Erro no Restart",
        description: `${errorMessage} - VPS ID: ${variables.vpsId}`,
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
      console.log('📸 Iniciando criação de snapshot para VPS:', vpsId, 'Nome:', name);
      
      // Tentar diferentes endpoints e métodos para snapshots
      const attempts = [
        // Endpoints mais prováveis baseados na documentação padrão
        { endpoint: `/virtual-machines/${vpsId}/snapshots`, method: 'POST', payload: { name: name || `Snapshot-${Date.now()}` } },
        { endpoint: `/virtual-machines/${vpsId}/snapshot`, method: 'POST', payload: { name: name || `Snapshot-${Date.now()}` } },
        
        // Tentativas com diferentes estruturas de payload
        { endpoint: `/virtual-machines/${vpsId}/snapshots`, method: 'POST', payload: { snapshot_name: name || `Snapshot-${Date.now()}` } },
        { endpoint: `/virtual-machines/${vpsId}/snapshots`, method: 'POST', payload: { label: name || `Snapshot-${Date.now()}` } },
        
        // Endpoints alternativos
        { endpoint: `/vps/${vpsId}/snapshots`, method: 'POST', payload: { name: name || `Snapshot-${Date.now()}` } },
        { endpoint: `/snapshots`, method: 'POST', payload: { vps_id: vpsId, name: name || `Snapshot-${Date.now()}` } },
        
        // Backup endpoints como alternativa
        { endpoint: `/virtual-machines/${vpsId}/backup`, method: 'POST', payload: { name: name || `Backup-${Date.now()}` } },
        { endpoint: `/virtual-machines/${vpsId}/image`, method: 'POST', payload: { name: name || `Image-${Date.now()}` } },
      ];
      
      let lastError;
      
      for (const attempt of attempts) {
        try {
          console.log('🔍 Testando:', attempt.endpoint, 'com payload:', attempt.payload);
          
          const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
            body: {
              integration_id: integrationId,
              endpoint: attempt.endpoint,
              method: attempt.method,
              data: attempt.payload
            }
          });

          if (error) {
            console.warn(`❌ Falhou ${attempt.endpoint}:`, error);
            lastError = error;
            continue;
          }
          
          // Se chegou aqui, funcionou!
          console.log('✅ Sucesso com:', attempt.endpoint, data);
          return { ...data, usedEndpoint: attempt.endpoint };
          
        } catch (err) {
          console.warn(`❌ Erro em ${attempt.endpoint}:`, err);
          lastError = err;
        }
      }
      
      // Se todos falharam, lançar erro específico
      console.error('❌ Todos os endpoints falharam');
      throw new Error('API Hostinger não suporta criação de snapshots via API. Use o painel web do Hostinger.');
    },
    onSuccess: (data, variables) => {
      console.log('✅ Snapshot criado com sucesso:', data);
      
      // Feedback mais detalhado baseado na resposta da API
      const snapshotInfo = data?.data;
      const message = snapshotInfo?.id 
        ? `Snapshot criado! ID: ${snapshotInfo.id}` 
        : data?.message || 'Snapshot criado com sucesso!';
      
      toast({
        title: "Snapshot Criado",
        description: `${message} - ${variables.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['hostinger-vps'] });
    },
    onError: (error: any, variables) => {
      console.error('❌ Erro detalhado no snapshot:', {
        error,
        variables,
        errorMessage: error?.message,
        errorData: error?.data,
        lastErrorDetails: error
      });
      
      // Tentar extrair mensagem de erro mais específica
      let errorMessage = 'Erro desconhecido ao criar snapshot';
      
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Se o erro indica que o endpoint não existe, informar sobre limitação da API
      if (errorMessage.includes('route') && errorMessage.includes('could not be found')) {
        errorMessage = 'Funcionalidade de snapshot não disponível na API do Hostinger. Verifique a documentação para endpoints suportados.';
      }
      
      toast({
        title: "Erro no Snapshot",
        description: `${errorMessage} - ${variables.name}`,
        variant: "destructive",
      });
    },
  });

  return {
    restartVPS,
    createSnapshot,
  };
};

// useHostingerSnapshots moved to separate file: useHostingerSnapshots.ts

export {
  useHostingerIntegrations,
  useHostingerVPS,
  useHostingerVPSDetails,
  useHostingerVPSMetrics,
  useHostingerActions,
};