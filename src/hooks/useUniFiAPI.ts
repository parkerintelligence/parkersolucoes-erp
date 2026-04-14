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

        let detailedMessage = error.message;
        const responseContext = (error as { context?: Response }).context;

        if (responseContext && typeof responseContext.text === 'function') {
          try {
            const rawText = await responseContext.text();
            if (rawText) {
              try {
                const parsed = JSON.parse(rawText);
                detailedMessage = parsed?.details || parsed?.error || rawText;
              } catch {
                detailedMessage = rawText;
              }
            }
          } catch (contextError) {
            console.warn('Could not parse unifi-proxy error context:', contextError);
          }
        }

        throw new Error(`UniFi API error: ${detailedMessage}`);
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
          // Sempre tentar Site Manager API primeiro (/v1/hosts)
          console.log('Tentando Site Manager API hosts...');
          const response = await makeUniFiRequest('/v1/hosts', 'GET', integrationId);
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

  // Sites - buscar todos os sites disponíveis via Site Manager API
  const useUniFiSites = (integrationId: string, hostId?: string, preferLocalController: boolean = false) => {
    return useQuery({
      queryKey: ['unifi-sites', integrationId, hostId, preferLocalController],
      queryFn: async () => {
        if (!integrationId) return { data: [] };
        
        if (!preferLocalController) {
          try {
            // Primeiro, buscar hosts disponíveis para enriquecer informações dos sites
            console.log('🔍 Buscando hosts via Site Manager API v1...');
            const hostsResponse = await makeUniFiRequest('/v1/hosts', 'GET', integrationId);
            
            console.log('Hosts response:', { 
              hasData: !!hostsResponse?.data, 
              isArray: Array.isArray(hostsResponse?.data),
              length: hostsResponse?.data?.length,
              meta: hostsResponse?.meta 
            });
            
            // Check if we got an empty response with suggestion for local setup
            if (hostsResponse?.meta?.empty_response) {
              console.log('❌ Empty response detected - no controllers in UniFi Cloud');
              toast({
                title: "Controladora não encontrada no Cloud",
                description: "Nenhuma controladora encontrada no UniFi Cloud. Verifique se a controladora está registrada em unifi.ui.com ou configure uma controladora local.",
                variant: "destructive",
              });
              return { data: [] };
            }
            
            if (hostsResponse?.data && Array.isArray(hostsResponse.data) && hostsResponse.data.length > 0) {
              console.log('✅ Hosts encontrados:', hostsResponse.data.length);

              // Endpoint oficial do Site Manager para listar sites
              const sitesResponse = await makeUniFiRequest('/v1/sites', 'GET', integrationId);
              const rawSites = Array.isArray(sitesResponse?.data) ? sitesResponse.data : [];

              const connectedHosts = hostsResponse.data.filter((host: any) => host.reportedState?.state === 'connected');
              const connectedHostsById = new Map<string, any>(
                connectedHosts.map((host: any): [string, any] => [String(host.id), host])
              );

              const normalizedSites = rawSites.map((site: any) => {
                const siteControllerId = String(site.controllerId || site.controller_id || site.hostId || site.host_id || '');
                const host = connectedHostsById.get(siteControllerId);
                const counts = site.statistics?.counts || {};

                return {
                  ...site,
                  id: String(site.id || site.siteId || site.site_id || site.name || site.meta?.name || ''),
                  name: site.name || site.meta?.name || site.meta?.desc || 'Site UniFi',
                  description: site.description || site.meta?.desc || site.meta?.name || 'Site UniFi',
                  role: site.role || site.permission || 'admin',
                  newAlarmCount: Number(site.newAlarmCount ?? counts.criticalNotification ?? 0),
                  controllerName: host?.reportedState?.name || host?.reportedState?.hostname || site.controllerName || 'Controladora UniFi',
                  controllerId: siteControllerId || host?.id || null,
                  controllerState: host?.reportedState?.state || site.controllerState || 'connected'
                };
              }).filter((site: any) => site.id);

              const filteredSites = hostId
                ? normalizedSites.filter((site: any) => site.controllerId === hostId)
                : normalizedSites;

              console.log('✅ Total de sites encontrados:', normalizedSites.length, 'Filtrados:', filteredSites.length);
              return { data: filteredSites };
            }
          } catch (error) {
            console.log('❌ Site Manager API falhou, tentando controladora local...', error.message);
          }
        } else {
          console.log('🔍 Integração local detectada, pulando Site Manager API e buscando sites direto na controladora...');
        }

        // Fallback to local controller endpoint
        console.log('🔍 Tentando controladora local sites...');
        try {
          const localResponse = await makeUniFiRequest('/api/self/sites', 'GET', integrationId);
          const rawSites = Array.isArray(localResponse?.data)
            ? localResponse.data
            : (Array.isArray(localResponse) ? localResponse : []);

          const normalizedLocalSites = rawSites
            .map((site: any) => {
              const siteName = String(
                site?.name ||
                site?.site ||
                site?.meta?.name ||
                site?.site_name ||
                site?.attr_hidden_id ||
                site?._id ||
                site?.id ||
                ''
              ).trim();
              if (!siteName) return null;

              return {
                ...site,
                id: siteName,
                name: siteName,
                description: site?.desc || site?.description || siteName,
                role: site?.role || 'admin',
                newAlarmCount: Number(site?.num_new_alarms || site?.newAlarmCount || 0),
                controllerName: 'Controladora Local',
                controllerId: 'local-controller',
                controllerState: 'connected',
              };
            })
            .filter(Boolean);

          console.log('✅ Usando controladora local sites', { total: normalizedLocalSites.length });
          return { data: normalizedLocalSites };
        } catch (error) {
          console.error('❌ Controladora local sites também falhou:', error);
          const message = error instanceof Error ? error.message : 'Falha ao buscar sites da controladora local';
          throw new Error(message);
        }
      },
      enabled: !!integrationId,
      staleTime: 60000, // 1 minute
      retry: 1,
    });
  };

  const isCloudSiteManagerRequest = (hostId?: string) => Boolean(hostId && hostId !== 'local-controller');

  const buildUniFiReadEndpoint = (
    resource: 'devices' | 'clients' | 'networks' | 'alarms' | 'health',
    siteId?: string,
    hostId?: string,
  ) => {
    if (!siteId) return '';

    if (isCloudSiteManagerRequest(hostId)) {
      switch (resource) {
        case 'devices': {
          const query = new URLSearchParams({ pageSize: '500' });
          if (hostId) {
            query.append('hostIds[]', hostId);
          }
          return `/v1/devices?${query.toString()}`;
        }
        case 'clients':
          return `/v1/sites/${siteId}/clients?limit=500`;
        case 'networks':
          return `/v1/sites/${siteId}/networks`;
        case 'alarms':
          return `/v1/sites/${siteId}/alarms`;
        case 'health':
          return `/v1/sites/${siteId}/health`;
      }
    }

    switch (resource) {
      case 'devices':
        return `/api/s/${siteId}/stat/device`;
      case 'clients':
        return `/api/s/${siteId}/stat/sta`;
      case 'networks':
        return `/api/s/${siteId}/rest/networkconf`;
      case 'alarms':
        return `/api/s/${siteId}/stat/alarm`;
      case 'health':
        return `/api/s/${siteId}/stat/health`;
    }
  };

  const useUniFiDevices = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-devices', integrationId, hostId, siteId],
      queryFn: async () => {
        const endpoint = buildUniFiReadEndpoint('devices', siteId, hostId);
        if (!endpoint) return { data: [] };
        console.log('📡 Fetching devices:', endpoint);
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30000,
      retry: 2,
    });
  };

  const useUniFiClients = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-clients', integrationId, hostId, siteId],
      queryFn: async () => {
        const endpoint = buildUniFiReadEndpoint('clients', siteId, hostId);
        if (!endpoint) return { data: [] };
        console.log('📡 Fetching clients:', endpoint);
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30000,
      retry: 2,
    });
  };

  const useUniFiNetworks = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-networks', integrationId, hostId, siteId],
      queryFn: async () => {
        if (!siteId) return { data: [] };
        
        const isCloud = isCloudSiteManagerRequest(hostId);
        
        if (isCloud) {
          const endpoint = `/v1/sites/${siteId}/networks`;
          return makeUniFiRequest(endpoint, 'GET', integrationId);
        }
        
        // Local: fetch both networkconf (VLANs/LANs) and wlanconf (Wi-Fi SSIDs)
        const [netconfRes, wlanRes] = await Promise.allSettled([
          makeUniFiRequest(`/api/s/${siteId}/rest/networkconf`, 'GET', integrationId),
          makeUniFiRequest(`/api/s/${siteId}/rest/wlanconf`, 'GET', integrationId),
        ]);
        
        const netconfs = netconfRes.status === 'fulfilled' ? (netconfRes.value?.data || []) : [];
        const wlans = wlanRes.status === 'fulfilled' ? (wlanRes.value?.data || []) : [];
        
        // Merge: mark WLANs with purpose='wlan' and netconfs with their purpose
        const allNetworks = [
          ...netconfs.map((n: any) => ({ ...n, _source: 'networkconf' })),
          ...wlans.map((w: any) => ({ ...w, purpose: 'wlan', _source: 'wlanconf', networkgroup: w.networkgroup || 'default' })),
        ];
        
        return { data: allNetworks };
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 60000,
      retry: 2,
    });
  };

  const useUniFiAlarms = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-alarms', integrationId, hostId, siteId],
      queryFn: () => {
        const endpoint = buildUniFiReadEndpoint('alarms', siteId, hostId);
        if (!endpoint) return { data: [] };
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30000,
      retry: 2,
    });
  };

  const useUniFiHealth = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-health', integrationId, hostId, siteId],
      queryFn: () => {
        const endpoint = buildUniFiReadEndpoint('health', siteId, hostId);
        if (!endpoint) return { data: [] };
        return makeUniFiRequest(endpoint, 'GET', integrationId);
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30000,
      retry: 2,
    });
  };

  const useUniFiStats = (integrationId: string, hostId?: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-stats', integrationId, hostId, siteId],
      queryFn: async () => {
        const deviceEndpoint = buildUniFiReadEndpoint('devices', siteId, hostId);
        const clientEndpoint = buildUniFiReadEndpoint('clients', siteId, hostId);
        const healthEndpoint = buildUniFiReadEndpoint('health', siteId, hostId);

        if (!deviceEndpoint || !clientEndpoint || !healthEndpoint) return null;

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
          adopted_devices: devices.filter((d: UniFiDevice & any) => Boolean(d.adopted)).length,
          online_devices: devices.filter((d: UniFiDevice & any) => d.status === 'online' || d.state === 1).length,
          total_clients: clients.length,
          wireless_clients: clients.filter((c: UniFiClient & any) => !(c.isWired ?? c.is_wired)).length,
          wired_clients: clients.filter((c: UniFiClient & any) => Boolean(c.isWired ?? c.is_wired)).length,
          guest_clients: clients.filter((c: UniFiClient & any) => Boolean(c.isGuest ?? c.is_guest)).length,
          health_status: health,
          devices,
          clients,
        };
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30000,
      retry: 2,
    });
  };

  // Device operations
  const restartDevice = useMutation({
    mutationFn: async ({ integrationId, hostId, deviceId, siteId }: { integrationId: string, hostId?: string, deviceId: string, siteId?: string }) => {
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

  // Upgrade device firmware
  const upgradeDevice = useMutation({
    mutationFn: async ({ integrationId, deviceMac, siteId }: { integrationId: string, deviceMac: string, siteId?: string }) => {
      const endpoint = siteId ? `/api/s/${siteId}/cmd/devmgr` : '/api/cmd/devmgr';
      return makeUniFiRequest(endpoint, 'POST', integrationId, { cmd: 'upgrade', mac: deviceMac });
    },
    onSuccess: () => {
      toast({ title: 'Firmware', description: 'Comando de upgrade enviado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['unifi-devices'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar firmware', description: error.message, variant: 'destructive' });
    },
  });

  // Force provision device
  const provisionDevice = useMutation({
    mutationFn: async ({ integrationId, deviceMac, siteId }: { integrationId: string, deviceMac: string, siteId?: string }) => {
      const endpoint = siteId ? `/api/s/${siteId}/cmd/devmgr` : '/api/cmd/devmgr';
      return makeUniFiRequest(endpoint, 'POST', integrationId, { cmd: 'force-provision', mac: deviceMac });
    },
    onSuccess: () => {
      toast({ title: 'Provisionar', description: 'Comando enviado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['unifi-devices'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao provisionar', description: error.message, variant: 'destructive' });
    },
  });

  // Locate device (toggle LED)
  const locateDevice = useMutation({
    mutationFn: async ({ integrationId, deviceMac, siteId, enabled }: { integrationId: string, deviceMac: string, siteId?: string, enabled: boolean }) => {
      const endpoint = siteId ? `/api/s/${siteId}/cmd/devmgr` : '/api/cmd/devmgr';
      return makeUniFiRequest(endpoint, 'POST', integrationId, { cmd: enabled ? 'set-locate' : 'unset-locate', mac: deviceMac });
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.enabled ? 'Localizando...' : 'LED desligado', description: vars.enabled ? 'O LED do dispositivo está piscando.' : 'LED do dispositivo foi desligado.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao localizar', description: error.message, variant: 'destructive' });
    },
  });

  // Forget (remove/adopt) device
  const forgetDevice = useMutation({
    mutationFn: async ({ integrationId, deviceMac, siteId }: { integrationId: string, deviceMac: string, siteId?: string }) => {
      const endpoint = siteId ? `/api/s/${siteId}/cmd/sitemgr` : '/api/cmd/sitemgr';
      return makeUniFiRequest(endpoint, 'POST', integrationId, { cmd: 'delete-device', mac: deviceMac });
    },
    onSuccess: () => {
      toast({ title: 'Dispositivo removido', description: 'Dispositivo esquecido com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['unifi-devices'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  // Block/Unblock client
  const toggleClientBlock = useMutation({
    mutationFn: async ({ integrationId, hostId, clientId, block, siteId }: { integrationId: string, hostId?: string, clientId: string, block: boolean, siteId?: string }) => {
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

  // Network operations
  const createNetwork = useMutation({
    mutationFn: async ({ integrationId, siteId, networkData }: { integrationId: string, siteId: string, networkData: any }) => {
      const endpoint = `/api/s/${siteId}/rest/wlanconf`;
      return makeUniFiRequest(endpoint, 'POST', integrationId, networkData);
    },
    onSuccess: () => {
      toast({
        title: 'Rede criada',
        description: 'Nova rede criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['unifi-networks'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar rede',
        description: error.message || 'Falha ao criar rede.',
        variant: 'destructive',
      });
    },
  });

  const updateNetwork = useMutation({
    mutationFn: async ({ integrationId, siteId, networkId, networkData }: { integrationId: string, siteId: string, networkId: string, networkData: any }) => {
      const endpoint = `/api/s/${siteId}/rest/wlanconf/${networkId}`;
      return makeUniFiRequest(endpoint, 'PUT', integrationId, networkData);
    },
    onSuccess: () => {
      toast({
        title: 'Rede atualizada',
        description: 'Configuração da rede atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['unifi-networks'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar rede',
        description: error.message || 'Falha ao atualizar rede.',
        variant: 'destructive',
      });
    },
  });

  const deleteNetwork = useMutation({
    mutationFn: async ({ integrationId, siteId, networkId }: { integrationId: string, siteId: string, networkId: string }) => {
      const endpoint = `/api/s/${siteId}/rest/wlanconf/${networkId}`;
      return makeUniFiRequest(endpoint, 'DELETE', integrationId);
    },
    onSuccess: () => {
      toast({
        title: 'Rede removida',
        description: 'Rede removida com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['unifi-networks'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover rede',
        description: error.message || 'Falha ao remover rede.',
        variant: 'destructive',
      });
    },
  });

  const toggleNetwork = useMutation({
    mutationFn: async ({ integrationId, siteId, networkId, enabled }: { integrationId: string, siteId: string, networkId: string, enabled: boolean }) => {
      const endpoint = `/api/s/${siteId}/rest/wlanconf/${networkId}`;
      return makeUniFiRequest(endpoint, 'PUT', integrationId, { enabled });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.enabled ? 'Rede ativada' : 'Rede desativada',
        description: `A rede foi ${variables.enabled ? 'ativada' : 'desativada'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['unifi-networks'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar status da rede',
        description: error.message || 'Falha ao alterar status da rede.',
        variant: 'destructive',
      });
    },
  });

  // Test connection - priorizar Site Manager API
  const testUniFiConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      try {
        // Sempre tentar Site Manager API primeiro
        console.log('🔍 Testando Site Manager API...');
        const siteManagerTest = await makeUniFiRequest('/v1/hosts', 'GET', integrationId);
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
      queryFn: () => makeUniFiRequest('/v1/hosts', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 5 * 60000, // 5 minutes
      retry: 2,
    });
  };

  const useUniFiSiteManagerSites = (integrationId: string, hostId?: string) => {
    return useQuery({
      queryKey: ['unifi-site-manager-sites', integrationId, hostId],
      queryFn: async () => {
        const response = await makeUniFiRequest('/v1/sites', 'GET', integrationId);
        const sites = (Array.isArray(response?.data) ? response.data : []).map((site: any) => ({
          ...site,
          id: String(site.id || site.siteId || site.site_id || site.name || site.meta?.name || ''),
          name: site.name || site.meta?.name || site.meta?.desc || 'Site UniFi',
          description: site.description || site.meta?.desc || site.meta?.name || 'Site UniFi',
          role: site.role || site.permission || 'admin',
          controllerId: String(site.controllerId || site.controller_id || site.hostId || site.host_id || ''),
        })).filter((site: any) => site.id);

        if (!hostId) return { data: sites };

        const filtered = sites.filter((site: any) => site.controllerId === hostId);

        return { data: filtered };
      },
      enabled: !!integrationId,
      staleTime: 2 * 60000, // 2 minutes
      retry: 2,
    });
  };

  const useUniFiSiteManagerDevices = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-site-manager-devices', integrationId, siteId],
      queryFn: () => makeUniFiRequest(`/v1/sites/${siteId}/devices`, 'GET', integrationId),
      enabled: !!integrationId && !!siteId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  const useUniFiSiteManagerClients = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-site-manager-clients', integrationId, siteId],
      queryFn: () => makeUniFiRequest(`/v1/sites/${siteId}/clients`, 'GET', integrationId),
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
    upgradeDevice,
    provisionDevice,
    locateDevice,
    forgetDevice,
    toggleClientBlock,
    createNetwork,
    updateNetwork,
    deleteNetwork,
    toggleNetwork,
    testUniFiConnection,
    refreshData,
  };
};