import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUniFiProxy } from './useUniFiProxy';

export const useUniFiData = () => {
  const { makeUniFiProxyRequest } = useUniFiProxy();
  const queryClient = useQueryClient();

  // Função para buscar devices de um site
  const useUniFiDevices = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-devices', integrationId, siteId],
      queryFn: async () => {
        if (!siteId) {
          console.log('❌ useUniFiDevices: siteId não fornecido');
          return [];
        }
        
        console.log(`🔍 Buscando devices para siteId: ${siteId}, integrationId: ${integrationId}`);
        
        try {
          // Tentar Site Manager API primeiro
          console.log(`Tentando Site Manager API devices para site ${siteId}...`);
          const response = await makeUniFiProxyRequest('GET', `/ea/sites/${siteId}/devices`, integrationId);
          console.log(`Site Manager devices response for ${siteId}:`, response);
          
          if (response && Array.isArray(response)) {
            console.log(`✅ Devices encontrados via Site Manager API:`, response.length);
            return response;
          }
          
          throw new Error('Site Manager API não disponível');
          
        } catch (error) {
          console.log('❌ Site Manager API devices falhou:', error.message);
          console.log('Tentando controladora local...');
          
          // Fallback para controladora local
          try {
            const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/stat/device`, integrationId);
            console.log(`Local controller devices response for ${siteId}:`, localResponse);
            
            const devices = localResponse || [];
            console.log(`✅ Devices encontrados via controladora local:`, devices.length);
            return devices;
          } catch (localError) {
            console.error('❌ Controladora local devices também falhou:', localError.message);
            return [];
          }
        }
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
      retry: 2
    });
  };

  // Função para buscar clients de um site
  const useUniFiClients = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-clients', integrationId, siteId],
      queryFn: async () => {
        if (!siteId) {
          console.log('❌ useUniFiClients: siteId não fornecido');
          return [];
        }
        
        console.log(`🔍 Buscando clients para siteId: ${siteId}, integrationId: ${integrationId}`);
        
        try {
          // Tentar Site Manager API primeiro
          console.log(`Tentando Site Manager API clients para site ${siteId}...`);
          const response = await makeUniFiProxyRequest('GET', `/ea/sites/${siteId}/clients`, integrationId);
          console.log(`Site Manager clients response for ${siteId}:`, response);
          
          if (response && Array.isArray(response)) {
            console.log(`✅ Clients encontrados via Site Manager API:`, response.length);
            return response;
          }
          
          throw new Error('Site Manager API não disponível');
          
        } catch (error) {
          console.log('❌ Site Manager API clients falhou:', error.message);
          console.log('Tentando controladora local...');
          
          // Fallback para controladora local
          try {
            const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/stat/sta`, integrationId);
            console.log(`Local controller clients response for ${siteId}:`, localResponse);
            
            const clients = localResponse || [];
            console.log(`✅ Clients encontrados via controladora local:`, clients.length);
            return clients;
          } catch (localError) {
            console.error('❌ Controladora local clients também falhou:', localError.message);
            return [];
          }
        }
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
      retry: 2
    });
  };

  // Função para buscar networks de um site
  const useUniFiNetworks = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-networks', integrationId, siteId],
      queryFn: async () => {
        if (!siteId) {
          console.log('❌ useUniFiNetworks: siteId não fornecido');
          return [];
        }
        
        console.log(`🔍 Buscando networks para siteId: ${siteId}, integrationId: ${integrationId}`);
        
        try {
          // Tentar Site Manager API primeiro
          console.log(`Tentando Site Manager API networks para site ${siteId}...`);
          const response = await makeUniFiProxyRequest('GET', `/ea/sites/${siteId}/networks`, integrationId);
          console.log(`Site Manager networks response for ${siteId}:`, response);
          
          if (response && Array.isArray(response)) {
            console.log(`✅ Networks encontrados via Site Manager API:`, response.length);
            return response;
          }
          
          throw new Error('Site Manager API não disponível');
          
        } catch (error) {
          console.log('❌ Site Manager API networks falhou:', error.message);
          console.log('Tentando controladora local...');
          
          // Fallback para controladora local
          try {
            const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/rest/wlanconf`, integrationId);
            console.log(`Local controller networks response for ${siteId}:`, localResponse);
            
            const networks = localResponse || [];
            console.log(`✅ Networks encontrados via controladora local:`, networks.length);
            return networks;
          } catch (localError) {
            console.error('❌ Controladora local networks também falhou:', localError.message);
            return [];
          }
        }
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 5 * 60 * 1000,
      retry: 2
    });
  };

  // Função para buscar alarms/alerts de um site
  const useUniFiAlarms = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-alarms', integrationId, siteId],
      queryFn: async () => {
        if (!siteId) {
          console.log('❌ useUniFiAlarms: siteId não fornecido');
          return [];
        }
        
        console.log(`🔍 Buscando alarms para siteId: ${siteId}, integrationId: ${integrationId}`);
        
        try {
          // Tentar Site Manager API primeiro
          console.log(`Tentando Site Manager API alarms para site ${siteId}...`);
          const response = await makeUniFiProxyRequest('GET', `/ea/sites/${siteId}/events`, integrationId);
          console.log(`Site Manager alarms response for ${siteId}:`, response);
          
          if (response && Array.isArray(response)) {
            console.log(`✅ Alarms encontrados via Site Manager API:`, response.length);
            return response;
          }
          
          throw new Error('Site Manager API não disponível');
          
        } catch (error) {
          console.log('❌ Site Manager API alarms falhou:', error.message);
          console.log('Tentando controladora local...');
          
          // Fallback para controladora local
          try {
            const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/stat/alarm`, integrationId);
            console.log(`Local controller alarms response for ${siteId}:`, localResponse);
            
            const alarms = localResponse || [];
            console.log(`✅ Alarms encontrados via controladora local:`, alarms.length);
            return alarms;
          } catch (localError) {
            console.error('❌ Controladora local alarms também falhou:', localError.message);
            return [];
          }
        }
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 2 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
      retry: 2
    });
  };

  // Função para buscar health de um site
  const useUniFiHealth = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-health', integrationId, siteId],
      queryFn: async () => {
        if (!siteId) {
          console.log('❌ useUniFiHealth: siteId não fornecido');
          return [];
        }
        
        console.log(`🔍 Buscando health para siteId: ${siteId}, integrationId: ${integrationId}`);
        
        try {
          // Tentar Site Manager API primeiro
          console.log(`Tentando Site Manager API health para site ${siteId}...`);
          const response = await makeUniFiProxyRequest('GET', `/ea/sites/${siteId}/health`, integrationId);
          console.log(`Site Manager health response for ${siteId}:`, response);
          
          if (response && Array.isArray(response)) {
            console.log(`✅ Health encontrado via Site Manager API:`, response.length);
            return response;
          }
          
          throw new Error('Site Manager API não disponível');
          
        } catch (error) {
          console.log('❌ Site Manager API health falhou:', error.message);
          console.log('Tentando controladora local...');
          
          // Fallback para controladora local
          try {
            const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/stat/health`, integrationId);
            console.log(`Local controller health response for ${siteId}:`, localResponse);
            
            const health = localResponse || [];
            console.log(`✅ Health encontrado via controladora local:`, health.length);
            return health;
          } catch (localError) {
            console.error('❌ Controladora local health também falhou:', localError.message);
            return [];
          }
        }
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
      retry: 2
    });
  };

  // Função para buscar insights de um site (Site Manager API only)
  const useUniFiInsights = (integrationId: string, siteId?: string) => {
    return useQuery({
      queryKey: ['unifi-insights', integrationId, siteId],
      queryFn: async () => {
        if (!siteId) {
          console.log('❌ useUniFiInsights: siteId não fornecido');
          return [];
        }
        
        console.log(`🔍 Buscando insights para siteId: ${siteId}, integrationId: ${integrationId}`);
        
        try {
          // Site Manager API only
          const response = await makeUniFiProxyRequest('GET', `/ea/sites/${siteId}/insights`, integrationId);
          console.log(`Site Manager insights response for ${siteId}:`, response);
          
          if (response && Array.isArray(response)) {
            console.log(`✅ Insights encontrados via Site Manager API:`, response.length);
            return response;
          }
          
          return [];
        } catch (error) {
          console.log('❌ Site Manager API insights falhou:', error.message);
          return [];
        }
      },
      enabled: !!integrationId && !!siteId,
      staleTime: 5 * 60 * 1000,
      retry: 2
    });
  };

  // Função para invalidar todos os caches de um site
  const refreshSiteData = (integrationId: string, siteId?: string) => {
    console.log('🔄 Invalidating UniFi site data for:', { integrationId, siteId });
    
    if (siteId) {
      const queries = [
        ['unifi-devices', integrationId, siteId],
        ['unifi-clients', integrationId, siteId],
        ['unifi-networks', integrationId, siteId],
        ['unifi-alarms', integrationId, siteId],
        ['unifi-health', integrationId, siteId],
        ['unifi-insights', integrationId, siteId]
      ];
      
      console.log('📋 Invalidating queries:', queries.map(q => q.join('/')));
      
      queries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      console.log('✅ All site queries invalidated, data will refresh');
    }
  };

  return {
    useUniFiDevices,
    useUniFiClients,
    useUniFiNetworks,
    useUniFiAlarms,
    useUniFiHealth,
    useUniFiInsights,
    refreshSiteData
  };
};