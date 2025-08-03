import { useQueryClient } from '@tanstack/react-query';

export const useUniFiDataRefresh = () => {
  const queryClient = useQueryClient();

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

  return { refreshSiteData };
};