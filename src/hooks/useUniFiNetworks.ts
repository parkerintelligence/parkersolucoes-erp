import { useQuery } from '@tanstack/react-query';
import { useUniFiProxy } from './useUniFiProxy';

export const useUniFiNetworks = (integrationId: string, siteId?: string) => {
  const { makeUniFiProxyRequest } = useUniFiProxy();

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
        
        if (response && Array.isArray(response) && response.length > 0) {
          console.log(`✅ Networks encontrados via Site Manager API:`, response.length);
          return response;
        }
        
        throw new Error('Site Manager API não disponível ou sem dados');
        
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