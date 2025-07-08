
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
    this.baseUrl = integration.base_url.replace(/\/$/, ''); // Remove trailing slash
    this.username = integration.username;
    this.password = integration.password;
    
    // Try to load existing auth from localStorage
    const savedAuth = localStorage.getItem('unifi_controller_auth');
    if (savedAuth) {
      try {
        this.auth = JSON.parse(savedAuth);
        // Check if auth is expired (12 hours)
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

      console.log('UniFi Controller API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('UniFi Controller API Response not OK:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const result = await response.json();
      console.log('UniFi Controller API Response:', result);
      
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
      console.log('Authenticating with UniFi Controller...', { baseUrl: this.baseUrl, username: this.username });
      
      const response = await this.makeRequest('login', {
        username: this.username,
        password: this.password
      });
      
      if (response.success && response.cookies) {
        this.auth = {
          cookies: response.cookies,
          timestamp: Date.now()
        };
        
        // Save auth to localStorage
        localStorage.setItem('unifi_controller_auth', JSON.stringify(this.auth));
        
        console.log('UniFi Controller authentication successful');
        return true;
      }
      
      console.error('Authentication failed: no cookies received');
      return false;
    } catch (error) {
      console.error('UniFi Controller authentication failed:', error);
      return false;
    }
  }

  private async ensureAuthenticated(): Promise<boolean> {
    if (!this.auth) {
      console.log('No auth found, authenticating...');
      return await this.authenticate();
    }
    
    // Check if auth is expired (12 hours)
    const timeRemaining = (this.auth.timestamp + (12 * 60 * 60 * 1000)) - Date.now();
    if (timeRemaining < 60000) { // 1 minute buffer
      console.log('Auth expiring soon, re-authenticating...', { timeRemaining });
      return await this.authenticate();
    }
    
    console.log('Auth is valid, time remaining:', Math.floor(timeRemaining / 1000 / 60), 'minutes');
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
      console.log('Testing UniFi Controller connection...');
      const response = await this.makeRequest('testConnection', {
        username: this.username,
        password: this.password
      });
      
      if (response.success) {
        console.log('Connection test successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('UniFi Controller connection test failed:', error);
      return false;
    }
  }
}

export const useUniFiAPI = (selectedSiteId?: string) => {
  const { data: integrations = [], isLoading: integrationsLoading } = useIntegrations();
  const queryClient = useQueryClient();
  
  const unifiIntegration = integrations.find(integration => 
    integration.type === 'unifi' && integration.is_active
  );

  console.log('UniFi Integration found:', unifiIntegration);

  const unifiService = unifiIntegration ? new UniFiControllerService(unifiIntegration) : null;

  // Get sites
  const {
    data: sites = [],
    isLoading: sitesLoading,
    error: sitesError,
    refetch: refetchSites
  } = useQuery({
    queryKey: ['unifi-controller', 'sites', unifiIntegration?.id],
    queryFn: async () => {
      if (!unifiService) {
        console.log('No UniFi Controller service available');
        return [];
      }
      console.log('Fetching UniFi Controller sites...');
      const sites = await unifiService.getSites();
      console.log('UniFi Controller sites fetched:', sites);
      return sites;
    },
    enabled: !!unifiService && !integrationsLoading,
    staleTime: 300000, // 5 minutes
    retry: 2,
  });

  // Get devices for selected site
  const {
    data: devices = [],
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['unifi-controller', 'devices', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) {
        console.log('No site selected or no service available');
        return [];
      }
      console.log('Fetching UniFi Controller devices for site:', selectedSiteId);
      const devices = await unifiService.getDevices(selectedSiteId);
      console.log('UniFi Controller devices fetched:', devices);
      return devices;
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  // Get clients for selected site
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients
  } = useQuery({
    queryKey: ['unifi-controller', 'clients', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) {
        console.log('No site selected or no service available');
        return [];
      }
      console.log('Fetching UniFi Controller clients for site:', selectedSiteId);
      const clients = await unifiService.getClients(selectedSiteId);
      console.log('UniFi Controller clients fetched:', clients);
      return clients;
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 15000, // 15 seconds
    retry: 2,
  });

  // Get system info for selected site
  const {
    data: systemInfo,
    isLoading: systemInfoLoading,
    refetch: refetchSystemInfo
  } = useQuery({
    queryKey: ['unifi-controller', 'systemInfo', selectedSiteId, unifiIntegration?.id],
    queryFn: async () => {
      if (!selectedSiteId || !unifiService) {
        console.log('No site selected or no service available');
        return null;
      }
      console.log('Fetching UniFi Controller system info for site:', selectedSiteId);
      const systemInfo = await unifiService.getSystemInfo(selectedSiteId);
      console.log('UniFi Controller system info fetched:', systemInfo);
      return systemInfo;
    },
    enabled: !!unifiService && !!selectedSiteId && !integrationsLoading,
    staleTime: 60000, // 1 minute
    retry: 2,
  });

  // Test connection
  const testConnectionMutation = useMutation({
    mutationFn: () => unifiService?.testConnection() || Promise.resolve(false),
    onSuccess: (isConnected) => {
      if (isConnected) {
        toast({
          title: "✅ Conexão bem-sucedida",
          description: "Conectado à Controladora UniFi com sucesso."
        });
        // Refresh sites after successful connection
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
    
    console.log('Refreshing all UniFi Controller data for site:', selectedSiteId);
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

  const handleTestConnection = () => {
    console.log('Testing UniFi Controller connection...');
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
    networkSettings: [], // Not implemented yet
    integration: unifiIntegration,
    
    // Loading states
    isLoading: integrationsLoading || sitesLoading || devicesLoading || clientsLoading || systemInfoLoading,
    sitesLoading,
    devicesLoading,
    clientsLoading,
    systemInfoLoading,
    networkSettingsLoading: false,
    
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
    refetchNetworkSettings: () => Promise.resolve(),
    
    // Utils
    isConnected: !!unifiIntegration,
    connectionUrl: unifiIntegration?.base_url || 'Não configurado',
  };
};
