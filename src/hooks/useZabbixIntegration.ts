
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
        'Content-Type': 'application/json-rpc',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
      
      if (response.status === 0 || response.status === 999) {
        throw new Error(`Erro de CORS: O servidor Zabbix não permite conexões do navegador. Status: ${response.status}`);
      }
      
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
      throw new Error(`Erro de conexão: Não foi possível conectar ao servidor Zabbix. Possíveis causas:
      1. CORS: O servidor não permite conexões do navegador
      2. Rede: Problemas de conectividade ou firewall
      3. URL incorreta: Verifique se a URL está correta
      4. HTTPS/HTTP: Problemas de protocolo (seu site é HTTPS, Zabbix é HTTP)`);
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
      
      // Primeiro, vamos testar se a API está acessível
      let apiUrl = base_url.replace(/\/$/, '');
      if (!apiUrl.endsWith('/api_jsonrpc.php')) {
        apiUrl = apiUrl + '/api_jsonrpc.php';
      }

      console.log('Testing API availability at:', apiUrl);

      // Teste 1: Verificar se a API responde com apiinfo.version (não requer auth)
      try {
        const versionResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json-rpc',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'apiinfo.version',
            params: {},
            id: 1,
          }),
          mode: 'cors',
        });

        console.log('Version test response status:', versionResponse.status);

        if (!versionResponse.ok) {
          const errorText = await versionResponse.text();
          console.error('Version test failed:', errorText);
          throw new Error(`API não acessível: HTTP ${versionResponse.status} - ${versionResponse.statusText}`);
        }

        const versionData = await versionResponse.json();
        console.log('API version response:', versionData);

        if (versionData.error) {
          throw new Error(`Erro na API do Zabbix: ${versionData.error.message}`);
        }

        console.log('Zabbix API version:', versionData.result);

        // Teste 2: Verificar autenticação com o token
        console.log('Testing authentication...');
        return await makeZabbixRequest(base_url, api_token, 'user.get', { 
          output: ['userid', 'username'],
          limit: 1
        });

      } catch (fetchError) {
        console.error('Connection test failed:', fetchError);
        
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          throw new Error(`Falha na conexão com ${apiUrl}:

POSSÍVEIS SOLUÇÕES:
1. CORS: Configure o servidor Zabbix para permitir conexões do navegador
2. Adicione no arquivo zabbix.conf.php: $CORS_settings = ['Access-Control-Allow-Origin' => '*'];
3. Verifique se a URL está correta e acessível
4. Considere configurar um proxy para contornar limitações de CORS
5. Verifique configurações de firewall/rede

Erro técnico: ${fetchError.message}`);
        }
        
        throw fetchError;
      }
    },
    onSuccess: (data) => {
      console.log('Connection test successful:', data);
      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado ao Zabbix com sucesso. Usuários encontrados: ${data?.length || 'N/A'}`,
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
    retry: (failureCount, error) => {
      console.log('Host query retry attempt:', failureCount, error.message);
      return failureCount < 2; // Retry apenas 2 vezes
    },
    retryDelay: 5000,
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
    retry: (failureCount, error) => {
      console.log('Problems query retry attempt:', failureCount, error.message);
      return failureCount < 2;
    },
    retryDelay: 5000,
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
    retry: (failureCount, error) => {
      console.log('Items query retry attempt:', failureCount, error.message);
      return failureCount < 2;
    },
    retryDelay: 5000,
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
    retry: (failureCount, error) => {
      console.log('Triggers query retry attempt:', failureCount, error.message);
      return failureCount < 2;
    },
    retryDelay: 5000,
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
