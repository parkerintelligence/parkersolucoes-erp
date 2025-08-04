"use client"

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HostingerSnapshot {
  id: string;
  name: string;
  vps_id: string;
  size: number;
  created_at: string;
  status: string;
}

export const useHostingerSnapshots = (integrationId?: string) => {
  return useQuery({
    queryKey: ['hostinger-snapshots', integrationId],
    queryFn: async () => {
      if (!integrationId) return [];
      
      console.log('📸 Buscando snapshots para integração:', integrationId);
      
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: '/virtual-machines/snapshots',
          method: 'GET'
        }
      });

      if (error) {
        console.error('❌ Erro ao buscar snapshots:', error);
        throw error;
      }
      
      const snapshotsList = data?.data || [];
      console.log('✅ Snapshots encontrados:', snapshotsList);
      
      return snapshotsList;
    },
    enabled: !!integrationId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: 1,
  });
};