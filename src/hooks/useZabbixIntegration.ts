
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

const makeZabbixRequest = async (baseUrl: string, token: string, method: string, params: any) => {
  console.log('Making Zabbix request:', { baseUrl, method, params });
  
  // Limpar URL e garantir que termine com api_jsonrpc.php
  let apiUrl = baseUrl.replace(/\/$/, '');
  if (!apiUrl.endsWith('/api_jsonrpc.php')) {
    apiUrl = apiUrl + '/api_jsonrpc.php';
  }
  
  console.log('Final API URL:', apiUrl);

  const requestBody = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    auth: token,
    id: 1,
  };

  console.log('Request body:', { ...requestBody, auth: token.substring(0, 10) + '...' });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      // Permitir conexões HTTP mesmo de HTTPS
      mode: 'cors',
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP error details:', {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText
      });
      
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}. Detalhes: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.error) {
      console.error('Zabbix API error:', data.error);
      throw new Error(`Erro da API Zabbix: ${data.error.message || 'Erro desconhecido'} (Código: ${data.error.code || 'N/A'})`);
    }

    return data.result;
  } catch (error) {
    console.error('Fetch error:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Erro de conexão detectado.

Possíveis soluções para conectar HTTP de HTTPS:

1. CONFIGURAR PROXY REVERSO:
   - Use nginx ou apache para rotear HTTPS → HTTP
   - Configure SSL/TLS no servidor Zabbix

2. USAR EXTENSÃO DO NAVEGADOR:
   - CORS Unblock ou similar
   - Desabilitar CORS temporariamente

3. CONFIGURAR SERVIDOR WEB:
   - Adicionar headers CORS no servidor
   - Permitir origem ${window.location.origin}

4. USAR HTTPS NO ZABBIX:
   - Configure certificado SSL no Zabbix
   - Altere URL para HTTPS

Erro técnico: ${error.message}`);
    }
    
    throw error;
  }
};

export const useZabbixIntegration = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  
  const zabbixIntegration = integrations?.find(integration => 
    integration.type === 'zabbix' && integration.is_active
  );

  console.log('Zabbix integration found:', zabbixIntegration);

  const testConnection = useMutation({
    mutationFn: async ({ base_url, api_token }: ZabbixConnection) => {
      console.log('Testing Zabbix connection...');
      console.log('Base URL:', base_url);
      console.log('Token length:', api_token.length);
      
      try {
        const result = await makeZabbixRequest(base_url, api_token, 'user.get', { 
          output: ['userid', 'username'],
          limit: 1
        });
        
        console.log('Connection test successful:', result);
        return result;
      } catch (error) {
        console.error('Connection test failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Connection test successful:', data);
      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado ao Zabbix com sucesso. Usuários encontrados: ${data?.length || 0}`,
      });
    },
    onError: (error: Error) => {
      console.error('Connection test failed:', error);
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

      console.log('Fetching hosts...');
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
    retry: false,
    staleTime: 10000,
  });

  const problemsQuery = useQuery({
    queryKey: ['zabbix-problems'],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.api_token) {
        throw new Error('Zabbix não configurado');
      }

      console.log('Fetching problems...');
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
    retry: false,
    staleTime: 5000,
  });

  const itemsQuery = useQuery({
    queryKey: ['zabbix-items'],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.api_token) {
        throw new Error('Zabbix não configurado');
      }

      console.log('Fetching items...');
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
    retry: false,
    staleTime: 30000,
  });

  const triggersQuery = useQuery({
    queryKey: ['zabbix-triggers'],
    queryFn: async () => {
      if (!zabbixIntegration?.base_url || !zabbixIntegration?.api_token) {
        throw new Error('Zabbix não configurado');
      }

      console.log('Fetching triggers...');
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
    retry: false,
    staleTime: 15000,
  });

  const refetchAll = () => {
    console.log('Refetching all Zabbix data...');
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
