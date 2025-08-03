import { useQuery } from '@tanstack/react-query';
import { useUniFiProxy } from './useUniFiProxy';

export const useUniFiInsights = (integrationId: string, siteId?: string) => {
  const { makeUniFiProxyRequest } = useUniFiProxy();

  return useQuery({
    queryKey: ['unifi-insights', integrationId, siteId],
    queryFn: async () => {
      if (!siteId) {
        console.log('❌ useUniFiInsights: siteId não fornecido');
        return [];
      }
      
      console.log(`🔍 Buscando insights para siteId: ${siteId}, integrationId: ${integrationId}`);
      
      try {
        // Site Manager API only (insights não está disponível na controladora local)
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