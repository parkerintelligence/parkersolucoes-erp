import { useQuery } from '@tanstack/react-query';
import { useUniFiProxy } from './useUniFiProxy';

export const useUniFiAlarms = (integrationId: string, siteId?: string) => {
  const { makeUniFiProxyRequest } = useUniFiProxy();

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
        
        if (response && Array.isArray(response) && response.length > 0) {
          console.log(`✅ Alarms encontrados via Site Manager API:`, response.length);
          return response;
        } else if (response?.data && Array.isArray(response.data)) {
          console.log(`✅ Alarms encontrados via Site Manager API (nested):`, response.data.length);
          return response.data;
        }
        
        throw new Error('Site Manager API não disponível ou sem dados');
        
      } catch (error) {
        console.log('❌ Site Manager API alarms falhou:', error.message);
        console.log('Tentando controladora local...');
        
        // Fallback para controladora local
        try {
          const localResponse = await makeUniFiProxyRequest('GET', `/api/s/${siteId}/stat/alarm`, integrationId);
          console.log(`Local controller alarms response for ${siteId}:`, localResponse);
          
          const alarms = localResponse?.data || localResponse || [];
          console.log(`✅ Alarms encontrados via controladora local:`, Array.isArray(alarms) ? alarms.length : 0);
          return Array.isArray(alarms) ? alarms : [];
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