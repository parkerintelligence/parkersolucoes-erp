import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ZabbixConfig {
  url: string;
  username: string;
  password: string;
  apiToken?: string;
}

interface ZabbixResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: string;
  };
  id: number;
}

export class ZabbixDirectClient {
  private config: ZabbixConfig;
  private authToken: string | null = null;
  private requestId = 1;

  constructor(config: ZabbixConfig) {
    this.config = config;
    // Try to get cached auth token
    this.authToken = localStorage.getItem(`zabbix_auth_${config.url}`);
  }

  private async makeRequest(method: string, params: any = {}, useAuth = true): Promise<any> {
    const url = this.config.url.replace(/\/$/, '') + '/api_jsonrpc.php';
    
    const payload = {
      jsonrpc: '2.0',
      method,
      params: useAuth && this.authToken ? { ...params, auth: this.authToken } : params,
      id: this.requestId++
    };

    console.log('Zabbix Direct Request:', { method, url, params });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ZabbixResponse = await response.json();
      
      if (data.error) {
        // If auth error, clear token and retry once
        if (data.error.code === -32602 && this.authToken && useAuth) {
          console.log('Auth token expired, retrying with new token');
          this.authToken = null;
          localStorage.removeItem(`zabbix_auth_${this.config.url}`);
          await this.authenticate();
          return this.makeRequest(method, params, useAuth);
        }
        throw new Error(`Zabbix API Error: ${data.error.message}`);
      }

      console.log('Zabbix Direct Response:', { method, result: data.result });
      return data.result;
    } catch (error) {
      console.error('Zabbix Direct Error:', error);
      throw error;
    }
  }

  async authenticate(): Promise<string> {
    if (this.config.apiToken) {
      this.authToken = this.config.apiToken;
      localStorage.setItem(`zabbix_auth_${this.config.url}`, this.authToken);
      return this.authToken;
    }

    const result = await this.makeRequest('user.login', {
      username: this.config.username,
      password: this.config.password
    }, false);

    this.authToken = result;
    localStorage.setItem(`zabbix_auth_${this.config.url}`, this.authToken);
    return this.authToken;
  }

  async getHosts() {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('host.get', {
      output: ['hostid', 'name', 'status', 'available'],
      selectInterfaces: ['interfaceid', 'ip', 'port', 'type'],
      selectGroups: ['groupid', 'name'],
      sortfield: 'name'
    });
  }

  async getProblems() {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('problem.get', {
      output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
      selectHosts: ['hostid', 'name'],
      selectTriggers: ['triggerid', 'description', 'priority'],
      sortfield: ['clock'],
      sortorder: 'DESC',
      limit: 100
    });
  }

  async getItems(hostids?: string[]) {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('item.get', {
      output: ['itemid', 'name', 'key_', 'value_type', 'units', 'lastvalue', 'lastclock'],
      selectHosts: ['hostid', 'name'],
      ...(hostids && { hostids }),
      sortfield: 'name'
    });
  }

  async getTriggers(hostids?: string[]) {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('trigger.get', {
      output: ['triggerid', 'description', 'status', 'priority', 'lastchange'],
      selectHosts: ['hostid', 'name'],
      selectFunctions: ['functionid', 'itemid'],
      ...(hostids && { hostids }),
      sortfield: 'priority',
      sortorder: 'DESC'
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      await this.makeRequest('apiinfo.version', {});
      return true;
    } catch (error) {
      console.error('Zabbix connection test failed:', error);
      return false;
    }
  }
}

export const useZabbixDirect = (integrationId?: string) => {
  const queryClient = useQueryClient();
  const [client, setClient] = useState<ZabbixDirectClient | null>(null);
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
      const newClient = new ZabbixDirectClient({
        url: integration.base_url,
        username: integration.username,
        password: integration.password,
        apiToken: integration.api_token
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

  // Get hosts
  const hosts = useQuery({
    queryKey: ['zabbix-hosts', integrationId],
    queryFn: () => client?.getHosts() || [],
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  // Get problems
  const problems = useQuery({
    queryKey: ['zabbix-problems', integrationId],
    queryFn: () => client?.getProblems() || [],
    enabled: !!client && isConnected,
    refetchInterval: 10000
  });

  // Get items
  const getItems = useCallback(async (hostids?: string[]) => {
    if (!client) throw new Error('Client not initialized');
    return await client.getItems(hostids);
  }, [client]);

  // Get triggers
  const getTriggers = useCallback(async (hostids?: string[]) => {
    if (!client) throw new Error('Client not initialized');
    return await client.getTriggers(hostids);
  }, [client]);

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['zabbix-hosts'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-problems'] });
  }, [queryClient]);

  return {
    client,
    isConnected,
    testConnection,
    hosts: hosts.data || [],
    problems: problems.data || [],
    isLoading: hosts.isLoading || problems.isLoading,
    error: hosts.error || problems.error,
    getItems,
    getTriggers,
    refetchAll
  };
};