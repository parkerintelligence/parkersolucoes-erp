import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useZabbixProxy } from '@/hooks/useZabbixProxy';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

// Interface para hosts do Zabbix
export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: string;
  available: string;
  error: string;
  groups: Array<{
    groupid: string;
    name: string;
  }>;
  interfaces: Array<{
    interfaceid: string;
    ip: string;
    dns: string;
    port: string;
    type: string;
    main: string;
  }>;
}

// Interface para itens do Zabbix
export interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  hostid: string;
  status: string;
  value_type: string;
  units: string;
  lastvalue: string;
  lastclock: string;
  trends: string;
  history: string;
}

// Interface para triggers do Zabbix
export interface ZabbixTrigger {
  triggerid: string;
  description: string;
  status: string;
  priority: string;
  state: string;
  value: string;
  lastchange: string;
  hosts: Array<{
    hostid: string;
    name: string;
  }>;
}

// Interface para problemas do Zabbix
export interface ZabbixProblem {
  eventid: string;
  objectid: string;
  name: string;
  severity: string;
  clock: string;
  acknowledged: string;
  suppressed: string;
  hosts: Array<{
    hostid: string;
    name: string;
  }>;
}

export const useZabbixAPI = () => {
  const { makeZabbixProxyRequest } = useZabbixProxy();
  const { data: integrations = [] } = useIntegrations();
  const queryClient = useQueryClient();

  const zabbixIntegration = integrations.find(int => 
    int.type === 'zabbix' && int.is_active
  );

  // Hook para buscar hosts
  const useHosts = (params = {}) => {
    return useQuery({
      queryKey: ['zabbix-hosts', params],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'host.get',
          {
            output: ['hostid', 'host', 'name', 'status', 'available', 'error'],
            selectGroups: ['groupid', 'name'],
            selectInterfaces: ['interfaceid', 'ip', 'dns', 'port', 'type', 'main'],
            ...params
          },
          zabbixIntegration.id
        );

        return result as ZabbixHost[];
      },
      enabled: !!zabbixIntegration,
      refetchInterval: 30000, // Atualizar a cada 30 segundos
    });
  };

  // Hook para buscar itens
  const useItems = (hostids?: string[], params = {}) => {
    return useQuery({
      queryKey: ['zabbix-items', hostids, params],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'item.get',
          {
            output: ['itemid', 'name', 'key_', 'hostid', 'status', 'value_type', 'units', 'lastvalue', 'lastclock', 'trends', 'history'],
            ...(hostids && { hostids }),
            ...params
          },
          zabbixIntegration.id
        );

        return result as ZabbixItem[];
      },
      enabled: !!zabbixIntegration,
    });
  };

  // Hook para buscar triggers
  const useTriggers = (params = {}) => {
    return useQuery({
      queryKey: ['zabbix-triggers', params],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'trigger.get',
          {
            output: ['triggerid', 'description', 'status', 'priority', 'state', 'value', 'lastchange'],
            selectHosts: ['hostid', 'name'],
            expandDescription: true,
            ...params
          },
          zabbixIntegration.id
        );

        return result as ZabbixTrigger[];
      },
      enabled: !!zabbixIntegration,
      refetchInterval: 15000, // Atualizar a cada 15 segundos
    });
  };

  // Hook para buscar problemas ativos
  const useProblems = (params = {}) => {
    return useQuery({
      queryKey: ['zabbix-problems', params],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'problem.get',
          {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged', 'suppressed'],
            selectHosts: ['hostid', 'name'],
            recent: true,
            sortfield: ['eventid'],
            sortorder: 'DESC',
            ...params
          },
          zabbixIntegration.id
        );

        return result as ZabbixProblem[];
      },
      enabled: !!zabbixIntegration,
      refetchInterval: 10000, // Atualizar a cada 10 segundos
    });
  };

  // Hook para buscar dados históricos de um item
  const useHistory = (itemid: string, timeFrom?: number, timeTill?: number) => {
    return useQuery({
      queryKey: ['zabbix-history', itemid, timeFrom, timeTill],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'history.get',
          {
            output: 'extend',
            itemids: [itemid],
            sortfield: 'clock',
            sortorder: 'DESC',
            ...(timeFrom && { time_from: timeFrom }),
            ...(timeTill && { time_till: timeTill }),
            limit: 100
          },
          zabbixIntegration.id
        );

        return result;
      },
      enabled: !!zabbixIntegration && !!itemid,
    });
  };

  // Mutation para reconhecer um problema
  const useAcknowledgeProblem = () => {
    return useMutation({
      mutationFn: async ({ eventids, message }: { eventids: string[], message: string }) => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'event.acknowledge',
          {
            eventids,
            action: 1, // Acknowledge
            message
          },
          zabbixIntegration.id
        );

        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['zabbix-problems'] });
        toast({
          title: "Problema reconhecido",
          description: "O problema foi reconhecido com sucesso.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao reconhecer problema",
          description: error.message || "Ocorreu um erro ao reconhecer o problema.",
          variant: "destructive",
        });
      },
    });
  };

  // Mutation para habilitar/desabilitar host
  const useToggleHost = () => {
    return useMutation({
      mutationFn: async ({ hostid, status }: { hostid: string, status: number }) => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'host.update',
          {
            hostid,
            status
          },
          zabbixIntegration.id
        );

        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['zabbix-hosts'] });
        toast({
          title: "Host atualizado",
          description: "O status do host foi atualizado com sucesso.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao atualizar host",
          description: error.message || "Ocorreu um erro ao atualizar o status do host.",
          variant: "destructive",
        });
      },
    });
  };

  return {
    // Queries
    useHosts,
    useItems,
    useTriggers,
    useProblems,
    useHistory,
    
    // Mutations
    useAcknowledgeProblem,
    useToggleHost,
    
    // Estado da integração
    isConfigured: !!zabbixIntegration,
    integration: zabbixIntegration,
  };
};