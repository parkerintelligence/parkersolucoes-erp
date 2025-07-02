
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { useZabbixDirect } from './useZabbixDirect';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ZabbixErrorDialog } from '@/components/ZabbixErrorDialog';

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

export const useZabbixIntegration = () => {
  const { data: integrations } = useIntegrations();
  const zabbixIntegration = integrations?.find(integration => 
    integration.type === 'zabbix' && integration.is_active
  );
  const zabbixDirect = useZabbixDirect(zabbixIntegration?.id);
  const queryClient = useQueryClient();
  const [errorDialog, setErrorDialog] = useState<{isOpen: boolean; error: string; details?: string}>({
    isOpen: false,
    error: '',
    details: ''
  });
  
  const zabbixIntegration = integrations?.find(integration => 
    integration.type === 'zabbix' && integration.is_active
  );

  console.log('Zabbix integration found:', zabbixIntegration);

  const handleError = (error: any, context: string) => {
    console.error(`${context}:`, error);
    
    const errorMessage = error.message || 'Erro desconhecido';
    const errorDetails = error.stack || JSON.stringify(error, null, 2);
    
    setErrorDialog({
      isOpen: true,
      error: `${context}: ${errorMessage}`,
      details: errorDetails
    });
    
    toast({
      title: "Erro de Conexão Zabbix",
      description: errorMessage,
      variant: "destructive"
    });
  };

  const testConnection = useMutation({
    mutationFn: async ({ base_url, api_token }: ZabbixConnection) => {
      console.log('Testando conexão Zabbix...');
      console.log('Base URL:', base_url);
      console.log('Token length:', api_token.length);
      
      if (!zabbixIntegration) {
        throw new Error('Integração Zabbix não encontrada');
      }
      
      try {
        const result = await makeZabbixProxyRequest(
          'user.get',
          { 
            output: ['userid', 'username'],
            limit: 1 
          },
          zabbixIntegration.id
        );
        
        console.log('Teste de conexão bem-sucedido:', result);
        return result;
      } catch (error) {
        console.error('Teste de conexão falhou:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Conexão testada com sucesso:', data);
      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado ao Zabbix com sucesso. Usuários encontrados: ${Array.isArray(data) ? data.length : 0}`,
      });
    },
    onError: (error: Error) => {
      handleError(error, 'Teste de Conexão');
    },
  });

  const hostsQuery = useQuery({
    queryKey: ['zabbix-hosts'],
    queryFn: async () => {
      if (!zabbixIntegration) {
        throw new Error('Zabbix não configurado');
      }

      console.log('Buscando hosts...');
      return await makeZabbixProxyRequest(
        'host.get',
        {
          output: ['hostid', 'host', 'name', 'status', 'available', 'error'],
          selectInterfaces: ['ip', 'port'],
          filter: {
            status: 0
          }
        },
        zabbixIntegration.id
      ) as ZabbixHost[];
    },
    enabled: !!zabbixIntegration,
    refetchInterval: 30000,
    retry: 2,
    staleTime: 10000,
  });

  const problemsQuery = useQuery({
    queryKey: ['zabbix-problems'],
    queryFn: async () => {
      if (!zabbixIntegration) {
        throw new Error('Zabbix não configurado');
      }

      console.log('Buscando problemas...');
      return await makeZabbixProxyRequest(
        'problem.get',
        {
          output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'r_clock', 'acknowledged'],
          selectHosts: ['hostid', 'name'],
          sortfield: ['clock'],
          sortorder: 'DESC',
          limit: 50
        },
        zabbixIntegration.id
      ) as ZabbixProblem[];
    },
    enabled: !!zabbixIntegration,
    refetchInterval: 15000,
    retry: 2,
    staleTime: 5000,
  });

  const itemsQuery = useQuery({
    queryKey: ['zabbix-items'],
    queryFn: async () => {
      if (!zabbixIntegration) {
        throw new Error('Zabbix não configurado');
      }

      console.log('Buscando itens...');
      return await makeZabbixProxyRequest(
        'item.get',
        {
          output: ['itemid', 'name', 'key_', 'hostid', 'status', 'type', 'value_type', 'lastvalue', 'lastclock', 'units'],
          filter: {
            status: 0
          },
          webitems: true,
          limit: 100
        },
        zabbixIntegration.id
      ) as ZabbixItem[];
    },
    enabled: !!zabbixIntegration,
    refetchInterval: 60000,
    retry: 2,
    staleTime: 30000,
  });

  const triggersQuery = useQuery({
    queryKey: ['zabbix-triggers'],
    queryFn: async () => {
      if (!zabbixIntegration) {
        throw new Error('Zabbix não configurado');
      }

      console.log('Buscando triggers...');
      return await makeZabbixProxyRequest(
        'trigger.get',
        {
          output: ['triggerid', 'description', 'status', 'value', 'priority', 'lastchange'],
          selectHosts: ['hostid', 'name'],
          filter: {
            status: 0
          },
          limit: 100
        },
        zabbixIntegration.id
      ) as ZabbixTrigger[];
    },
    enabled: !!zabbixIntegration,
    refetchInterval: 30000,
    retry: 2,
    staleTime: 15000,
  });

  // Handle errors using useEffect instead of onError
  useEffect(() => {
    if (hostsQuery.error) {
      handleError(hostsQuery.error, 'Busca de Hosts');
    }
  }, [hostsQuery.error]);

  useEffect(() => {
    if (problemsQuery.error) {
      handleError(problemsQuery.error, 'Busca de Problemas');
    }
  }, [problemsQuery.error]);

  useEffect(() => {
    if (itemsQuery.error) {
      handleError(itemsQuery.error, 'Busca de Itens');
    }
  }, [itemsQuery.error]);

  useEffect(() => {
    if (triggersQuery.error) {
      handleError(triggersQuery.error, 'Busca de Triggers');
    }
  }, [triggersQuery.error]);

  const refetchAll = () => {
    console.log('Recarregando todos os dados do Zabbix...');
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
    errorDialog,
    closeErrorDialog: () => setErrorDialog(prev => ({ ...prev, isOpen: false })),
  };
};
