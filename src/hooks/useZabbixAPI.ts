
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

// Interface para host groups do Zabbix
export interface ZabbixHostGroup {
  groupid: string;
  name: string;
  internal: string;
}

// Interface para problemas do Zabbix - hosts agora é obrigatório
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

  // Hook para buscar hosts com dados de disponibilidade corretos
  const useHosts = (params = {}, queryOptions = {}) => {
    return useQuery({
      queryKey: ['zabbix-hosts', params],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        console.log('=== Fetching Zabbix Hosts with Availability ===');
        console.log('Integration ID:', zabbixIntegration.id);

        const result = await makeZabbixProxyRequest(
          'host.get',
          {
            output: ['hostid', 'host', 'name', 'status', 'available', 'error', 'disable_until', 'flags'],
            selectGroups: ['groupid', 'name'],
            selectInterfaces: ['interfaceid', 'ip', 'dns', 'port', 'type', 'main', 'available', 'error'],
            filter: {
              status: [0, 1] // 0 = enabled, 1 = disabled
            },
            ...params
          },
          zabbixIntegration.id
        );

        console.log('Hosts found:', result?.length || 0);
        console.log('Sample host data:', result?.[0]);
        
        return result as ZabbixHost[];
      },
      enabled: !!zabbixIntegration,
      staleTime: 0, // Sempre considerar os dados como stale para refresh forçado
      refetchInterval: 30000, // Atualizar a cada 30 segundos
      ...queryOptions
    });
  };

  // Hook para buscar grupos de hosts
  const useHostGroups = (params = {}) => {
    return useQuery({
      queryKey: ['zabbix-hostgroups', params],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        const result = await makeZabbixProxyRequest(
          'hostgroup.get',
          {
            output: ['groupid', 'name', 'internal'],
            ...params
          },
          zabbixIntegration.id
        );

        return result as ZabbixHostGroup[];
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
            ...params
          },
          zabbixIntegration.id
        );

        return result as ZabbixTrigger[];
      },
      enabled: !!zabbixIntegration,
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

  // Hook para buscar problemas ativos - organizados por host
  const useProblems = (params = {}, queryOptions = {}) => {
    return useQuery({
      queryKey: ['zabbix-problems', params],
      queryFn: async () => {
        if (!zabbixIntegration) {
          throw new Error('Integração do Zabbix não configurada');
        }

        console.log('=== Fetching Zabbix Problems ===');
        console.log('Integration ID:', zabbixIntegration.id);

        // Buscar os problemas sem o selectHosts (que é inválido na API problem.get)
        const problems = await makeZabbixProxyRequest(
          'problem.get',
          {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged', 'suppressed'],
            recent: true,
            sortfield: ['eventid'],
            sortorder: 'DESC',
            limit: 100,
            ...params
          },
          zabbixIntegration.id
        ) as Omit<ZabbixProblem, 'hosts'>[];

        console.log('Problems found:', problems.length);

        // Se temos problemas, buscar informações dos hosts relacionados
        if (problems.length > 0) {
          try {
            // Extrair os triggerids dos problemas para fazer uma consulta separada
            const triggerIds = problems.map(p => p.objectid).filter(Boolean);
            
            if (triggerIds.length > 0) {
              console.log('Fetching trigger details for host information...');
              
              // Buscar detalhes dos triggers para obter informações dos hosts
              const triggers = await makeZabbixProxyRequest(
                'trigger.get',
                {
                  output: ['triggerid'],
                  triggerids: triggerIds,
                  selectHosts: ['hostid', 'name'],
                },
                zabbixIntegration.id
              );

              console.log('Triggers with hosts found:', triggers.length);

              // Mapear os problemas com as informações dos hosts
              const problemsWithHosts: ZabbixProblem[] = problems.map(problem => {
                const trigger = triggers.find((t: any) => t.triggerid === problem.objectid);
                return {
                  ...problem,
                  hosts: trigger?.hosts || []
                };
              });

              return problemsWithHosts;
            }
          } catch (hostError) {
            console.warn('Erro ao buscar informações dos hosts:', hostError);
            // Retornar problemas sem informações dos hosts em caso de erro
          }
        }

        // Fallback: retornar problemas com array vazio de hosts
        return problems.map(problem => ({
          ...problem,
          hosts: []
        })) as ZabbixProblem[];
      },
      enabled: !!zabbixIntegration,
      staleTime: 0, // Sempre considerar os dados como stale para refresh forçado
      refetchInterval: 10000, // Atualizar a cada 10 segundos
      ...queryOptions
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
    useHostGroups,
    useTriggers,
    useItems,
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
