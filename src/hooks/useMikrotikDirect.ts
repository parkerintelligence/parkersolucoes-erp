import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MikrotikConfig {
  host: string;
  username: string;
  password: string;
  port: number;
  useHttps: boolean;
}

export class MikrotikDirectClient {
  private config: MikrotikConfig;

  constructor(config: MikrotikConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const protocol = this.config.useHttps ? 'https' : 'http';
    const url = `${protocol}://${this.config.host}:${this.config.port}/rest${endpoint}`;
    
    const auth = btoa(`${this.config.username}:${this.config.password}`);

    console.log('Mikrotik Direct Request:', { url, endpoint });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log('Mikrotik Raw Response:', text);

      // RouterOS REST API pode retornar dados em formato não-JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Se não é JSON, parsear como texto simples
        data = text.split('\n').filter(line => line.trim()).map(line => {
          const parts = line.split('=');
          if (parts.length >= 2) {
            const key = parts[0];
            const value = parts.slice(1).join('=');
            return { [key]: value };
          }
          return line;
        });
      }

      console.log('Mikrotik Direct Response:', { endpoint, data });
      return data;
    } catch (error) {
      console.error('Mikrotik Direct Error:', error);
      throw error;
    }
  }

  async getInterfaces() {
    return this.makeRequest('/interface');
  }

  async getSystemResources() {
    return this.makeRequest('/system/resource');
  }

  async getSystemIdentity() {
    return this.makeRequest('/system/identity');
  }

  async getSystemHealth() {
    return this.makeRequest('/system/health');
  }

  async getIpAddresses() {
    return this.makeRequest('/ip/address');
  }

  async getIpRoutes() {
    return this.makeRequest('/ip/route');
  }

  async getWirelessInterfaces() {
    return this.makeRequest('/interface/wireless');
  }

  async getFirewallFilter() {
    return this.makeRequest('/ip/firewall/filter');
  }

  async getQueueSimple() {
    return this.makeRequest('/queue/simple');
  }

  async getDhcpServer() {
    return this.makeRequest('/ip/dhcp-server');
  }

  async getDhcpLease() {
    return this.makeRequest('/ip/dhcp-server/lease');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/system/identity');
      return true;
    } catch (error) {
      console.error('Mikrotik connection test failed:', error);
      return false;
    }
  }
}

export const useMikrotikDirect = (integrationId?: string) => {
  const queryClient = useQueryClient();
  const [client, setClient] = useState<MikrotikDirectClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize client when integration is available
  const { data: integration } = useQuery({
    queryKey: ['integration', integrationId],
    queryFn: async () => {
      if (!integrationId) return null;
      
      // Get integration from your existing API
      const response = await fetch(`/api/integrations/${integrationId}`);
      return response.json();
    },
    enabled: !!integrationId
  });

  // Create client when integration is loaded
  useEffect(() => {
    if (integration) {
      const newClient = new MikrotikDirectClient({
        host: integration.base_url.replace(/^https?:\/\//, ''),
        username: integration.username,
        password: integration.password,
        port: integration.port || 80,
        useHttps: integration.base_url.startsWith('https')
      });
      setClient(newClient);
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

  // Get interfaces
  const interfaces = useQuery({
    queryKey: ['mikrotik-interfaces', integrationId],
    queryFn: async () => {
      if (!client) return [];
      const data = await client.getInterfaces();
      
      // Transform data to expected format
      return Array.isArray(data) ? data.map((item: any) => ({
        id: item.id || item['.id'],
        name: item.name,
        type: item.type,
        running: item.running === 'true',
        disabled: item.disabled === 'true',
        rx_bytes: parseInt(item['rx-byte']) || 0,
        tx_bytes: parseInt(item['tx-byte']) || 0,
        mtu: parseInt(item.mtu) || 0
      })) : [];
    },
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  // Get system resources
  const resources = useQuery({
    queryKey: ['mikrotik-resources', integrationId],
    queryFn: async () => {
      if (!client) return null;
      const data = await client.getSystemResources();
      
      if (Array.isArray(data) && data.length > 0) {
        const resource = data[0];
        return {
          board_name: resource['board-name'],
          version: resource.version,
          uptime: resource.uptime,
          cpu_load: parseInt(resource['cpu-load']) || 0,
          free_memory: parseInt(resource['free-memory']) || 0,
          total_memory: parseInt(resource['total-memory']) || 0,
          free_hdd_space: parseInt(resource['free-hdd-space']) || 0,
          total_hdd_space: parseInt(resource['total-hdd-space']) || 0
        };
      }
      return null;
    },
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  // Additional API methods
  const getSystemHealth = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return await client.getSystemHealth();
  }, [client]);

  const getIpAddresses = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return await client.getIpAddresses();
  }, [client]);

  const getFirewallFilter = useCallback(async () => {
    if (!client) throw new Error('Client not initialized');
    return await client.getFirewallFilter();
  }, [client]);

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mikrotik-interfaces'] });
    queryClient.invalidateQueries({ queryKey: ['mikrotik-resources'] });
  }, [queryClient]);

  return {
    client,
    isConnected,
    testConnection,
    interfaces: interfaces.data || [],
    resources: resources.data,
    isLoading: interfaces.isLoading || resources.isLoading,
    error: interfaces.error || resources.error,
    getSystemHealth,
    getIpAddresses,
    getFirewallFilter,
    refetchAll
  };
};