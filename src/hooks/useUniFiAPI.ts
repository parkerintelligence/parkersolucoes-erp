
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from './use-toast';

export interface UniFiDevice {
  _id: string;
  name: string;
  model: string;
  type: 'ugw' | 'usw' | 'uap' | 'udm';
  state: number;
  uptime: number;
  num_sta: number;
  'sys-stats': {
    cpu: number;
    mem: number;
    'system-temp': number;
  };
}

export interface UniFiClient {
  _id: string;
  hostname?: string;
  mac: string;
  ip: string;
  is_wired: boolean;
  ap_mac?: string;
  signal?: number;
  uptime: number;
  rx_bytes: number;
  tx_bytes: number;
}

export interface UniFiSite {
  _id: string;
  desc: string;
  name: string;
}

class UniFiService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private port: number;

  constructor(integration: any) {
    this.baseUrl = integration.base_url.replace(/\/$/, '');
    this.username = integration.username;
    this.password = integration.password;
    this.port = integration.port || 8443;
  }

  async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    // Simulação da API UniFi - em produção, isso seria feito através de uma Edge Function
    // devido às limitações de CORS e certificados SSL da controladora UniFi
    
    // Por enquanto, retornamos dados simulados baseados na configuração
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula latência de rede
    
    console.log(`UniFi API Call: ${method} ${endpoint}`, { baseUrl: this.baseUrl, data });
    
    // Simular resposta baseada no endpoint
    if (endpoint.includes('/stat/device')) {
      return this.getMockDevices();
    } else if (endpoint.includes('/stat/sta')) {
      return this.getMockClients();
    } else if (endpoint.includes('/stat/sysinfo')) {
      return this.getMockSystemInfo();
    }
    
    return { data: [] };
  }

  private getMockDevices(): { data: UniFiDevice[] } {
    return {
      data: [
        {
          _id: '1',
          name: 'UniFi Dream Machine',
          model: 'UDM-Pro',
          type: 'udm',
          state: 1,
          uptime: 1354287,
          num_sta: 24,
          'sys-stats': {
            cpu: 12,
            mem: 45,
            'system-temp': 42
          }
        },
        {
          _id: '2',
          name: 'Access Point Sala',
          model: 'U6-Lite',
          type: 'uap',
          state: 1,
          uptime: 1045321,
          num_sta: 8,
          'sys-stats': {
            cpu: 5,
            mem: 32,
            'system-temp': 38
          }
        },
        {
          _id: '3',
          name: 'Switch Escritório',
          model: 'USW-24-POE',
          type: 'usw',
          state: 1,
          uptime: 1745892,
          num_sta: 16,
          'sys-stats': {
            cpu: 8,
            mem: 28,
            'system-temp': 35
          }
        }
      ]
    };
  }

  private getMockClients(): { data: UniFiClient[] } {
    return {
      data: [
        {
          _id: '1',
          hostname: 'iPhone-John',
          mac: '00:11:22:33:44:55',
          ip: '192.168.1.100',
          is_wired: false,
          ap_mac: '00:aa:bb:cc:dd:ee',
          signal: -45,
          uptime: 9032,
          rx_bytes: 157286400,
          tx_bytes: 93355520
        },
        {
          _id: '2',
          hostname: 'Laptop-Office',
          mac: 'AA:BB:CC:DD:EE:FF',
          ip: '192.168.1.101',
          is_wired: true,
          uptime: 29847,
          rx_bytes: 2254857600,
          tx_bytes: 1932735488
        }
      ]
    };
  }

  private getMockSystemInfo() {
    return {
      data: [{
        version: '7.5.176',
        uptime: 1354287,
        hostname: this.baseUrl.replace(/^https?:\/\//, '').split(':')[0],
        timezone: 'America/Sao_Paulo'
      }]
    };
  }

  async getDevices(): Promise<UniFiDevice[]> {
    const response = await this.makeRequest('/stat/device');
    return response.data;
  }

  async getClients(): Promise<UniFiClient[]> {
    const response = await this.makeRequest('/stat/sta');
    return response.data;
  }

  async getSystemInfo() {
    const response = await this.makeRequest('/stat/sysinfo');
    return response.data[0];
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/stat/sysinfo');
      return true;
    } catch (error) {
      console.error('UniFi connection test failed:', error);
      return false;
    }
  }
}

export const useUniFiAPI = () => {
  const { data: integrations = [] } = useIntegrations();
  const queryClient = useQueryClient();
  
  const unifiIntegration = integrations.find(integration => 
    integration.type === 'unifi' && integration.is_active
  );

  const unifiService = unifiIntegration ? new UniFiService(unifiIntegration) : null;

  // Get devices
  const {
    data: devices = [],
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['unifi', 'devices'],
    queryFn: () => unifiService?.getDevices() || Promise.resolve([]),
    enabled: !!unifiService,
    staleTime: 30000, // 30 seconds
  });

  // Get clients
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients
  } = useQuery({
    queryKey: ['unifi', 'clients'],
    queryFn: () => unifiService?.getClients() || Promise.resolve([]),
    enabled: !!unifiService,
    staleTime: 15000, // 15 seconds
  });

  // Get system info
  const {
    data: systemInfo,
    isLoading: systemInfoLoading,
    refetch: refetchSystemInfo
  } = useQuery({
    queryKey: ['unifi', 'systemInfo'],
    queryFn: () => unifiService?.getSystemInfo() || Promise.resolve(null),
    enabled: !!unifiService,
    staleTime: 60000, // 1 minute
  });

  // Test connection
  const testConnectionMutation = useMutation({
    mutationFn: () => unifiService?.testConnection() || Promise.resolve(false),
    onSuccess: (isConnected) => {
      if (isConnected) {
        toast({
          title: "✅ Conexão bem-sucedida",
          description: "Conectado à controladora UniFi com sucesso."
        });
      } else {
        toast({
          title: "❌ Falha na conexão",
          description: "Não foi possível conectar à controladora UniFi.",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "❌ Erro de conexão",
        description: "Erro ao tentar conectar à controladora UniFi.",
        variant: "destructive"
      });
    }
  });

  // Refresh all data
  const refreshAllData = async () => {
    await Promise.all([
      refetchDevices(),
      refetchClients(),
      refetchSystemInfo()
    ]);
    
    toast({
      title: "✅ Dados atualizados",
      description: "Informações da controladora UniFi foram atualizadas."
    });
  };

  return {
    // Data
    devices,
    clients,
    systemInfo,
    integration: unifiIntegration,
    
    // Loading states
    isLoading: devicesLoading || clientsLoading || systemInfoLoading,
    devicesLoading,
    clientsLoading,
    systemInfoLoading,
    
    // Errors
    devicesError,
    clientsError,
    
    // Actions
    testConnection: testConnectionMutation.mutate,
    testConnectionLoading: testConnectionMutation.isPending,
    refreshAllData,
    refetchDevices,
    refetchClients,
    refetchSystemInfo,
    
    // Utils
    isConnected: !!unifiIntegration,
    connectionUrl: unifiIntegration?.base_url || '',
  };
};
