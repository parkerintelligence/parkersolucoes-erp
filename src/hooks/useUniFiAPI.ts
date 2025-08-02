import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UniFiDevice {
  id: string;
  mac: string;
  name?: string;
  displayName?: string;
  model: string;
  type: string;
  ip?: string;
  status: string;
  adopted: boolean;
  uptime?: number;
  version?: string;
  siteId: string;
  connectedClients?: number;
  ledOverride?: string;
  outlets?: any[];
  radioTable?: any[];
}

export interface UniFiClient {
  id: string;
  mac: string;
  name?: string;
  hostname?: string;
  ip?: string;
  network?: string;
  networkId?: string;
  accessPointMac?: string;
  channel?: number;
  radio?: string;
  signal?: number;
  noise?: number;
  rssi?: number;
  rxBytes?: number;
  txBytes?: number;
  uptime?: number;
  lastSeen?: number;
  isGuest?: boolean;
  isWired?: boolean;
  oui?: string;
  userId?: string;
  siteId: string;
}

export interface UniFiSite {
  id: string;
  name: string;
  description: string;
  role: string;
  newAlarmCount?: number;
  health?: any[];
}

export interface UniFiHost {
  id: string;
  hardwareId: string;
  type: string;
  ipAddress: string;
  owner: boolean;
  isBlocked: boolean;
  registrationTime: string;
  lastConnectionStateChange: string;
  userData: any;
  reportedState: {
    controller_uuid: string;
    firmware_version?: string;
    hardware_id: string;
    host_type: number;
    hostname: string;
    inform_port: number;
    ipAddrs: string[];
    mgmt_port: number;
    name: string;
    override_inform_host: boolean;
    release_channel: string;
    state: string;
    version: string;
  };
  // Enhanced properties
  sitesCount?: number;
  isValid?: boolean;
  sites?: UniFiSite[];
}

interface UniFiNetwork {
  id: string;
  name: string;
  purpose: string;
  vlan?: number;
  enabled: boolean;
  isGuest?: boolean;
  security: string;
  wpaMode?: string;
  wpaEncryption?: string;
  networkGroup?: string;
  siteId: string;
}

interface UniFiAlarm {
  id: string;
  time: number;
  datetime: string;
  message: string;
  subsystem: string;
  key: string;
  siteId: string;
  archived: boolean;
}

