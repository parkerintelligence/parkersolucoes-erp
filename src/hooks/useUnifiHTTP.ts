import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UnifiConfig {
  base_url: string;
  username: string;
  password: string;
  site?: string;
}

interface UnifiSession {
  cookies: string;
  expiry: number;
}

export class UnifiHTTPClient {
  private config: UnifiConfig;
  private session: UnifiSession | null = null;

  constructor(config: UnifiConfig) {
    this.config = config;
    this.loadSession();
  }

  private saveSession(session: UnifiSession) {
    this.session = session;
    localStorage.setItem('unifi_session', JSON.stringify(session));
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem('unifi_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.expiry > Date.now()) {
          this.session = session;
        } else {
          localStorage.removeItem('unifi_session');
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      localStorage.removeItem('unifi_session');
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    console.log('🔍 Unifi HTTP Request:', { endpoint, method });

    const apiUrl = this.config.base_url.replace(/\/$/, '');
    const fullUrl = `${apiUrl}/api/s/${this.config.site || 'default'}/${endpoint}`;

    // Ensure we have a valid session
    if (!this.session || this.session.expiry <= Date.now()) {
      await this.authenticate();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.session?.cookies) {
      headers['Cookie'] = this.session.cookies;
    }

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, try to re-authenticate
          await this.authenticate();
          return this.makeRequest(endpoint, method, body);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Unifi HTTP Success:', { endpoint, result: data });
      
      return data.data || data;
    } catch (error: any) {
      console.error('💥 Unifi HTTP Error:', error);
      
      // If CORS error, throw a more specific error
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('CORS error: Não foi possível conectar diretamente à controladora UNIFI. Verifique se HTTPS está configurado ou se a controladora permite conexões cross-origin.');
      }
      
      throw error;
    }
  }

  private async authenticate(): Promise<void> {
    console.log('🔐 Authenticating with UNIFI...');
    
    const apiUrl = this.config.base_url.replace(/\/$/, '');
    const loginUrl = `${apiUrl}/api/login`;

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          remember: false
        }),
        mode: 'cors',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      // Extract cookies from response
      const setCookieHeader = response.headers.get('set-cookie');
      if (!setCookieHeader) {
        throw new Error('No session cookie received');
      }

      // Save session with 1 hour expiry
      this.saveSession({
        cookies: setCookieHeader,
        expiry: Date.now() + 3600000 // 1 hour
      });

      console.log('✅ UNIFI authentication successful');
    } catch (error: any) {
      console.error('❌ UNIFI authentication failed:', error);
      
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('CORS error: Não foi possível conectar à controladora UNIFI. Verifique se HTTPS está configurado e CORS está habilitado.');
      }
      
      throw error;
    }
  }

  async getDevices() {
    return this.makeRequest('stat/device');
  }

  async getClients() {
    return this.makeRequest('stat/sta');
  }

  async getNetworks() {
    return this.makeRequest('rest/wlanconf');
  }

  async getSiteInfo() {
    return this.makeRequest('stat/sites');
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
    return this.makeRequest('cmd/devmgr', 'POST', {
      cmd: 'restart',
      mac
    });
  }

  async blockClient(mac: string) {
    return this.makeRequest('cmd/stamgr', 'POST', {
      cmd: 'block-sta',
      mac
    });
  }

  async unblockClient(mac: string) {
    return this.makeRequest('cmd/stamgr', 'POST', {
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

export const useUnifiHTTP = (integration?: any) => {
  const queryClient = useQueryClient();
  const [client, setClient] = useState<UnifiHTTPClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create client when integration is provided
  useEffect(() => {
    if (integration?.base_url && integration?.username && integration?.password) {
      console.log('Creating Unifi HTTP client with:', {
        url: integration.base_url,
        username: integration.username,
        site: integration.api_token || 'default'
      });
      
      const newClient = new UnifiHTTPClient({
        base_url: integration.base_url,
        username: integration.username,
        password: integration.password,
        site: integration.api_token || 'default'
      });
      setClient(newClient);
      
      // Test connection automatically and set connected state
      newClient.testConnection()
        .then((connected) => {
          console.log('Unifi HTTP connection test result:', connected);
          setIsConnected(connected);
        })
        .catch((error) => {
          console.error('Unifi HTTP connection test failed:', error);
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
    queryKey: ['unifi-http-devices', integration?.id],
    queryFn: () => client?.getDevices() || [],
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  // Get clients
  const clients = useQuery({
    queryKey: ['unifi-http-clients', integration?.id],
    queryFn: () => client?.getClients() || [],
    enabled: !!client && isConnected,
    refetchInterval: 10000
  });

  // Get networks
  const networks = useQuery({
    queryKey: ['unifi-http-networks', integration?.id],
    queryFn: () => client?.getNetworks() || [],
    enabled: !!client && isConnected,
    refetchInterval: 300000
  });

  // Get statistics
  const statistics = useQuery({
    queryKey: ['unifi-http-statistics', integration?.id],
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
    queryClient.invalidateQueries({ queryKey: ['unifi-http-devices'] });
    queryClient.invalidateQueries({ queryKey: ['unifi-http-clients'] });
    queryClient.invalidateQueries({ queryKey: ['unifi-http-networks'] });
    queryClient.invalidateQueries({ queryKey: ['unifi-http-statistics'] });
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