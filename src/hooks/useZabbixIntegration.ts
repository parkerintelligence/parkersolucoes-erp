
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from '@/hooks/use-toast';

interface ZabbixConnection {
  base_url: string;
  api_token: string;
}

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
      'Authorization': `Bearer ${token}`
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

export const useZabbixIntegration = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  
  const zabbixIntegration = integrations?.find(integration => 
    integration.type === 'zabbix' && integration.is_active
  );

  const testConnection = useMutation({
    mutationFn: async ({ base_url, api_token }: ZabbixConnection) => {
      return await makeZabbixRequest(
        base_url,
        api_token,
        'user.get',
        { output: ['userid', 'username'] }
      );
    },
    onSuccess: () => {
      toast({
        title: "Conexão bem-sucedida!",
        description: "A conexão com o Zabbix foi estabelecida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro de Conexão",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const hostsQuery = useQuery({
    queryKey: ['zabbix-hosts'],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.api_token) {
        throw new Error('Zabbix não configurado');
      }

      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        zabbixIntegration.api_token,
        'host.get',
        {
          output: ['hostid', 'host', 'name', 'status', 'available', 'error'],
          selectInterfaces: ['ip', 'port'],
          monitored_hosts: true,
        }
      ) as ZabbixHost[];
    },
    enabled: !!zabbixIntegration,
    refetchInterval: 30000,
  });

  const problemsQuery = useQuery({
    queryKey: ['zabbix-problems'],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.api_token) {
        throw new Error('Zabbix não configurado');
      }

      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        zabbixIntegration.api_token,
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
    enabled: !!zabbixIntegration,
    refetchInterval: 15000,
  });

  const itemsQuery = useQuery({
    queryKey: ['zabbix-items'],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.api_token) {
        throw new Error('Zabbix não configurado');
      }

      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        zabbixIntegration.api_token,
        'item.get',
        {
          output: ['itemid', 'name', 'key_', 'hostid', 'status', 'type', 'value_type', 'lastvalue', 'lastclock', 'units'],
          monitored: true,
          with_triggers: true,
          limit: 100,
        }
      ) as ZabbixItem[];
    },
    enabled: !!zabbixIntegration,
    refetchInterval: 60000,
  });

  const triggersQuery = useQuery({
    queryKey: ['zabbix-triggers'],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.api_token) {
        throw new Error('Zabbix não configurado');
      }

      return await makeZabbixRequest(
        zabbixIntegration.base_url,
        zabbixIntegration.api_token,
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
    enabled: !!zabbixIntegration,
    refetchInterval: 30000,
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['zabbix-hosts'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-problems'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-items'] });
    queryClient.invalidateQueries({ queryKey: ['zabbix-triggers'] });
  };

  return {
    isConfigured: !!zabbixIntegration,
    hosts: hostsQuery.data || [],
    problems: problemsQuery.data || [],
    items: itemsQuery.data || [],
    triggers: triggersQuery.data || [],
    isLoading: hostsQuery.isLoading || problemsQuery.isLoading || itemsQuery.isLoading || triggersQuery.isLoading,
    error: hostsQuery.error || problemsQuery.error || itemsQuery.error || triggersQuery.error,
    testConnection,
    refetchAll,
  };
};
