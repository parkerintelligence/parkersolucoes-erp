import { useQuery } from '@tanstack/react-query';
import { useUniFiProxy } from './useUniFiProxy';

export const useUniFiClients = (integrationId: string, siteId?: string) => {
  const { makeUniFiProxyRequest } = useUniFiProxy();

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
        
        if (response && Array.isArray(response) && response.length > 0) {
          console.log(`✅ Clients encontrados via Site Manager API:`, response.length);
          return response;
        } else if (response?.data && Array.isArray(response.data)) {
          console.log(`✅ Clients encontrados via Site Manager API (nested):`, response.data.length);
          return response.data;
        }
        
        throw new Error('Site Manager API não disponível ou sem dados');
        
      } catch (error) {
        console.log('❌ Site Manager API clients falhou:', error.message);
        console.log('Tentando controladora local...');
        
        // Fallback para controladora local
        try {
          const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/stat/sta`, integrationId);
          console.log(`Local controller clients response for ${siteId}:`, localResponse);
          
          const clients = localResponse?.data || localResponse || [];
          console.log(`✅ Clients encontrados via controladora local:`, Array.isArray(clients) ? clients.length : 0);
          return Array.isArray(clients) ? clients : [];
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