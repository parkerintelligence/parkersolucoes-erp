import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { useHttpTunnel } from './useHttpTunnel';
import { toast } from '@/hooks/use-toast';

interface MikrotikInterface {
  id: string;
  name: string;
  type: string;
  running: boolean;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
}

interface MikrotikResource {
  cpu_load: number;
  free_memory: number;
  total_memory: number;
  uptime: string;
  version: string;
  board_name: string;
}

export const useMikrotikTunnel = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  const httpTunnel = useHttpTunnel({
    retryAttempts: 2,
    retryDelay: 1500,
    timeout: 10000,
    fallbackStrategies: ['direct', 'proxy', 'edge-function']
  });
  
  const mikrotikIntegration = integrations?.find(integration => 
    integration.type === 'mikrotik' as any && integration.is_active
  );

  const buildMikrotikUrl = (endpoint: string) => {
    if (!mikrotikIntegration) return '';
    
    let baseUrl = mikrotikIntegration.base_url.replace(/\/$/, '');
    if (!baseUrl.startsWith('http')) {
      baseUrl = 'http://' + baseUrl;
    }
    
    return `${baseUrl}/rest${endpoint}`;
  };

  const makeAuthenticatedRequest = async (endpoint: string) => {
    if (!mikrotikIntegration) {
      throw new Error('Integração Mikrotik não encontrada');
    }

    const url = buildMikrotikUrl(endpoint);
    const auth = btoa(`${mikrotikIntegration.username}:${mikrotikIntegration.password}`);
    
    console.log('[Mikrotik Tunnel] Fazendo requisição para:', url);
    
    const response = await httpTunnel.get(url, {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'User-Agent': 'Mikrotik-HTTP-Tunnel/1.0'
    });

    if (!response.success) {
      throw new Error(response.error || 'Erro na comunicação com Mikrotik');
    }

    console.log(`[Mikrotik Tunnel] Sucesso via ${response.strategy}, tentativas: ${response.attempts}`);
    return response.data;
  };

  const testConnection = useMutation({
    mutationFn: async () => {
      console.log('[Mikrotik Tunnel] Testando conexão...');
      return await makeAuthenticatedRequest('/system/identity');
    },
    onSuccess: (data) => {
      console.log('[Mikrotik Tunnel] Teste de conexão bem-sucedido:', data);
      toast({
        title: "Conexão Mikrotik Estabelecida!",
        description: `Conectado via HTTP Tunnel com sucesso.`,
      });
    },
    onError: (error: Error) => {
      console.error('[Mikrotik Tunnel] Erro no teste:', error);
      toast({
        title: "Erro de Conexão Mikrotik",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const interfacesQuery = useQuery({
    queryKey: ['mikrotik-tunnel-interfaces'],
    queryFn: async () => {
      if (!mikrotikIntegration) {
        throw new Error('Mikrotik não configurado');
      }

      console.log('[Mikrotik Tunnel] Buscando interfaces...');
      const data = await makeAuthenticatedRequest('/interface');
      
      // Transformar dados para formato esperado
      const interfaces: MikrotikInterface[] = Array.isArray(data) ? data.map((item: any) => ({
        id: item['.id'] || item.name || 'unknown',
        name: item.name || 'Unnamed Interface',
        type: item.type || 'unknown',
        running: item.running === 'true' || item.running === true,
        rx_bytes: parseInt(item['rx-byte'] || '0'),
        tx_bytes: parseInt(item['tx-byte'] || '0'),
        rx_packets: parseInt(item['rx-packet'] || '0'),
        tx_packets: parseInt(item['tx-packet'] || '0')
      })) : [];
      
      console.log(`[Mikrotik Tunnel] Interfaces carregadas: ${interfaces.length}`);
      return interfaces;
    },
    enabled: !!mikrotikIntegration && httpTunnel.isWorkerReady,
    refetchInterval: 30000,
    retry: 2,
    staleTime: 10000,
  });

  const resourcesQuery = useQuery({
    queryKey: ['mikrotik-tunnel-resources'],
    queryFn: async () => {
      if (!mikrotikIntegration) {
        throw new Error('Mikrotik não configurado');
      }

      console.log('[Mikrotik Tunnel] Buscando recursos do sistema...');
      const data = await makeAuthenticatedRequest('/system/resource');
      
      // Transformar dados para formato esperado
      const resource: MikrotikResource = Array.isArray(data) && data.length > 0 ? {
        cpu_load: parseFloat(data[0]['cpu-load'] || '0'),
        free_memory: parseInt(data[0]['free-memory'] || '0'),
        total_memory: parseInt(data[0]['total-memory'] || '0'),
        uptime: data[0].uptime || '0s',
        version: data[0].version || 'Unknown',
        board_name: data[0]['board-name'] || 'Unknown Board'
      } : {
        cpu_load: 0,
        free_memory: 0,
        total_memory: 0,
        uptime: '0s',
        version: 'Unknown',
        board_name: 'Unknown Board'
      };
      
      console.log('[Mikrotik Tunnel] Recursos carregados:', resource);
      return resource;
    },
    enabled: !!mikrotikIntegration && httpTunnel.isWorkerReady,
    refetchInterval: 15000,
    retry: 2,
    staleTime: 5000,
  });

  const refetchAll = () => {
    console.log('[Mikrotik Tunnel] Recarregando todos os dados...');
    queryClient.invalidateQueries({ queryKey: ['mikrotik-tunnel-interfaces'] });
    queryClient.invalidateQueries({ queryKey: ['mikrotik-tunnel-resources'] });
  };

  return {
    isConfigured: !!mikrotikIntegration,
    isWorkerReady: httpTunnel.isWorkerReady,
    interfaces: interfacesQuery.data || [],
    resources: resourcesQuery.data,
    isLoading: interfacesQuery.isLoading || resourcesQuery.isLoading,
    error: interfacesQuery.error || resourcesQuery.error,
    testConnection,
    refetchAll,
  };
};