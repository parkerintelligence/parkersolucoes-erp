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
  displayName?: string;
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
        
        // Melhor tratamento de erros específicos
        if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          throw new Error('Token de API inválido ou expirado. Verifique o token na configuração UniFi.');
        } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
          throw new Error('Acesso negado. Verifique as permissões do token de API.');
        } else if (error.message?.includes('404') || error.message?.includes('not found')) {
          throw new Error('Endpoint não encontrado. Verifique a configuração da API.');
        } else {
          throw new Error(`Erro da API UniFi: ${error.message}`);
        }
      }

      console.log('Returning response:', response);
      return response;
    } catch (err) {
      console.error('Failed to invoke unifi-proxy function:', err);
      
      if (err instanceof Error && err.message.includes('Token de API inválido')) {
        throw err; // Re-lançar erros específicos de token
      }
      
      throw new Error(`Erro na conexão com o UniFi: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  // Nova função para testar a conexão e token (versão API do hook)
  const testConnectionAPI = useMutation({
    mutationFn: async (integrationId: string) => {
      console.log('Testing UniFi connection for integration:', integrationId);
      
      try {
        // Testar endpoint básico da Site Manager API
        const response = await makeUniFiRequest('/ea/hosts', 'GET', integrationId);
        
        console.log('Connection test successful:', response);
        return {
          success: true,
          message: 'Conexão com UniFi Site Manager API estabelecida com sucesso!',
          data: response
        };
      } catch (error) {
        console.error('Connection test failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Erro desconhecido na conexão',
          error
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: result.message,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Test connection mutation error:', error);
      toast({
        title: "Erro no teste de conexão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  // Enhanced Hosts - buscar controladoras disponíveis (priorizar Site Manager API)
  const useUniFiHosts = (integrationId: string) => {
    return useQuery({
      queryKey: ['unifi-hosts', integrationId],
      queryFn: async () => {
        try {
          // Tentar Site Manager API primeiro (/v1/hosts e /ea/hosts)
          console.log('Tentando Site Manager API hosts...');
          
          let hostsData: any[] = [];
          
          // Primeiro tentar /v1/hosts
          try {
            const v1Response = await makeUniFiRequest('/v1/hosts', 'GET', integrationId);
            console.log('Site Manager API /v1/hosts response:', v1Response);
            
            if (v1Response?.data && Array.isArray(v1Response.data)) {
              hostsData = v1Response.data;
              console.log('✅ Usando Site Manager API /v1/hosts, hosts encontrados:', hostsData.length);
            }
          } catch (v1Error) {
            console.log('❌ /v1/hosts falhou, tentando /ea/hosts...');
            
            // Fallback para /ea/hosts
            const eaResponse = await makeUniFiRequest('/ea/hosts', 'GET', integrationId);
            console.log('Site Manager API /ea/hosts response:', eaResponse);
            
            if (eaResponse?.data && Array.isArray(eaResponse.data)) {
              hostsData = eaResponse.data;
              console.log('✅ Usando Site Manager API /ea/hosts, hosts encontrados:', hostsData.length);
            }
          }
          
          if (hostsData.length > 0) {
            // Para cada host, buscar seus sites e popular o array
            const hostsWithSites = await Promise.allSettled(
              hostsData.map(async (host: any) => {
                try {
                  console.log(`Buscando sites para host ${host.id}...`);
                  
                  // Tentar diferentes endpoints para sites
                  let sitesData: any[] = [];
                  
                  // Tentar /v1/hosts/{id}/sites primeiro
                  try {
                    const sitesV1Response = await makeUniFiRequest(`/v1/hosts/${host.id}/sites`, 'GET', integrationId);
                    if (sitesV1Response?.data && Array.isArray(sitesV1Response.data)) {
                      sitesData = sitesV1Response.data;
                      console.log(`✅ Sites encontrados via /v1/hosts/${host.id}/sites:`, sitesData.length);
                    }
                  } catch (v1SitesError) {
                    console.log(`❌ /v1/hosts/${host.id}/sites falhou, tentando /ea/hosts/${host.id}/sites...`);
                    
                    // Fallback para /ea/hosts/{id}/sites
                    try {
                      const sitesEaResponse = await makeUniFiRequest(`/ea/hosts/${host.id}/sites`, 'GET', integrationId);
                      if (sitesEaResponse?.data && Array.isArray(sitesEaResponse.data)) {
                        sitesData = sitesEaResponse.data;
                        console.log(`✅ Sites encontrados via /ea/hosts/${host.id}/sites:`, sitesData.length);
                      }
                    } catch (eaSitesError) {
                      console.log(`❌ Ambos endpoints de sites falharam para host ${host.id}`);
                    }
                  }

                  return {
                    ...host,
                    sites: sitesData || [],
                    sitesCount: sitesData?.length || 0,
                    isValid: true,
                    apiType: 'site-manager'
                  };
                } catch (error) {
                  console.error(`Erro ao buscar sites para host ${host.id}:`, error);
                  return {
                    ...host,
                    sites: [],
                    sitesCount: 0,
                    isValid: false,
                    apiType: 'site-manager'
                  };
                }
              })
            );

            // Filtrar apenas hosts que foram resolvidos com sucesso
            const validHosts = hostsWithSites
              .filter(result => result.status === 'fulfilled')
              .map(result => (result as any).value)
              .filter(host => host.isValid || host.sites?.length > 0);

            if (validHosts.length > 0) {
              console.log('✅ Hosts válidos com sites encontrados:', validHosts.length);
              return validHosts;
            }
          }
          
          throw new Error('Site Manager API não disponível ou sem dados, tentando local controller');
          
        } catch (error) {
          console.log('Site Manager API falhou completamente, tentando controladora local:', error.message);
          
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

            // For local controller, create a virtual host with the sites
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
                hostname: 'UniFi Network (Local Controller)',
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
              apiType: 'local-controller',
              displayName: 'UniFi Network' // Garantir que o nome seja exibido corretamente
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

  // Test connection - priorizar Site Manager API (não usar este)
  const testUniFiConnectionLegacy = useMutation({
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
    testUniFiConnection: testConnectionAPI,
    testConnectionAPI,
    refreshData,
  };
};