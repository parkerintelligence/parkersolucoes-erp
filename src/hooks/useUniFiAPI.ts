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
  led_override?: string;
  power_override?: string;
  alias?: string;
  radio_table?: Array<{
    name: string;
    radio: string;
    channel: number;
    tx_power: number;
    util: number;
  }>;
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
  name?: string;
  alias?: string;
  blocked?: boolean;
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

export interface UniFiNetwork {
  _id: string;
  name: string;
  x_password?: string;
  security: string;
  enabled: boolean;
  is_guest: boolean;
  usergroup_id?: string;
  wpa_mode?: string;
  wpa_enc?: string;
  vlan_enabled?: boolean;
  vlan?: number;
  site_id: string;
}

export interface UniFiHealthMetrics {
  subsystem: string;
  status: string;
  num_user: number;
  num_guest: number;
  num_iot: number;
  tx_bytes: number;
  rx_bytes: number;
  num_ap: number;
  num_adopted: number;
  num_disabled: number;
  num_disconnected: number;
  num_pending: number;
  num_gw: number;
  num_sw: number;
  wan_ip: string;
  uptime: number;
}

export interface UniFiEvent {
  _id: string;
  datetime: string;
  msg: string;
  key: string;
  subsystem: string;
  site_id: string;
  is_negative: boolean;
}

export interface UniFiAuth {
  cookies: string;
  timestamp: number;
}

