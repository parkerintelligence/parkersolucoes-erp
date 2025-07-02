import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ZabbixConfig {
  url: string;
  username: string;
  password: string;
  apiToken?: string;
}

interface ZabbixAuth {
  token: string;
  expiry: number;
}

export class ZabbixHTTPClient {
  private config: ZabbixConfig;
  private auth: ZabbixAuth | null = null;

  constructor(config: ZabbixConfig) {
    this.config = config;
    this.loadAuth();
  }

  private saveAuth(auth: ZabbixAuth) {
    this.auth = auth;
    localStorage.setItem('zabbix_auth', JSON.stringify(auth));
  }

  private loadAuth() {
    try {
      const stored = localStorage.getItem('zabbix_auth');
      if (stored) {
        const auth = JSON.parse(stored);
        if (auth.expiry > Date.now()) {
          this.auth = auth;
        } else {
          localStorage.removeItem('zabbix_auth');
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      localStorage.removeItem('zabbix_auth');
    }
  }

  private async makeRequest(method: string, params: any = {}): Promise<any> {
    console.log('🔍 Zabbix HTTP Request:', { method, params });

    const apiUrl = this.config.url.replace(/\/$/, '');
    const zabbixApiUrl = `${apiUrl}/api_jsonrpc.php`;

    // Use stored API token if available, otherwise authenticate
    let authToken = this.config.apiToken;
    if (!authToken) {
      if (!this.auth || this.auth.expiry <= Date.now()) {
        await this.authenticate();
      }
      authToken = this.auth?.token;
    }

    const payload = {
      jsonrpc: "2.0",
      method,
      params: {
        ...params,
        ...(authToken && { auth: authToken })
      },
      id: Date.now()
    };

    console.log('📡 Sending to Zabbix API:', payload);

    try {
      const response = await fetch(zabbixApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Zabbix-HTTP-Client/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors', // Explicitly set CORS mode
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Zabbix response:', data);

      if (data.error) {
        console.error('❌ Zabbix API Error:', data.error);
        throw new Error(data.error.message || data.error.data || 'Unknown Zabbix error');
      }

      console.log('✅ Zabbix HTTP Success:', { method, result: data.result });
      return data.result;
    } catch (error: any) {
      console.error('💥 Zabbix HTTP Error:', error);
      
      // If CORS error, throw a more specific error
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('CORS error: Não foi possível conectar diretamente ao Zabbix. Verifique se HTTPS está configurado ou se o servidor permite conexões cross-origin.');
      }
      
      throw error;
    }
  }

  private async authenticate(): Promise<void> {
    console.log('🔐 Authenticating with Zabbix...');
    
    const response = await this.makeRequest('user.login', {
      username: this.config.username,
      password: this.config.password
    });

    if (!response) {
      throw new Error('Authentication failed - no token received');
    }

    // Save auth token with 1 hour expiry
    this.saveAuth({
      token: response,
      expiry: Date.now() + 3600000 // 1 hour
    });

    console.log('✅ Zabbix authentication successful');
  }

  async getHosts() {
    return this.makeRequest('host.get', {
      output: ['hostid', 'name', 'status', 'available'],
      selectInterfaces: ['interfaceid', 'ip', 'port', 'type'],
      selectGroups: ['groupid', 'name'],
      sortfield: 'name'
    });
  }

  async getProblems() {
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
    return this.makeRequest('item.get', {
      output: ['itemid', 'name', 'key_', 'value_type', 'units', 'lastvalue', 'lastclock'],
      selectHosts: ['hostid', 'name'],
      ...(hostids && { hostids }),
      sortfield: 'name'
    });
  }

  async getTriggers(hostids?: string[]) {
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
    return this.makeRequest('graph.get', {
      output: ['graphid', 'name', 'width', 'height'],
      selectGraphItems: ['itemid', 'color'],
      ...(hostids && { hostids }),
      sortfield: 'name'
    });
  }

  async getTemplates() {
    return this.makeRequest('template.get', {
      output: ['templateid', 'name', 'description'],
      selectHosts: ['hostid', 'name'],
      selectItems: 'count',
      selectTriggers: 'count',
      sortfield: 'name'
    });
  }

  async getInventory(hostids?: string[]) {
    return this.makeRequest('host.get', {
      output: ['hostid', 'name'],
      selectInventory: ['hardware', 'software', 'os', 'serialno_a', 'tag'],
      ...(hostids && { hostids }),
      withInventory: true
    });
  }

  async getMaintenances() {
    return this.makeRequest('maintenance.get', {
      output: ['maintenanceid', 'name', 'description', 'active_since', 'active_till'],
      selectHosts: ['hostid', 'name'],
      selectTimeperiods: ['timeperiodid', 'timeperiod_type', 'start_date', 'period'],
      sortfield: 'name'
    });
  }

  async getServices() {
    return this.makeRequest('service.get', {
      output: ['serviceid', 'name', 'status', 'algorithm'],
      selectParents: ['serviceid', 'name'],
      selectDependencies: ['serviceid', 'name'],
      sortfield: 'name'
    });
  }

  async getUsers() {
    return this.makeRequest('user.get', {
      output: ['userid', 'username', 'name', 'surname', 'autologin', 'autologout'],
      selectUsrgrps: ['usrgrpid', 'name'],
      sortfield: 'username'
    });
  }

  async getNetworkMaps() {
    return this.makeRequest('map.get', {
      output: ['sysmapid', 'name', 'width', 'height'],
      selectShapes: ['shapeid', 'type', 'x', 'y'],
      selectLines: ['lineid', 'x1', 'y1', 'x2', 'y2'],
      selectSelements: ['selementid', 'elementtype', 'iconid_off'],
      sortfield: 'name'
    });
  }

  async getLatestData(itemids?: string[]) {
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
      await this.makeRequest('apiinfo.version', {});
      return true;
    } catch (error) {
      console.error('Zabbix connection test failed:', error);
      return false;
    }
  }
}

export const useZabbixHTTP = (integration?: any) => {
  const queryClient = useQueryClient();
  const [client, setClient] = useState<ZabbixHTTPClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create client when integration is provided
  useEffect(() => {
    console.log('🔧 ZabbixHTTP useEffect triggered:', { integration });
    
    if (integration?.base_url && (integration?.api_token || (integration?.username && integration?.password))) {
      console.log('✅ Creating Zabbix HTTP client with:', {
        url: integration.base_url,
        hasToken: !!integration.api_token,
        hasUsername: !!integration.username,
        hasPassword: !!integration.password
      });
      
      const newClient = new ZabbixHTTPClient({
        url: integration.base_url,
        username: integration.username || '',
        password: integration.password || '',
        apiToken: integration.api_token
      });
      setClient(newClient);
      
      // Test connection automatically and set connected state
      newClient.testConnection()
        .then((connected) => {
          console.log('🎯 Zabbix HTTP connection test result:', connected);
          setIsConnected(connected);
        })
        .catch((error) => {
          console.error('❌ Zabbix HTTP connection test failed:', error);
          setIsConnected(false);
        });
    } else {
      console.log('⚠️ Missing Zabbix credentials:', {
        hasBaseUrl: !!integration?.base_url,
        hasToken: !!integration?.api_token,
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

  // Get hosts
  const hosts = useQuery({
    queryKey: ['zabbix-http-hosts', integration?.id],
    queryFn: () => client?.getHosts() || [],
    enabled: !!client && isConnected,
    refetchInterval: 30000
  });

  // Get problems
  const problems = useQuery({
    queryKey: ['zabbix-http-problems', integration?.id],
    queryFn: () => client?.getProblems() || [],
    enabled: !!client && isConnected,
    refetchInterval: 10000
  });

  // Enhanced queries with caching
  const graphs = useQuery({
    queryKey: ['zabbix-http-graphs', integration?.id],
    queryFn: () => client?.getGraphs() || [],
    enabled: !!client && isConnected,
    refetchInterval: 300000, // 5 minutes
    staleTime: 240000 // 4 minutes
  });

  const templates = useQuery({
    queryKey: ['zabbix-http-templates', integration?.id],
    queryFn: () => client?.getTemplates() || [],
    enabled: !!client && isConnected,
    refetchInterval: 900000, // 15 minutes
    staleTime: 600000 // 10 minutes
  });

  const inventory = useQuery({
    queryKey: ['zabbix-http-inventory', integration?.id],
    queryFn: () => client?.getInventory() || [],
    enabled: !!client && isConnected,
    refetchInterval: 1800000, // 30 minutes
    staleTime: 1200000 // 20 minutes
  });

  const maintenances = useQuery({
    queryKey: ['zabbix-http-maintenances', integration?.id],
    queryFn: () => client?.getMaintenances() || [],
    enabled: !!client && isConnected,
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000 // 5 minutes
  });

  const services = useQuery({
    queryKey: ['zabbix-http-services', integration?.id],
    queryFn: () => client?.getServices() || [],
    enabled: !!client && isConnected,
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000 // 1 minute
  });

  const users = useQuery({
    queryKey: ['zabbix-http-users', integration?.id],
    queryFn: () => client?.getUsers() || [],
    enabled: !!client && isConnected,
    refetchInterval: 1800000, // 30 minutes
    staleTime: 1200000 // 20 minutes
  });

  const networkMaps = useQuery({
    queryKey: ['zabbix-http-maps', integration?.id],
    queryFn: () => client?.getNetworkMaps() || [],
    enabled: !!client && isConnected,
    refetchInterval: 900000, // 15 minutes
    staleTime: 600000 // 10 minutes
  });

  const latestData = useQuery({
    queryKey: ['zabbix-http-latest', integration?.id],
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
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-hosts'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-problems'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-graphs'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-templates'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-inventory'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-maintenances'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-services'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-users'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-maps'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-http-latest'] });
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