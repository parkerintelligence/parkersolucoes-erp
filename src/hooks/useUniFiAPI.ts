"use client"

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
  apiType?: 'site-manager' | 'local-controller';
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

  const makeUniFiRequest = async (endpoint: string, method: string = 'GET', integrationId: string, data?: any, ignoreSsl?: boolean) => {
    console.log('Making UniFi request:', { endpoint, method, integrationId, data, ignoreSsl });
    
    try {
      const { data: response, error } = await supabase.functions.invoke('unifi-proxy', {
        body: {
          method,
          endpoint,
          integrationId,
          data,
          ignore_ssl: ignoreSsl,
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

  // Enhanced Hosts - buscar controladoras disponíveis (priorizar Site Manager API)
  const useUniFiHosts = (integrationId: string) => {
    return useQuery({
      queryKey: ['unifi-hosts', integrationId],
      queryFn: async () => {
        try {
          // Sempre tentar Site Manager API primeiro (/ea/hosts)
          console.log('Tentando Site Manager API hosts...');
          const response = await makeUniFiRequest('/ea/hosts', 'GET', integrationId);
          console.log('Site Manager API hosts response:', response);
          
          if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
            // Site Manager API response
            console.log('✅ Usando Site Manager API hosts');
            return response.data.map((host: any) => ({
              ...host,
              sitesCount: 0, // Will be populated by sites query
              isValid: true,
              apiType: 'site-manager'
            }));
          }
          
          // Se chegou aqui, não há dados do Site Manager API ou é controladora local
          console.log('❌ Site Manager API não retornou hosts, tentando controladora local...');
          throw new Error('Site Manager API não disponível, tentando local controller');
          
        } catch (error) {
          console.log('Site Manager API falhou, tentando controladora local:', error.message);
          
          try {
            // Fallback to local controller approach
            console.log('Tentando controladora local (/api/self/sites)...');
            const sitesResponse = await makeUniFiRequest('/api/self/sites', 'GET', integrationId);
            
            let sites = [];
            if (sitesResponse?.data && Array.isArray(sitesResponse.data)) {
              sites = sitesResponse.data;
            } else if (Array.isArray(sitesResponse)) {
              sites = sitesResponse;
            }

            console.log('✅ Usando controladora local, sites encontrados:', sites.length);

            // For local controller, create a virtual host
            const virtualHost = {
              id: 'local-controller',
              hardwareId: 'local-controller',
              type: 'network-server',
              ipAddress: 'local',
              owner: true,
              isBlocked: false,
              registrationTime: new Date().toISOString(),
              lastConnectionStateChange: new Date().toISOString(),
              userData: {
                permissions: {
                  'network.management': ['admin']
                },
                status: 'ACTIVE'
              },
              reportedState: {
                controller_uuid: 'local-controller',
                firmware_version: null,
                hardware_id: 'local-controller',
                host_type: 0,
                hostname: 'Local UniFi Controller',
                inform_port: 8080,
                ipAddrs: ['local'],
                mgmt_port: 8443,
                name: 'UniFi Network',
                override_inform_host: false,
                release_channel: 'release',
                state: 'connected',
                version: 'local'
              },
              sitesCount: sites.length,
              isValid: sites.length > 0,
              sites: sites, // Cache sites data
              apiType: 'local-controller'
            };

            return [virtualHost];
          } catch (localError) {
            console.error('❌ Controladora local também falhou:', localError);
            return [];
          }
        }
      },
      enabled: !!integrationId,
      staleTime: 2 * 60000, // 2 minutes
      retry: 2,
    });
  };

  // Sites - fetching sites for a specific host (priorizar Site Manager API)
  const useUniFiSites = (integrationId: string, hostId?: string) => {
    return useQuery({
      queryKey: ['unifi-sites', integrationId, hostId],
      queryFn: async () => {
        if (!hostId) return { data: [] };
        
        // First try to get cached sites from hosts data
        const hostData = queryClient.getQueryData(['unifi-hosts', integrationId]) as UniFiHost[];
        const host = hostData?.find(h => h.id === hostId);
        
        if (host?.sites && host.sites.length > 0) {
          console.log('✅ Usando sites em cache do host:', host.sites);
          return { data: host.sites };
        }

        // Se é um host do Site Manager API, usar endpoint específico
        if (host?.apiType === 'site-manager' || hostId !== 'local-controller') {
          try {
            console.log(`Tentando Site Manager API sites para host ${hostId}...`);
            const siteManagerResponse = await makeUniFiRequest(`/ea/hosts/${hostId}/sites`, 'GET', integrationId);
            
            if (siteManagerResponse?.data && Array.isArray(siteManagerResponse.data) && siteManagerResponse.data.length > 0) {
              console.log('✅ Usando Site Manager API sites');
              return siteManagerResponse;
            }
          } catch (error) {
            console.log('❌ Site Manager API sites falhou:', error.message);
          }
        }

        // Fallback to local controller endpoint
        console.log('Tentando controladora local sites...');
        try {
          const localResponse = await makeUniFiRequest('/api/self/sites', 'GET', integrationId);
          console.log('✅ Usando controladora local sites');
          return localResponse;
        } catch (error) {
          console.error('❌ Controladora local sites também falhou:', error);
          return { data: [] };
        }
      },
      enabled: !!integrationId && !!hostId,
      staleTime: 60000, // 1 minute
      retry: 2,
    });
  };

  // Devices - detectar API correta baseado no tipo de integração
  const useUniFiDevices = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-devices', integrationId, hostId, siteId],
      queryFn: async () => {
        if (!siteId) return { data: [] };
        
        // Tentar Site Manager API primeiro
        try {
          console.log(`Tentando Site Manager API devices para site ${siteId}...`);
          const siteManagerResponse = await makeUniFiRequest(`/ea/sites/${siteId}/devices`, 'GET', integrationId);
          
          if (siteManagerResponse?.data && Array.isArray(siteManagerResponse.data)) {
            console.log('✅ Usando Site Manager API devices');
            return siteManagerResponse;
          }
        } catch (error) {
          console.log('❌ Site Manager API devices falhou, tentando controladora local...');
        }
        
        // Fallback para controladora local
        const endpoint = `/api/s/${siteId}/stat/device`;
        console.log('✅ Usando controladora local devices');
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!hostId && !!siteId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Clients - detectar API correta baseado no tipo de integração
  const useUniFiClients = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-clients', integrationId, hostId, siteId],
      queryFn: async () => {
        if (!siteId) return { data: [] };
        
        // Tentar Site Manager API primeiro
        try {
          console.log(`Tentando Site Manager API clients para site ${siteId}...`);
          const siteManagerResponse = await makeUniFiRequest(`/ea/sites/${siteId}/clients`, 'GET', integrationId);
          
          if (siteManagerResponse?.data && Array.isArray(siteManagerResponse.data)) {
            console.log('✅ Usando Site Manager API clients');
            return siteManagerResponse;
          }
        } catch (error) {
          console.log('❌ Site Manager API clients falhou, tentando controladora local...');
        }
        
        // Fallback para controladora local
        const endpoint = `/api/s/${siteId}/stat/sta`;
        console.log('✅ Usando controladora local clients');
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!hostId && !!siteId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Networks - usar endpoint correto da Controladora Local
  const useUniFiNetworks = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-networks', integrationId, hostId, siteId],
      queryFn: () => {
        const endpoint = siteId ? `/api/s/${siteId}/rest/wlanconf` : '/api/rest/wlanconf';
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!hostId,
      staleTime: 60000, // 1 minute
      retry: 2,
    });
  };

  // Alarms - usar endpoint correto da Controladora Local
  const useUniFiAlarms = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-alarms', integrationId, hostId, siteId],
      queryFn: () => {
        const endpoint = siteId ? `/api/s/${siteId}/stat/alarm` : '/api/stat/alarm';
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!hostId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  // Health - usar endpoint correto da Controladora Local
  const useUniFiHealth = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-health', integrationId, hostId, siteId],
      queryFn: () => {
        const endpoint = siteId ? `/api/s/${siteId}/stat/health` : '/api/stat/health';
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
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
        
        const deviceEndpoint = siteId ? `/api/s/${siteId}/stat/device` : '/api/stat/device';
        const clientEndpoint = siteId ? `/api/s/${siteId}/stat/sta` : '/api/stat/sta';
        const healthEndpoint = siteId ? `/api/s/${siteId}/stat/health` : '/api/stat/health';
        
        const [devicesResponse, clientsResponse, healthResponse] = await Promise.all([
          makeUniFiRequest(deviceEndpoint, 'GET', integrationId),
          makeUniFiRequest(clientEndpoint, 'GET', integrationId),
          makeUniFiRequest(healthEndpoint, 'GET', integrationId),
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
    mutationFn: async ({ integrationId, hostId, deviceId, siteId }: { integrationId: string, hostId: string, deviceId: string, siteId?: string }) => {
      const endpoint = siteId ? `/api/s/${siteId}/cmd/devmgr` : '/api/cmd/devmgr';
      return makeUniFiRequest(endpoint, 'POST', integrationId, {
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
    mutationFn: async ({ integrationId, hostId, clientId, block, siteId }: { integrationId: string, hostId: string, clientId: string, block: boolean, siteId?: string }) => {
      const endpoint = siteId ? `/api/s/${siteId}/cmd/stamgr` : '/api/cmd/stamgr';
      return makeUniFiRequest(endpoint, 'POST', integrationId, {
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

  // Test connection - priorizar Site Manager API
  const testUniFiConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      try {
        // Sempre tentar Site Manager API primeiro
        console.log('🔍 Testando Site Manager API...');
        const siteManagerTest = await makeUniFiRequest('/ea/hosts', 'GET', integrationId);
        if (siteManagerTest?.data && Array.isArray(siteManagerTest.data)) {
          console.log('✅ Site Manager API funcionando!');
          return { type: 'site-manager', response: siteManagerTest };
        }
      } catch (error) {
        console.log('❌ Site Manager API falhou, tentando controladora local...', error.message);
      }
      
      // Fallback to local controller
      console.log('🔍 Testando controladora local...');
      const localTest = await makeUniFiRequest('/api/self/sites', 'GET', integrationId);
      console.log('✅ Controladora local funcionando!');
      return { type: 'local-controller', response: localTest };
    },
    onSuccess: (result) => {
      const apiType = result.type === 'site-manager' ? 'Site Manager API (api.ui.com)' : 'Controladora Local';
      toast({
        title: "✅ Conexão realizada com sucesso",
        description: `Conectado via ${apiType}.`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ UniFi connection test failed:', error);
      toast({
        title: "❌ Erro na conexão",
        description: error.message || "Falha ao conectar com UniFi. Verifique suas credenciais e conectividade.",
        variant: "destructive",
      });
    },
  });

  // Site Manager API specific hooks
  const useUniFiSiteManagerHosts = (integrationId: string) => {
    return useQuery({
      queryKey: ['unifi-site-manager-hosts', integrationId],
      queryFn: () => makeUniFiRequest('/ea/hosts', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 5 * 60000, // 5 minutes
      retry: 2,
    });
  };

  const useUniFiSiteManagerSites = (integrationId: string, hostId?: string) => {
    return useQuery({
      queryKey: ['unifi-site-manager-sites', integrationId, hostId],
      queryFn: () => makeUniFiRequest(`/ea/hosts/${hostId}/sites`, 'GET', integrationId),
      enabled: !!integrationId && !!hostId,
      staleTime: 2 * 60000, // 2 minutes
      retry: 2,
    });
  };

  const useUniFiSiteManagerDevices = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-site-manager-devices', integrationId, siteId],
      queryFn: () => makeUniFiRequest(`/ea/sites/${siteId}/devices`, 'GET', integrationId),
      enabled: !!integrationId && !!siteId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  const useUniFiSiteManagerClients = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-site-manager-clients', integrationId, siteId],
      queryFn: () => makeUniFiRequest(`/ea/sites/${siteId}/clients`, 'GET', integrationId),
      enabled: !!integrationId && !!siteId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

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
    // Hybrid hooks (work with both APIs)
    useUniFiHosts,
    useUniFiSites,
    useUniFiDevices,
    useUniFiClients,
    useUniFiNetworks,
    useUniFiAlarms,
    useUniFiHealth,
    useUniFiStats,
    // Site Manager API specific hooks
    useUniFiSiteManagerHosts,
    useUniFiSiteManagerSites,
    useUniFiSiteManagerDevices,
    useUniFiSiteManagerClients,
    // Mutations
    restartDevice,
    toggleClientBlock,
    testUniFiConnection,
    refreshData,
  };
};