class UniFiControllerService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private auth: UniFiAuth | null = null;

  constructor(integration: any) {
    this.baseUrl = integration.base_url.replace(/\/$/, '');
    this.username = integration.username;
    this.password = integration.password;
    
    const savedAuth = localStorage.getItem('unifi_controller_auth');
    if (savedAuth) {
      try {
        this.auth = JSON.parse(savedAuth);
        if (this.auth && Date.now() - this.auth.timestamp > 12 * 60 * 60 * 1000) {
          console.log('Saved auth expired, clearing auth')
          this.auth = null;
          localStorage.removeItem('unifi_controller_auth');
        }
      } catch (error) {
        console.error('Failed to parse saved auth:', error);
        localStorage.removeItem('unifi_controller_auth');
      }
    }
  }

  private async makeRequest(action: string, params: any = {}): Promise<any> {
    try {
      console.log('UniFi Controller API Request:', { action, ...params });

      const response = await fetch('https://mpvxppgoyaddwukkfoccs.supabase.co/functions/v1/unifi-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E`,
        },
        body: JSON.stringify({
          action,
          baseUrl: this.baseUrl,
          ...params
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error + (result.details ? `: ${result.details}` : ''));
      }

      return result;
    } catch (error) {
      console.error('UniFi Controller API Request failed:', error);
      throw error;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.makeRequest('login', {
        username: this.username,
        password: this.password
      });
      
      if (response.success && response.cookies) {
        this.auth = {
          cookies: response.cookies,
          timestamp: Date.now()
        };
        
        localStorage.setItem('unifi_controller_auth', JSON.stringify(this.auth));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('UniFi Controller authentication failed:', error);
      return false;
    }
  }

  private async ensureAuthenticated(): Promise<boolean> {
    if (!this.auth) {
      return await this.authenticate();
    }
    
    const timeRemaining = (this.auth.timestamp + (12 * 60 * 60 * 1000)) - Date.now();
    if (timeRemaining < 60000) {
      return await this.authenticate();
    }
    
    return true;
  }

  async getSites(): Promise<UniFiSite[]> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('getSites', {
        cookies: this.auth!.cookies
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get sites:', error);
      return [];
    }
  }

  async getDevices(siteId: string): Promise<UniFiDevice[]> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('getDevices', {
        cookies: this.auth!.cookies,
        siteId
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  async getClients(siteId: string): Promise<UniFiClient[]> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('getClients', {
        cookies: this.auth!.cookies,
        siteId
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get clients:', error);
      return [];
    }
  }

  async getSystemInfo(siteId: string): Promise<UniFiSystemInfo | null> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('getSystemInfo', {
        cookies: this.auth!.cookies,
        siteId
      });
      
      return response.data?.[0] || null;
    } catch (error) {
      console.error('Failed to get system info:', error);
      return null;
    }
  }

  async restartDevice(siteId: string, deviceMac: string): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('restartDevice', {
        cookies: this.auth!.cookies,
        siteId,
        deviceMac
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to restart device:', error);
      return false;
    }
  }

  async blockClient(siteId: string, clientMac: string, block: boolean): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('blockClient', {
        cookies: this.auth!.cookies,
        siteId,
        clientMac,
        block
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to block/unblock client:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('testConnection', {
        username: this.username,
        password: this.password
      });
      
      if (response.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('UniFi Controller connection test failed:', error);
      return false;
    }
  }

  // Network Management
  async getNetworks(siteId: string): Promise<UniFiNetwork[]> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('getNetworks', {
        cookies: this.auth!.cookies,
        siteId
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get networks:', error);
      return [];
    }
  }

  async createNetwork(siteId: string, networkData: any): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('createNetwork', {
        cookies: this.auth!.cookies,
        siteId,
        networkData
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to create network:', error);
      return false;
    }
  }

  async updateNetwork(siteId: string, networkId: string, networkData: any): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('updateNetwork', {
        cookies: this.auth!.cookies,
        siteId,
        networkId,
        networkData
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to update network:', error);
      return false;
    }
  }

  async deleteNetwork(siteId: string, networkId: string): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('deleteNetwork', {
        cookies: this.auth!.cookies,
        siteId,
        networkId
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to delete network:', error);
      return false;
    }
  }

  // Device Management
  async locateDevice(siteId: string, deviceMac: string): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('locateDevice', {
        cookies: this.auth!.cookies,
        siteId,
        deviceMac
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to locate device:', error);
      return false;
    }
  }

  async setDeviceLED(siteId: string, deviceMac: string, enabled: boolean): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('setDeviceLED', {
        cookies: this.auth!.cookies,
        siteId,
        deviceMac,
        enable: enabled
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to set device LED:', error);
      return false;
    }
  }

  async updateDeviceSettings(siteId: string, deviceMac: string, settings: any): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('setDeviceSettings', {
        cookies: this.auth!.cookies,
        siteId,
        deviceMac,
        settings
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to update device settings:', error);
      return false;
    }
  }

  // Client Management
  async setClientAlias(siteId: string, clientMac: string, alias: string): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('setClientAlias', {
        cookies: this.auth!.cookies,
        siteId,
        clientMac,
        alias
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to set client alias:', error);
      return false;
    }
  }

  async disconnectClient(siteId: string, clientMac: string): Promise<boolean> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('disconnectClient', {
        cookies: this.auth!.cookies,
        siteId,
        clientMac
      });
      
      return response.meta?.rc === 'ok';
    } catch (error) {
      console.error('Failed to disconnect client:', error);
      return false;
    }
  }

  // Monitoring
  async getHealthMetrics(siteId: string): Promise<UniFiHealthMetrics[]> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('getHealthMetrics', {
        cookies: this.auth!.cookies,
        siteId
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get health metrics:', error);
      return [];
    }
  }

  async getEvents(siteId: string): Promise<UniFiEvent[]> {
    try {
      if (!(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }
      
      const response = await this.makeRequest('getEvents', {
        cookies: this.auth!.cookies,
        siteId
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }
}

export const useUniFiAPI = (selectedSiteId?: string) => {
  const { data: integrations = [], isLoading: integrationsLoading } = useIntegrations();
  const queryClient = useQueryClient();
  
  const unifiIntegration = integrations.find(integration => 
    integration.type === 'unifi' && integration.is_active
  );

  const unifiService = unifiIntegration ? new UniFiControllerService(unifiIntegration) : null;

  // Sites
  const {
    data: sites = [],
    isLoading: sitesLoading,
    error: sitesError,
    refetch: refetchSites
  } = useQuery({
    queryKey: ['unifi-controller', 'sites', unifiIntegration?.id],
    queryFn: async () => {
      if (!unifiService) {
        return [];
      }
      const sites = await unifiService.getSites();
      return sites;
    },
    enabled: !!unifiService && !integrationsLoading,
    staleTime: 300000,
    retry: 2,
  });

  // Devices
  const {
    data: devices = [],
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['unifi-controller', 'devices', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) {
        return [];
      }
      const devices = await unifiService.getDevices(selectedSiteId);
      return devices;
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 30000,
    retry: 2,
  });

  // Clients
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients
  } = useQuery({
    queryKey: ['unifi-controller', 'clients', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) {
        return [];
      }
      const clients = await unifiService.getClients(selectedSiteId);
      return clients;
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 15000,
    retry: 2,
  });

  // System Info
  const {
    data: systemInfo,
    isLoading: systemInfoLoading,
    refetch: refetchSystemInfo
  } = useQuery({
    queryKey: ['unifi-controller', 'systemInfo', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) {
        return null;
      }
      const systemInfo = await unifiService.getSystemInfo(selectedSiteId);
      return systemInfo;
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 60000,
    retry: 2,
  });

  // Networks
  const {
    data: networks = [],
    isLoading: networksLoading,
    refetch: refetchNetworks
  } = useQuery({
    queryKey: ['unifi-controller', 'networks', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) return [];
      return await unifiService.getNetworks(selectedSiteId);
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 60000,
    retry: 2,
  });

  // Health Metrics
  const {
    data: healthMetrics = [],
    isLoading: healthMetricsLoading,
    refetch: refetchHealthMetrics
  } = useQuery({
    queryKey: ['unifi-controller', 'healthMetrics', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) return [];
      return await unifiService.getHealthMetrics(selectedSiteId);
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 30000,
    retry: 2,
  });

  // Events
  const {
    data: events = [],
    isLoading: eventsLoading,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['unifi-controller', 'events', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) return [];
      return await unifiService.getEvents(selectedSiteId);
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 15000,
    retry: 2,
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => unifiService?.testConnection() || Promise.resolve(false),
    onSuccess: (isConnected) => {
      if (isConnected) {
        toast({
          title: "✅ Conexão bem-sucedida",
          description: "Conectado à Controladora UniFi com sucesso."
        });
        refetchSites();
      } else {
        toast({
          title: "❌ Falha na conexão",
          description: "Não foi possível conectar à Controladora UniFi. Verifique as configurações.",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "❌ Erro de conexão",
        description: "Erro ao tentar conectar à Controladora UniFi.",
        variant: "destructive"
      });
    }
  });

  // Restart device mutation
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

  // Block/unblock client mutation
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

  // Create network mutation
  const createNetworkMutation = useMutation({
    mutationFn: ({ siteId, networkData }: { siteId: string; networkData: any }) => 
      unifiService?.createNetwork(siteId, networkData) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "✅ Rede criada",
          description: "A rede Wi-Fi foi criada com sucesso."
        });
        refetchNetworks();
      } else {
        toast({
          title: "❌ Falha ao criar rede",
          description: "Não foi possível criar a rede Wi-Fi.",
          variant: "destructive"
        });
      }
    }
  });

  // Update network mutation
  const updateNetworkMutation = useMutation({
    mutationFn: ({ siteId, networkId, networkData }: { siteId: string; networkId: string; networkData: any }) => 
      unifiService?.updateNetwork(siteId, networkId, networkData) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "✅ Rede atualizada",
          description: "A rede Wi-Fi foi atualizada com sucesso."
        });
        refetchNetworks();
      } else {
        toast({
          title: "❌ Falha ao atualizar rede",
          description: "Não foi possível atualizar a rede Wi-Fi.",
          variant: "destructive"
        });
      }
    }
  });

  // Delete network mutation
  const deleteNetworkMutation = useMutation({
    mutationFn: ({ siteId, networkId }: { siteId: string; networkId: string }) => 
      unifiService?.deleteNetwork(siteId, networkId) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "✅ Rede removida",
          description: "A rede Wi-Fi foi removida com sucesso."
        });
        refetchNetworks();
      } else {
        toast({
          title: "❌ Falha ao remover rede",
          description: "Não foi possível remover a rede Wi-Fi.",
          variant: "destructive"
        });
      }
    }
  });

  // Locate device mutation
  const locateDeviceMutation = useMutation({
    mutationFn: ({ siteId, deviceId }: { siteId: string; deviceId: string }) => 
      unifiService?.locateDevice(siteId, deviceId) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "📍 Dispositivo localizado",
          description: "O dispositivo está piscando para localização."
        });
      }
    }
  });

  // Set device LED mutation
  const setDeviceLEDMutation = useMutation({
    mutationFn: ({ siteId, deviceId, enabled }: { siteId: string; deviceId: string; enabled: boolean }) => 
      unifiService?.setDeviceLED(siteId, deviceId, enabled) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "💡 LED atualizado",
          description: "O controle de LED do dispositivo foi atualizado."
        });
        refetchDevices();
      }
    }
  });

  // Update device settings mutation
  const updateDeviceSettingsMutation = useMutation({
    mutationFn: ({ siteId, deviceId, settings }: { siteId: string; deviceId: string; settings: any }) => 
      unifiService?.updateDeviceSettings(siteId, deviceId, settings) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "⚙️ Configurações salvas",
          description: "As configurações do dispositivo foram atualizadas."
        });
        refetchDevices();
      }
    }
  });

  // Set client alias mutation
  const setClientAliasMutation = useMutation({
    mutationFn: ({ siteId, clientId, alias }: { siteId: string; clientId: string; alias: string }) => 
      unifiService?.setClientAlias(siteId, clientId, alias) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "👤 Alias definido",
          description: "O nome do cliente foi atualizado."
        });
        refetchClients();
      }
    }
  });

  // Disconnect client mutation
  const disconnectClientMutation = useMutation({
    mutationFn: ({ siteId, clientId }: { siteId: string; clientId: string }) => 
      unifiService?.disconnectClient(siteId, clientId) || Promise.resolve(false),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "🔌 Cliente desconectado",
          description: "O cliente foi desconectado da rede."
        });
        refetchClients();
      }
    }
  });

  // Refresh all data for basic info
  const refreshAllData = async () => {
    if (!selectedSiteId) return;
    
    toast({
      title: "🔄 Atualizando dados",
      description: "Buscando informações atualizadas da Controladora UniFi..."
    });
    
    await Promise.all([
      refetchSites(),
      refetchDevices(),
      refetchClients(),
      refetchSystemInfo()
    ]);
    
    toast({
      title: "✅ Dados atualizados",
      description: "Informações da Controladora UniFi foram atualizadas."
    });
  };

  // Refresh all advanced data
  const refreshAdvancedData = async () => {
    if (!selectedSiteId) return;
    
    toast({
      title: "🔄 Atualizando dados avançados",
      description: "Buscando informações atualizadas da controladora..."
    });
    
    await Promise.all([
      refetchNetworks(),
      refetchHealthMetrics(),
      refetchEvents(),
      refetchDevices(),
      refetchClients()
    ]);
    
    toast({
      title: "✅ Dados atualizados",
      description: "Todas as informações foram atualizadas."
    });
  };

  // Wrapper functions
  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const handleRestartDevice = (siteId: string, deviceId: string) => {
    restartDeviceMutation.mutate({ siteId, deviceId });
  };

  const handleBlockClient = (siteId: string, clientId: string, block: boolean) => {
    blockClientMutation.mutate({ siteId, clientId, block });
  };

  const handleCreateNetwork = (networkData: any) => {
    if (selectedSiteId) {
      createNetworkMutation.mutate({ siteId: selectedSiteId, networkData });
    }
  };

  const handleUpdateNetwork = (networkId: string, networkData: any) => {
    if (selectedSiteId) {
      updateNetworkMutation.mutate({ siteId: selectedSiteId, networkId, networkData });
    }
  };

  const handleDeleteNetwork = (networkId: string) => {
    if (selectedSiteId) {
      deleteNetworkMutation.mutate({ siteId: selectedSiteId, networkId });
    }
  };

  const handleLocateDevice = (deviceId: string) => {
    if (selectedSiteId) {
      locateDeviceMutation.mutate({ siteId: selectedSiteId, deviceId });
    }
  };

  const handleSetDeviceLED = (deviceId: string, enabled: boolean) => {
    if (selectedSiteId) {
      setDeviceLEDMutation.mutate({ siteId: selectedSiteId, deviceId, enabled });
    }
  };

  const handleUpdateDeviceSettings = (deviceId: string, settings: any) => {
    if (selectedSiteId) {
      updateDeviceSettingsMutation.mutate({ siteId: selectedSiteId, deviceId, settings });
    }
  };

  const handleSetClientAlias = (clientId: string, alias: string) => {
    if (selectedSiteId) {
      setClientAliasMutation.mutate({ siteId: selectedSiteId, clientId, alias });
    }
  };

  const handleDisconnectClient = (clientId: string) => {
    if (selectedSiteId) {
      disconnectClientMutation.mutate({ siteId: selectedSiteId, clientId });
    }
  };

  return {
    // Data
    sites,
    devices,
    clients,
    systemInfo,
    networks,
    healthMetrics,
    events,
    integration: unifiIntegration,
    
    // Loading states
    isLoading: integrationsLoading || sitesLoading || devicesLoading || clientsLoading || systemInfoLoading,
    sitesLoading,
    devicesLoading,
    clientsLoading,
    systemInfoLoading,
    networksLoading,
    healthMetricsLoading,
    eventsLoading,
    
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
    createNetwork: handleCreateNetwork,
    updateNetwork: handleUpdateNetwork,
    deleteNetwork: handleDeleteNetwork,
    locateDevice: handleLocateDevice,
    setDeviceLED: handleSetDeviceLED,
    updateDeviceSettings: handleUpdateDeviceSettings,
    setClientAlias: handleSetClientAlias,
    disconnectClient: handleDisconnectClient,
    refreshAllData,
    refreshAdvancedData,
    refetchSites,
    refetchDevices,
    refetchClients,
    refetchSystemInfo,
    refetchNetworks,
    refetchHealthMetrics,
    refetchEvents,
    
    // Loading states for mutations
    createNetworkLoading: createNetworkMutation.isPending,
    updateNetworkLoading: updateNetworkMutation.isPending,
    deleteNetworkLoading: deleteNetworkMutation.isPending,
    locateDeviceLoading: locateDeviceMutation.isPending,
    setDeviceLEDLoading: setDeviceLEDMutation.isPending,
    updateDeviceSettingsLoading: updateDeviceSettingsMutation.isPending,
    setClientAliasLoading: setClientAliasMutation.isPending,
    disconnectClientLoading: disconnectClientMutation.isPending,
    
    // Utils
    isConnected: !!unifiIntegration,
    connectionUrl: unifiIntegration?.base_url || 'Não configurado',
  };
};
