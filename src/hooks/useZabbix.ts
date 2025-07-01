
import { useQuery } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';

export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: string;
  available: string;
  error: string;
  interfaces: Array<{
    ip: string;
    port: string;
  }>;
}

export interface ZabbixProblem {
  eventid: string;
  objectid: string;
  name: string;
  severity: string;
  clock: string;
  r_clock: string;
  acknowledged: string;
  hosts: Array<{
    hostid: string;
    name: string;
  }>;
}

export interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  hostid: string;
  status: string;
  type: string;
  value_type: string;
  lastvalue: string;
  lastclock: string;
  units: string;
}

export interface ZabbixTrigger {
  triggerid: string;
  description: string;
  status: string;
  value: string;
  priority: string;
  lastchange: string;
  hosts: Array<{
    hostid: string;
    name: string;
  }>;
}

const makeZabbixRequest = async (url: string, token: string, method: string, params: any) => {
  const response = await fetch(`${url}/api_jsonrpc.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: params,
      auth: token,
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'Zabbix API error');
  }

  return data.result;
};

const authenticateZabbix = async (url: string, username: string, password: string) => {
  const response = await fetch(`${url}/api_jsonrpc.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'user.login',
      params: {
        user: username,
        password: password,
      },
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'Authentication failed');
  }

  return data.result;
};

export const useZabbix = () => {
  const { data: integrations } = useIntegrations();
  
  const zabbixIntegration = integrations?.find(integration => 
    integration.type === 'zabbix' && integration.is_active
  );

  const authQuery = useQuery({
    queryKey: ['zabbix-auth', zabbixIntegration?.id],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.username || !zabbixIntegration?.password) {
        throw new Error('Zabbix integration not configured');
      }
      
      console.log('Authenticating with Zabbix...');
      return await authenticateZabbix(
        zabbixIntegration.base_url,
        zabbixIntegration.username,
        zabbixIntegration.password
      );
    },
    enabled: !!zabbixIntegration,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const hostsQuery = useQuery({
    queryKey: ['zabbix-hosts'],
    queryFn: async () => {
      if (!authQuery.data || !zabbixIntegration?.base_url) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching Zabbix hosts...');
      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        authQuery.data,
        'host.get',
        {
          output: ['hostid', 'host', 'name', 'status', 'available', 'error'],
          selectInterfaces: ['ip', 'port'],
          monitored_hosts: true,
        }
      ) as ZabbixHost[];
    },
    enabled: !!authQuery.data && !!zabbixIntegration,
    refetchInterval: 30000, // 30 seconds
  });

  const problemsQuery = useQuery({
    queryKey: ['zabbix-problems'],
    queryFn: async () => {
      if (!authQuery.data || !zabbixIntegration?.base_url) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching Zabbix problems...');
      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        authQuery.data,
        'problem.get',
        {
          output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'r_clock', 'acknowledged'],
          selectHosts: ['hostid', 'name'],
          recent: true,
          sortfield: 'clock',
          sortorder: 'DESC',
          limit: 50,
        }
      ) as ZabbixProblem[];
    },
    enabled: !!authQuery.data && !!zabbixIntegration,
    refetchInterval: 15000, // 15 seconds
  });

  const itemsQuery = useQuery({
    queryKey: ['zabbix-items'],
    queryFn: async () => {
      if (!authQuery.data || !zabbixIntegration?.base_url) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching Zabbix items...');
      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        authQuery.data,
        'item.get',
        {
          output: ['itemid', 'name', 'key_', 'hostid', 'status', 'type', 'value_type', 'lastvalue', 'lastclock', 'units'],
          monitored: true,
          with_triggers: true,
          limit: 100,
        }
      ) as ZabbixItem[];
    },
    enabled: !!authQuery.data && !!zabbixIntegration,
    refetchInterval: 60000, // 1 minute
  });

  const triggersQuery = useQuery({
    queryKey: ['zabbix-triggers'],
    queryFn: async () => {
      if (!authQuery.data || !zabbixIntegration?.base_url) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching Zabbix triggers...');
      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        authQuery.data,
        'trigger.get',
        {
          output: ['triggerid', 'description', 'status', 'value', 'priority', 'lastchange'],
          selectHosts: ['hostid', 'name'],
          monitored: true,
          active: true,
          limit: 100,
        }
      ) as ZabbixTrigger[];
    },
    enabled: !!authQuery.data && !!zabbixIntegration,
    refetchInterval: 30000, // 30 seconds
  });

  return {
    isConfigured: !!zabbixIntegration,
    isAuthenticated: !!authQuery.data,
    authError: authQuery.error,
    hosts: hostsQuery.data || [],
    problems: problemsQuery.data || [],
    items: itemsQuery.data || [],
    triggers: triggersQuery.data || [],
    isLoading: authQuery.isLoading || hostsQuery.isLoading || problemsQuery.isLoading,
    error: authQuery.error || hostsQuery.error || problemsQuery.error,
    refetch: () => {
      authQuery.refetch();
      hostsQuery.refetch();
      problemsQuery.refetch();
      itemsQuery.refetch();
      triggersQuery.refetch();
    },
  };
};
