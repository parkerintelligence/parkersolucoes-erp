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

  async getGraphs(hostids?: string[]) {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('graph.get', {
      output: ['graphid', 'name', 'width', 'height'],
      selectGraphItems: ['itemid', 'color'],
      ...(hostids && { hostids }),
      sortfield: 'name'
    });
  }

  async getTemplates() {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('template.get', {
      output: ['templateid', 'name', 'description'],
      selectHosts: ['hostid', 'name'],
      selectItems: 'count',
      selectTriggers: 'count',
      sortfield: 'name'
    });
  }

  async getInventory(hostids?: string[]) {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('host.get', {
      output: ['hostid', 'name'],
      selectInventory: ['hardware', 'software', 'os', 'serialno_a', 'tag'],
      ...(hostids && { hostids }),
      withInventory: true
    });
  }

  async getMaintenances() {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('maintenance.get', {
      output: ['maintenanceid', 'name', 'description', 'active_since', 'active_till'],
      selectHosts: ['hostid', 'name'],
      selectTimeperiods: ['timeperiodid', 'timeperiod_type', 'start_date', 'period'],
      sortfield: 'name'
    });
  }

  async getServices() {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('service.get', {
      output: ['serviceid', 'name', 'status', 'algorithm'],
      selectParents: ['serviceid', 'name'],
      selectDependencies: ['serviceid', 'name'],
      sortfield: 'name'
    });
  }

  async getUsers() {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('user.get', {
      output: ['userid', 'username', 'name', 'surname', 'autologin', 'autologout'],
      selectUsrgrps: ['usrgrpid', 'name'],
      sortfield: 'username'
    });
  }

  async getNetworkMaps() {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('map.get', {
      output: ['sysmapid', 'name', 'width', 'height'],
      selectShapes: ['shapeid', 'type', 'x', 'y'],
      selectLines: ['lineid', 'x1', 'y1', 'x2', 'y2'],
      selectSelements: ['selementid', 'elementtype', 'iconid_off'],
      sortfield: 'name'
    });
  }

  async getLatestData(itemids?: string[]) {
    if (!this.authToken) {
      await this.authenticate();
    }

    return this.makeRequest('history.get', {
      output: ['itemid', 'clock', 'value'],
      ...(itemids && { itemids }),
      history: 0, // numeric values
      sortfield: 'clock',
      sortorder: 'DESC',
      limit: 100
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

export const useZabbixDirect = (integration?: any) => {
  const queryClient = useQueryClient();
  const [client, setClient] = useState<ZabbixDirectClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create client when integration is provided
  useEffect(() => {
    if (integration?.base_url && integration?.api_token) {
      console.log('Creating Zabbix client with:', {
        url: integration.base_url,
        hasToken: !!integration.api_token,
        tokenLength: integration.api_token.length
      });
      
      const newClient = new ZabbixDirectClient({
        url: integration.base_url,
        username: integration.username || '',
        password: integration.password || '',
        apiToken: integration.api_token
      });
      setClient(newClient);
      
      // Test connection automatically and set connected state
      newClient.testConnection()
        .then((connected) => {
          console.log('Zabbix connection test result:', connected);
          setIsConnected(connected);
        })
        .catch((error) => {
          console.error('Zabbix connection test failed:', error);
          setIsConnected(false);
        });
    } else {
      console.log('Missing Zabbix credentials:', {
        hasBaseUrl: !!integration?.base_url,
        hasToken: !!integration?.api_token
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

  // Get hosts
  const hosts = useQuery({
    queryKey: ['zabbix-hosts', integration?.id],
    queryFn: () => client?.getHosts() || [],
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  // Get problems
  const problems = useQuery({
    queryKey: ['zabbix-problems', integration?.id],
    queryFn: () => client?.getProblems() || [],
    enabled: !!client && isConnected,
    refetchInterval: 10000
  });

  // Enhanced queries with caching
  const graphs = useQuery({
    queryKey: ['zabbix-graphs', integration?.id],
    queryFn: () => client?.getGraphs() || [],
    enabled: !!client && isConnected,
    refetchInterval: 300000, // 5 minutes
    staleTime: 240000 // 4 minutes
  });

  const templates = useQuery({
    queryKey: ['zabbix-templates', integration?.id],
    queryFn: () => client?.getTemplates() || [],
    enabled: !!client && isConnected,
    refetchInterval: 900000, // 15 minutes
    staleTime: 600000 // 10 minutes
  });

  const inventory = useQuery({
    queryKey: ['zabbix-inventory', integration?.id],
    queryFn: () => client?.getInventory() || [],
    enabled: !!client && isConnected,
    refetchInterval: 1800000, // 30 minutes
    staleTime: 1200000 // 20 minutes
  });

  const maintenances = useQuery({
    queryKey: ['zabbix-maintenances', integration?.id],
    queryFn: () => client?.getMaintenances() || [],
    enabled: !!client && isConnected,
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000 // 5 minutes
  });

  const services = useQuery({
    queryKey: ['zabbix-services', integration?.id],
    queryFn: () => client?.getServices() || [],
    enabled: !!client && isConnected,
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000 // 1 minute
  });

  const users = useQuery({
    queryKey: ['zabbix-users', integration?.id],
    queryFn: () => client?.getUsers() || [],
    enabled: !!client && isConnected,
    refetchInterval: 1800000, // 30 minutes
    staleTime: 1200000 // 20 minutes
  });

  const networkMaps = useQuery({
    queryKey: ['zabbix-maps', integration?.id],
    queryFn: () => client?.getNetworkMaps() || [],
    enabled: !!client && isConnected,
    refetchInterval: 900000, // 15 minutes
    staleTime: 600000 // 10 minutes
  });

  const latestData = useQuery({
    queryKey: ['zabbix-latest', integration?.id],
    queryFn: () => client?.getLatestData() || [],
    enabled: !!client && isConnected,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000 // 15 seconds
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
    queryClient.invalidateQueries({ queryKey: ['zabbix-graphs'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-templates'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-inventory'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-maintenances'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-services'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-users'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-maps'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-latest'] });
  }, [queryClient]);

  return {
    client,
    isConnected,
    testConnection,
    hosts: hosts.data || [],
    problems: problems.data || [],
    graphs: graphs.data || [],
    templates: templates.data || [],
    inventory: inventory.data || [],
    maintenances: maintenances.data || [],
    services: services.data || [],
    users: users.data || [],
    networkMaps: networkMaps.data || [],
    latestData: latestData.data || [],
    isLoading: hosts.isLoading || problems.isLoading || graphs.isLoading,
    error: hosts.error || problems.error || graphs.error,
    getItems,
    getTriggers,
    refetchAll
  };
};