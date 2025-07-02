import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UnifiConfig {
  base_url: string;
  username: string;
  password: string;
  site?: string;
}

export class UnifiDirectClient {
  private config: UnifiConfig;

  constructor(config: UnifiConfig) {
    this.config = config;
  }

  private async makeProxyRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    console.log('🔍 Unifi Proxy Request:', { endpoint, method, config: this.config });

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const requestBody = {
        config: {
          base_url: this.config.base_url,
          username: this.config.username,
          password: this.config.password,
          site: this.config.site || 'default'
        },
        endpoint,
        method,
        body
      };

      console.log('📡 Sending to Unifi proxy:', requestBody);
      
      const response = await supabase.functions.invoke('unifi-proxy', {
        body: requestBody
      });

      console.log('📥 Unifi proxy response:', response);

      if (response.error) {
        console.error('❌ Unifi proxy error:', response.error);
        throw new Error(response.error.message || 'Proxy request failed');
      }

      console.log('✅ Unifi Proxy Success:', { endpoint, result: response.data?.result });
      return response.data?.result;
    } catch (error) {
      console.error('💥 Unifi Proxy Error:', error);
      throw error;
    }
  }

  async getDevices() {
    return this.makeProxyRequest('stat/device');
  }

  async getClients() {
    return this.makeProxyRequest('stat/sta');
  }

  async getNetworks() {
    return this.makeProxyRequest('rest/wlanconf');
  }

  async getSiteInfo() {
    return this.makeProxyRequest('stat/sites');
  }

  async getStatistics() {
    const [devices, clients, sites] = await Promise.all([
      this.getDevices(),
      this.getClients(),
      this.getSiteInfo()
    ]);

    const totalDevices = devices?.length || 0;
    const onlineDevices = devices?.filter((d: any) => d.state === 1)?.length || 0;
    const totalClients = clients?.length || 0;
    const totalBytes = clients?.reduce((sum: number, client: any) => 
      sum + (client.tx_bytes || 0) + (client.rx_bytes || 0), 0) || 0;
    const wanIp = sites?.[0]?.wan_ip || '';

    return {
      total_devices: totalDevices,
      online_devices: onlineDevices,
      total_clients: totalClients,
      total_bytes: totalBytes,
      wan_ip: wanIp
    };
  }

  async restartDevice(mac: string) {
    return this.makeProxyRequest('cmd/devmgr', 'POST', {
      cmd: 'restart',
      mac
    });
  }

  async blockClient(mac: string) {
    return this.makeProxyRequest('cmd/stamgr', 'POST', {
      cmd: 'block-sta',
      mac
    });
  }

  async unblockClient(mac: string) {
    return this.makeProxyRequest('cmd/stamgr', 'POST', {
      cmd: 'unblock-sta',
      mac
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getSiteInfo();
      return true;
    } catch (error) {
      console.error('Unifi connection test failed:', error);
      return false;
    }
  }
}

export const useUnifiDirect = (integration?: any) => {
  const queryClient = useQueryClient();
  const [client, setClient] = useState<UnifiDirectClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create client when integration is provided
  useEffect(() => {
    if (integration?.base_url && integration?.username && integration?.password) {
      console.log('Creating Unifi client with:', {
        url: integration.base_url,
        username: integration.username,
        site: integration.api_token || 'default'
      });
      
      const newClient = new UnifiDirectClient({
        base_url: integration.base_url,
        username: integration.username,
        password: integration.password,
        site: integration.api_token || 'default'
      });
      setClient(newClient);
      
      // Test connection automatically and set connected state
      newClient.testConnection()
        .then((connected) => {
          console.log('Unifi connection test result:', connected);
          setIsConnected(connected);
        })
        .catch((error) => {
          console.error('Unifi connection test failed:', error);
          setIsConnected(false);
        });
    } else {
      console.log('Missing Unifi credentials:', {
        hasBaseUrl: !!integration?.base_url,
        hasUsername: !!integration?.username,
        hasPassword: !!integration?.password
      });
      setClient(null);
      setIsConnected(false);
    }
  }, [integration]);

  // Test connection
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Client not initialized');
      return await client.testConnection();
    },
    onSuccess: (connected) => {
      setIsConnected(connected);
    }
  });

  // Get devices
  const devices = useQuery({
    queryKey: ['unifi-devices', integration?.id],
    queryFn: () => client?.getDevices() || [],
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  // Get clients
  const clients = useQuery({
    queryKey: ['unifi-clients', integration?.id],
    queryFn: () => client?.getClients() || [],
    enabled: !!client && isConnected,
    refetchInterval: 10000
  });

  // Get networks
  const networks = useQuery({
    queryKey: ['unifi-networks', integration?.id],
    queryFn: () => client?.getNetworks() || [],
    enabled: !!client && isConnected,
    refetchInterval: 300000
  });

  // Get statistics
  const statistics = useQuery({
    queryKey: ['unifi-statistics', integration?.id],
    queryFn: () => client?.getStatistics() || {
      total_devices: 0,
      online_devices: 0,
      total_clients: 0,
      total_bytes: 0,
      wan_ip: ''
    },
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['unifi-devices'] });
    queryClient.invalidateQueries({ queryKey: ['unifi-clients'] });
    queryClient.invalidateQueries({ queryKey: ['unifi-networks'] });
    queryClient.invalidateQueries({ queryKey: ['unifi-statistics'] });
  }, [queryClient]);

  return {
    client,
    isConnected,
    testConnection,
    devices: devices.data || [],
    clients: clients.data || [],
    networks: networks.data || [],
    statistics: statistics.data || {
      total_devices: 0,
      online_devices: 0,
      total_clients: 0,
      total_bytes: 0,
      wan_ip: ''
    },
    isLoading: devices.isLoading || clients.isLoading || networks.isLoading,
    error: devices.error || clients.error || networks.error,
    refetchAll
  };
};