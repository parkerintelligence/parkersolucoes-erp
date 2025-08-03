import { useQuery } from '@tanstack/react-query';
import { useUniFiProxy } from './useUniFiProxy';

export const useUniFiDevices = (integrationId: string, siteId?: string) => {
  const { makeUniFiProxyRequest } = useUniFiProxy();

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
        
        if (response && Array.isArray(response) && response.length > 0) {
          console.log(`✅ Devices encontrados via Site Manager API:`, response.length);
          return response;
        }
        
        throw new Error('Site Manager API não disponível ou sem dados');
        
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