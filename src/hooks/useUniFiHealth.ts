import { useQuery } from '@tanstack/react-query';
import { useUniFiProxy } from './useUniFiProxy';

export const useUniFiHealth = (integrationId: string, siteId?: string) => {
  const { makeUniFiProxyRequest } = useUniFiProxy();

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
        
        if (response && Array.isArray(response) && response.length > 0) {
          console.log(`✅ Health encontrado via Site Manager API:`, response.length);
          return response;
        } else if (response?.data && Array.isArray(response.data)) {
          console.log(`✅ Health encontrado via Site Manager API (nested):`, response.data.length);
          return response.data;
        }
        
        throw new Error('Site Manager API não disponível ou sem dados');
        
      } catch (error) {
        console.log('❌ Site Manager API health falhou:', error.message);
        console.log('Tentando controladora local...');
        
        // Fallback para controladora local
        try {
          const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/stat/health`, integrationId);
          console.log(`Local controller health response for ${siteId}:`, localResponse);
          
          const health = localResponse?.data || localResponse || [];
          console.log(`✅ Health encontrado via controladora local:`, Array.isArray(health) ? health.length : 0);
          return Array.isArray(health) ? health : [];
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