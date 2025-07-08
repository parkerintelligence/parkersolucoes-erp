
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from './use-toast';

export interface UniFiDevice {
  _id: string;
  name: string;
  model: string;
  type: 'ugw' | 'usw' | 'uap' | 'udm' | 'uxg';
  state: number;
  uptime: number;
  num_sta: number;
  'sys-stats': {
    cpu: number;
    mem: number;
    'system-temp': number;
  };
  ip: string;
  mac: string;
  version: string;
  adopted: boolean;
  site_id: string;
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
  network: string;
  site_id: string;
  last_seen: number;
}

export interface UniFiSite {
  _id: string;
  desc: string;
  name: string;
  role: string;
  num_new_alarms: number;
}

export interface UniFiSystemInfo {
  version: string;
  uptime: number;
  hostname: string;
  timezone: string;
  update_available: boolean;
  update_downloaded: boolean;
}

export interface UniFiNetworkSettings {
  _id: string;
  name: string;
  purpose: string;
  enabled: boolean;
  vlan_enabled: boolean;
  vlan: number;
  dhcp_enabled: boolean;
  dhcp_start: string;
  dhcp_stop: string;
  dhcp_lease: number;
}

export interface UniFiPortForwarding {
  _id: string;
  name: string;
  enabled: boolean;
  src: string;
  dst_port: string;
  fwd_port: string;
  proto: string;
  log: boolean;
}