export const useUniFiAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const makeUniFiRequest = async (endpoint: string, method: string = 'GET', integrationId: string, data?: any) => {
    console.log('Making UniFi request:', { endpoint, method, integrationId, data });
    
    try {
      const { data: response, error } = await supabase.functions.invoke('unifi-proxy', {
        body: {
          method,
          endpoint,
          integrationId,
          data,
        },
      });

      console.log('UniFi API Response:', { response, error, hasData: !!response, hasError: !!error });

      if (error) {
        console.error('UniFi request error:', error);
        throw new Error(`UniFi API error: ${error.message}`);
      }

      console.log('Returning response:', response);
      return response;
    } catch (err) {
      console.error('Failed to invoke unifi-proxy function:', err);
      throw new Error(`Erro na conexão com o UniFi: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  // Enhanced Hosts - buscar controladoras disponíveis com validação e sites
  const useUniFiHosts = (integrationId: string) => {
    return useQuery({
      queryKey: ['unifi-hosts', integrationId],
      queryFn: async () => {
        try {
          const response = await makeUniFiRequest('/v1/hosts', 'GET', integrationId);
          console.log('Hosts response:', response);
          
          let hosts = [];
          if (response?.data && Array.isArray(response.data)) {
            hosts = response.data;
          } else if (Array.isArray(response)) {
            hosts = response;
          } else {
            console.warn('Unexpected hosts response structure:', response);
            return [];
          }

          // Filter and enhance hosts with validation
          const validHosts = [];
          for (const host of hosts) {
            // Check if host is valid and connected
            const isConnected = host.reportedState?.state === 'connected';
            const isNotBlocked = !host.isBlocked;
            const hasHostname = !!host.reportedState?.hostname;
            const isOwner = host.owner;

            if (isConnected && isNotBlocked && hasHostname && isOwner) {
              try {
                // Try to fetch sites for this host to validate it has data
                const sitesResponse = await makeUniFiRequest(`/v1/hosts/${host.id}/sites`, 'GET', integrationId);
                const sites = sitesResponse?.data || [];
                
                validHosts.push({
                  ...host,
                  sitesCount: sites.length,
                  isValid: sites.length > 0,
                  sites: sites // Cache sites data for faster loading
                });
              } catch (siteError) {
                console.warn(`Failed to fetch sites for host ${host.id}:`, siteError);
                // Still include the host but mark as potentially invalid
                validHosts.push({
                  ...host,
                  sitesCount: 0,
                  isValid: false,
                  sites: []
                });
              }
            }
          }

          console.log('Valid hosts with sites:', validHosts);
          return validHosts;
        } catch (error) {
          console.error('Failed to fetch hosts:', error);
          return [];
        }
      },
      enabled: !!integrationId,
      staleTime: 2 * 60000, // 2 minutes for cached sites data
      retry: 2,
    });
  };

  // Sites - optimized with host cache
  const useUniFiSites = (integrationId: string, hostId?: string) => {
    return useQuery({
      queryKey: ['unifi-sites', integrationId, hostId],
      queryFn: async () => {
        // First try to get cached sites from hosts data
        const hostData = queryClient.getQueryData(['unifi-hosts', integrationId]) as UniFiHost[];
        const host = hostData?.find(h => h.id === hostId);
        
        if (host?.sites && host.sites.length > 0) {
          console.log('Using cached sites from host data:', host.sites);
          return { data: host.sites };
        }

        // Fallback to API call if no cached data
        return makeUniFiRequest(`/v1/hosts/${hostId}/sites`, 'GET', integrationId);
      },
      enabled: !!integrationId && !!hostId,
      staleTime: 60000, // 1 minute
      retry: 2,
    });
  };

  // Devices - usar endpoint correto da Site Manager API v1
  const useUniFiDevices = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-devices', integrationId, hostId, siteId],
      queryFn: () => makeUniFiRequest(`/v1/hosts/${hostId}/devices`, 'GET', integrationId),
      enabled: !!integrationId && !!hostId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Clients - usar endpoint correto da Site Manager API v1
  const useUniFiClients = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-clients', integrationId, hostId, siteId],
      queryFn: () => makeUniFiRequest(`/v1/hosts/${hostId}/clients`, 'GET', integrationId),
      enabled: !!integrationId && !!hostId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Networks - usar endpoint correto da Site Manager API v1
  const useUniFiNetworks = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-networks', integrationId, hostId, siteId],
      queryFn: () => makeUniFiRequest(`/v1/hosts/${hostId}/networks`, 'GET', integrationId),
      enabled: !!integrationId && !!hostId,
      staleTime: 60000, // 1 minute
      retry: 2,
    });
  };

  // Alarms - usar endpoint correto da Site Manager API v1
  const useUniFiAlarms = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-alarms', integrationId, hostId, siteId],
      queryFn: () => makeUniFiRequest(`/v1/hosts/${hostId}/alarms`, 'GET', integrationId),
      enabled: !!integrationId && !!hostId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Health - usar endpoint correto da Site Manager API v1
  const useUniFiHealth = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-health', integrationId, hostId, siteId],
      queryFn: () => makeUniFiRequest(`/v1/hosts/${hostId}/health`, 'GET', integrationId),
      enabled: !!integrationId && !!hostId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Statistics
  const useUniFiStats = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-stats', integrationId, hostId, siteId],
      queryFn: async () => {
        if (!hostId) return null;
        
        const [devicesResponse, clientsResponse, healthResponse] = await Promise.all([
          makeUniFiRequest(`/v1/hosts/${hostId}/devices`, 'GET', integrationId),
          makeUniFiRequest(`/v1/hosts/${hostId}/clients`, 'GET', integrationId),
          makeUniFiRequest(`/v1/hosts/${hostId}/health`, 'GET', integrationId),
        ]);

        const devices = devicesResponse?.data || [];
        const clients = clientsResponse?.data || [];
        const health = healthResponse?.data || [];

        return {
          total_devices: devices.length,
          adopted_devices: devices.filter((d: UniFiDevice) => d.adopted).length,
          online_devices: devices.filter((d: UniFiDevice) => d.status === 'online').length,
          total_clients: clients.length,
          wireless_clients: clients.filter((c: UniFiClient) => !c.isWired).length,
          wired_clients: clients.filter((c: UniFiClient) => c.isWired).length,
          guest_clients: clients.filter((c: UniFiClient) => c.isGuest).length,
          health_status: health,
          devices,
          clients
        };
      },
      enabled: !!integrationId && !!hostId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Device operations
  const restartDevice = useMutation({
    mutationFn: async ({ integrationId, hostId, deviceId }: { integrationId: string, hostId: string, deviceId: string }) => {
      return makeUniFiRequest(`/v1/hosts/${hostId}/cmd/device`, 'POST', integrationId, {
        cmd: 'restart',
        mac: deviceId
      });
    },
    onSuccess: () => {
      toast({
        title: "Dispositivo reiniciado",
        description: "O comando de reinicialização foi enviado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['unifi-devices'] });
    },
    onError: (error: Error) => {
      console.error('Device restart failed:', error);
      toast({
        title: "Erro ao reiniciar",
        description: error.message || "Falha ao reiniciar o dispositivo.",
        variant: "destructive",
      });
    },
  });

  // Block/Unblock client
  const toggleClientBlock = useMutation({
    mutationFn: async ({ integrationId, hostId, clientId, block }: { integrationId: string, hostId: string, clientId: string, block: boolean }) => {
      return makeUniFiRequest(`/v1/hosts/${hostId}/cmd/client`, 'POST', integrationId, {
        cmd: block ? 'block-sta' : 'unblock-sta',
        mac: clientId
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.block ? "Cliente bloqueado" : "Cliente desbloqueado",
        description: `Cliente ${variables.block ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['unifi-clients'] });
    },
    onError: (error: Error) => {
      console.error('Client block/unblock failed:', error);
      toast({
        title: "Erro na operação",
        description: error.message || "Falha ao executar a operação no cliente.",
        variant: "destructive",
      });
    },
  });

  // Test connection
  const testUniFiConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      return makeUniFiRequest('/v1/hosts', 'GET', integrationId);
    },
    onSuccess: () => {
      toast({
        title: "Conexão realizada com sucesso",
        description: "A conexão com o UniFi Controller foi estabelecida.",
      });
    },
    onError: (error: Error) => {
      console.error('UniFi connection test failed:', error);
      toast({
        title: "Erro na conexão",
        description: error.message || "Falha ao conectar com o UniFi Controller.",
        variant: "destructive",
      });
    },
  });

  const refreshData = (integrationId: string, hostId?: string, siteId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['unifi-hosts', integrationId] });
    queryClient.invalidateQueries({ queryKey: ['unifi-sites', integrationId, hostId] });
    queryClient.invalidateQueries({ queryKey: ['unifi-devices', integrationId, hostId, siteId] });
    queryClient.invalidateQueries({ queryKey: ['unifi-clients', integrationId, hostId, siteId] });
    queryClient.invalidateQueries({ queryKey: ['unifi-networks', integrationId, hostId, siteId] });
    queryClient.invalidateQueries({ queryKey: ['unifi-alarms', integrationId, hostId, siteId] });
    queryClient.invalidateQueries({ queryKey: ['unifi-health', integrationId, hostId, siteId] });
    queryClient.invalidateQueries({ queryKey: ['unifi-stats', integrationId, hostId, siteId] });
  };

  return {
    useUniFiHosts,
    useUniFiSites,
    useUniFiDevices,
    useUniFiClients,
    useUniFiNetworks,
    useUniFiAlarms,
    useUniFiHealth,
    useUniFiStats,
    restartDevice,
    toggleClientBlock,
    testUniFiConnection,
    refreshData,
  };
};