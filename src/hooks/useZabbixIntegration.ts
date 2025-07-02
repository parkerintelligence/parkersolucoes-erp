import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { useZabbixDirect } from './useZabbixDirect';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

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
  
  // Use the new direct client
  const zabbixDirect = useZabbixDirect(zabbixIntegration?.id);
  
  const [errorDialog, setErrorDialog] = useState<{isOpen: boolean; error: string; details?: string}>({
    isOpen: false,
    error: '',
    details: ''
  });

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
      
      if (!zabbixDirect.client) {
        throw new Error('Cliente Zabbix não inicializado');
      }
      
      try {
        const result = await zabbixDirect.client.testConnection();
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
        description: "Conectado ao Zabbix com sucesso",
      });
    },
    onError: (error: Error) => {
      handleError(error, 'Teste de Conexão');
    },
  });

  // Transform data from direct client to match existing interfaces
  const transformHosts = (hosts: any[]): ZabbixHost[] => {
    return hosts.map(host => ({
      hostid: host.hostid,
      host: host.host || host.name,
      name: host.name,
      status: host.status?.toString() || '0',
      available: host.available?.toString() || '1',
      error: host.error || '',
      interfaces: host.interfaces || []
    }));
  };

  const transformProblems = (problems: any[]): ZabbixProblem[] => {
    return problems.map(problem => ({
      eventid: problem.eventid,
      objectid: problem.objectid,
      name: problem.name,
      severity: problem.severity?.toString() || '0',
      clock: problem.clock?.toString() || '0',
      r_clock: problem.r_clock?.toString() || '0',
      acknowledged: problem.acknowledged?.toString() || '0',
      hosts: problem.hosts || []
    }));
  };

  return {
    isConfigured: !!zabbixIntegration,
    hosts: transformHosts(zabbixDirect.hosts || []),
    problems: transformProblems(zabbixDirect.problems || []),
    items: [], // Will be implemented with direct client methods
    triggers: [], // Will be implemented with direct client methods
    isLoading: zabbixDirect.isLoading,
    error: zabbixDirect.error,
    testConnection,
    refetchAll: zabbixDirect.refetchAll,
    errorDialog,
    closeErrorDialog: () => setErrorDialog(prev => ({ ...prev, isOpen: false })),
  };
};