class UniFiService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private port: number;
  private cookies: string = '';

  constructor(integration: any) {
    this.baseUrl = integration.base_url.replace(/\/$/, '');
    this.username = integration.username;
    this.password = integration.password;
    this.port = integration.port || 8443;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any, siteId?: string): Promise<any> {
    try {
      const url = siteId ? 
        `${this.baseUrl}:${this.port}/api/s/${siteId}${endpoint}` : 
        `${this.baseUrl}:${this.port}/api${endpoint}`;

      const response = await fetch('/api/unifi-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method,
          data,
          credentials: {
            username: this.username,
            password: this.password,
            cookies: this.cookies
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Armazenar cookies para próximas requisições
      if (result.cookies) {
        this.cookies = result.cookies;
      }

      return result;
    } catch (error) {
      console.error('UniFi API Request failed:', error);
      throw error;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/login', 'POST', {
        username: this.username,
        password: this.password
      });
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getSites(): Promise<UniFiSite[]> {
    try {
      const response = await this.makeRequest('/self/sites');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get sites:', error);
      return [];
    }
  }

  async getDevices(siteId: string): Promise<UniFiDevice[]> {
    try {
      const response = await this.makeRequest('/stat/device', 'GET', null, siteId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  async getClients(siteId: string): Promise<UniFiClient[]> {
    try {
      const response = await this.makeRequest('/stat/sta', 'GET', null, siteId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to get clients:', error);
      return [];
    }
  }

  async getSystemInfo(siteId: string): Promise<UniFiSystemInfo | null> {
    try {
      const response = await this.makeRequest('/stat/sysinfo', 'GET', null, siteId);
      return response.data?.[0] || null;
    } catch (error) {
      console.error('Failed to get system info:', error);
      return null;
    }
  }

  async getNetworkSettings(siteId: string): Promise<UniFiNetworkSettings[]> {
    try {
      const response = await this.makeRequest('/rest/networkconf', 'GET', null, siteId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to get network settings:', error);
      return [];
    }
  }

  async getPortForwarding(siteId: string): Promise<UniFiPortForwarding[]> {
    try {
      const response = await this.makeRequest('/rest/portforward', 'GET', null, siteId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to get port forwarding rules:', error);
      return [];
    }
  }

  async restartDevice(siteId: string, deviceId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('/cmd/devmgr', 'POST', {
        cmd: 'restart',
        mac: deviceId
      }, siteId);
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to restart device:', error);
      return false;
    }
  }

  async blockClient(siteId: string, clientId: string, block: boolean): Promise<boolean> {
    try {
      const response = await this.makeRequest('/cmd/stamgr', 'POST', {
        cmd: block ? 'block-sta' : 'unblock-sta',
        mac: clientId
      }, siteId);
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to block/unblock client:', error);
      return false;
    }
  }

  async createNetwork(siteId: string, networkData: Partial<UniFiNetworkSettings>): Promise<boolean> {
    try {
      const response = await this.makeRequest('/rest/networkconf', 'POST', networkData, siteId);
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to create network:', error);
      return false;
    }
  }

  async updateNetwork(siteId: string, networkId: string, networkData: Partial<UniFiNetworkSettings>): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/rest/networkconf/${networkId}`, 'PUT', networkData, siteId);
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to update network:', error);
      return false;
    }
  }

  async deleteNetwork(siteId: string, networkId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/rest/networkconf/${networkId}`, 'DELETE', null, siteId);
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to delete network:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.authenticate();
    } catch (error) {
      console.error('UniFi connection test failed:', error);
      return false;
    }
  }
}

export const useUniFiAPI = (selectedSiteId?: string) => {
  const { data: integrations = [] } = useIntegrations();
  const queryClient = useQueryClient();
  
  const unifiIntegration = integrations.find(integration => 
    integration.type === 'unifi' && integration.is_active
  );

  const unifiService = unifiIntegration ? new UniFiService(unifiIntegration) : null;

  // Get sites
  const {
    data: sites = [],
    isLoading: sitesLoading,
    error: sitesError,
    refetch: refetchSites
  } = useQuery({
    queryKey: ['unifi', 'sites'],
    queryFn: () => unifiService?.getSites() || Promise.resolve([]),
    enabled: !!unifiService,
    staleTime: 300000, // 5 minutes
  });

  // Get devices for selected site
  const {
    data: devices = [],
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['unifi', 'devices', selectedSiteId],
    queryFn: () => selectedSiteId && unifiService ? unifiService.getDevices(selectedSiteId) : Promise.resolve([]),
    enabled: !!unifiService && !!selectedSiteId,
    staleTime: 30000, // 30 seconds
  });

  // Get clients for selected site
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients
  } = useQuery({
    queryKey: ['unifi', 'clients', selectedSiteId],
    queryFn: () => selectedSiteId && unifiService ? unifiService.getClients(selectedSiteId) : Promise.resolve([]),
    enabled: !!unifiService && !!selectedSiteId,
    staleTime: 15000, // 15 seconds
  });

  // Get system info for selected site
  const {
    data: systemInfo,
    isLoading: systemInfoLoading,
    refetch: refetchSystemInfo
  } = useQuery({
    queryKey: ['unifi', 'systemInfo', selectedSiteId],
    queryFn: () => selectedSiteId && unifiService ? unifiService.getSystemInfo(selectedSiteId) : Promise.resolve(null),
    enabled: !!unifiService && !!selectedSiteId,
    staleTime: 60000, // 1 minute
  });

  // Get network settings for selected site
  const {
    data: networkSettings = [],
    isLoading: networkSettingsLoading,
    refetch: refetchNetworkSettings
  } = useQuery({
    queryKey: ['unifi', 'networkSettings', selectedSiteId],
    queryFn: () => selectedSiteId && unifiService ? unifiService.getNetworkSettings(selectedSiteId) : Promise.resolve([]),
    enabled: !!unifiService && !!selectedSiteId,
    staleTime: 120000, // 2 minutes
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
        // Refresh sites after successful connection
        refetchSites();
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

  // Restart device
  const restartDeviceMutation = useMutation({
    mutationFn: ({ siteId, deviceId }: { siteId: string; deviceId: string }) => 
      unifiService?.restartDevice(siteId, deviceId) || Promise.resolve(false),
    onSuccess: (success, { deviceId }) => {
      if (success) {
        toast({
          title: "✅ Dispositivo reiniciado",
          description: `Dispositivo ${deviceId} foi reiniciado com sucesso.`
        });
        refetchDevices();
      } else {
        toast({
          title: "❌ Falha ao reiniciar",
          description: "Não foi possível reiniciar o dispositivo.",
          variant: "destructive"
        });
      }
    }
  });

  // Block/Unblock client
  const blockClientMutation = useMutation({
    mutationFn: ({ siteId, clientId, block }: { siteId: string; clientId: string; block: boolean }) => 
      unifiService?.blockClient(siteId, clientId, block) || Promise.resolve(false),
    onSuccess: (success, { clientId, block }) => {
      if (success) {
        toast({
          title: block ? "🚫 Cliente bloqueado" : "✅ Cliente desbloqueado",
          description: `Cliente ${clientId} foi ${block ? 'bloqueado' : 'desbloqueado'} com sucesso.`
        });
        refetchClients();
      } else {
        toast({
          title: "❌ Falha na operação",
          description: `Não foi possível ${block ? 'bloquear' : 'desbloquear'} o cliente.`,
          variant: "destructive"
        });
      }
    }
  });

  // Refresh all data for selected site
  const refreshAllData = async () => {
    if (!selectedSiteId) return;
    
    await Promise.all([
      refetchDevices(),
      refetchClients(),
      refetchSystemInfo(),
      refetchNetworkSettings()
    ]);
    
    toast({
      title: "✅ Dados atualizados",
      description: "Informações da controladora UniFi foram atualizadas."
    });
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  // Wrapper functions to match expected signatures
  const handleRestartDevice = (siteId: string, deviceId: string) => {
    restartDeviceMutation.mutate({ siteId, deviceId });
  };

  const handleBlockClient = (siteId: string, clientId: string, block: boolean) => {
    blockClientMutation.mutate({ siteId, clientId, block });
  };

  return {
    // Data
    sites,
    devices,
    clients,
    systemInfo,
    networkSettings,
    integration: unifiIntegration,
    
    // Loading states
    isLoading: sitesLoading || devicesLoading || clientsLoading || systemInfoLoading || networkSettingsLoading,
    sitesLoading,
    devicesLoading,
    clientsLoading,
    systemInfoLoading,
    networkSettingsLoading,
    
    // Errors
    sitesError,
    devicesError,
    clientsError,
    
    // Actions
    testConnection: handleTestConnection,
    testConnectionLoading: testConnectionMutation.isPending,
    restartDevice: handleRestartDevice,
    restartDeviceLoading: restartDeviceMutation.isPending,
    blockClient: handleBlockClient,
    blockClientLoading: blockClientMutation.isPending,
    refreshAllData,
    refetchSites,
    refetchDevices,
    refetchClients,
    refetchSystemInfo,
    refetchNetworkSettings,
    
    // Utils
    isConnected: !!unifiIntegration,
    connectionUrl: unifiIntegration?.base_url || '',
  };
};
