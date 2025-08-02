import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WazuhAgent {
  id: string;
  name: string;
  ip?: string;
  status: 'active' | 'disconnected' | 'never_connected';
  version?: string;
  os?: {
    platform?: string;
    name?: string;
  };
  lastKeepAlive?: string;
  group?: string[];
}

interface WazuhAlert {
  id: string;
  timestamp: string;
  rule: {
    id: number;
    level: number;
    description: string;
  };
  agent: {
    id: string;
    name: string;
  };
  location?: string;
  full_log?: string;
}

interface WazuhStats {
  total_agents: number;
  agents_connected: number;
  agents_disconnected: number;
  agents_never_connected: number;
  total_alerts_today: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
}

export const useWazuhAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const makeWazuhRequest = async (endpoint: string, method: string = 'GET', integrationId: string) => {
    console.log('Making Wazuh request:', { endpoint, method, integrationId });
    
    const { data, error } = await supabase.functions.invoke('wazuh-proxy', {
      body: {
        method,
        endpoint,
        integrationId,
      },
    });

    if (error) {
      console.error('Wazuh request error:', error);
      throw new Error(`Wazuh API error: ${error.message}`);
    }

    return data;
  };

  const useWazuhAgents = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-agents', integrationId],
      queryFn: () => makeWazuhRequest('/agents?pretty=true', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 30000, // 30 seconds
      retry: false, // Disable retry to avoid loops
      refetchInterval: false,
      refetchOnWindowFocus: false,
      throwOnError: false, // Prevent error propagation to components
    });
  };

  const useWazuhAlerts = (integrationId: string, limit: number = 50) => {
    return useQuery({
      queryKey: ['wazuh-alerts', integrationId, limit],
      queryFn: () => makeWazuhRequest(`/alerts?pretty=true&limit=${limit}&sort=-timestamp`, 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 30000, // 30 seconds
      retry: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      throwOnError: false,
    });
  };

  const useWazuhStats = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-stats', integrationId],
      queryFn: async (): Promise<WazuhStats> => {
        try {
          // Use correct Wazuh API endpoints
          const agentsResponse = await makeWazuhRequest('/agents/summary/status?pretty=true', 'GET', integrationId);
          
          // Use manager info endpoint for basic stats
          let alertStats = {};
          try {
            const managerResponse = await makeWazuhRequest('/manager/info?pretty=true', 'GET', integrationId);
            alertStats = managerResponse?.data || {};
          } catch (alertError) {
            console.warn('Could not fetch alert stats:', alertError);
          }

          // Process the responses to create our stats object
          const agentStats = agentsResponse?.data || {};

          return {
            total_agents: agentStats.Total || 0,
            agents_connected: agentStats.Active || 0,
            agents_disconnected: agentStats.Disconnected || 0,
            agents_never_connected: agentStats['Never connected'] || 0,
            total_alerts_today: 0, // Will be calculated differently
            critical_alerts: 0,
            high_alerts: 0,
            medium_alerts: 0,
            low_alerts: 0,
          };
        } catch (error) {
          console.error('Error fetching Wazuh stats:', error);
          // Return default stats to prevent component crashes
          return {
            total_agents: 0,
            agents_connected: 0,
            agents_disconnected: 0,
            agents_never_connected: 0,
            total_alerts_today: 0,
            critical_alerts: 0,
            high_alerts: 0,
            medium_alerts: 0,
            low_alerts: 0,
          };
        }
      },
      enabled: !!integrationId,
      staleTime: 60000, // 1 minute
      retry: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      throwOnError: false,
    });
  };

  const useWazuhCompliance = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-compliance', integrationId],
      queryFn: () => makeWazuhRequest('/manager/configuration?pretty=true', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 300000, // 5 minutes
      retry: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      throwOnError: false,
    });
  };

  const useWazuhVulnerabilities = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-vulnerabilities', integrationId],
      queryFn: () => makeWazuhRequest('/vulnerability?pretty=true', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 300000, // 5 minutes
      retry: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      throwOnError: false,
    });
  };

  const testWazuhConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      // Use manager info endpoint for connection test
      return makeWazuhRequest('/manager/info?pretty=true', 'GET', integrationId);
    },
    onSuccess: () => {
      toast({
        title: "Conexão realizada com sucesso",
        description: "A conexão com o Wazuh foi estabelecida.",
      });
    },
    onError: (error: Error) => {
      console.error('Wazuh connection test failed:', error);
      
      let errorMessage = "Falha ao conectar com o Wazuh.";
      if (error.message.includes('Network error')) {
        errorMessage = "Erro de rede: Verifique se o servidor Wazuh está acessível.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Timeout: O servidor Wazuh não respondeu.";
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = "Erro de autenticação: Verifique as credenciais.";
      }
      
      toast({
        title: "Erro na conexão",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const refreshData = (integrationId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['wazuh-agents', integrationId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['wazuh-alerts', integrationId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['wazuh-stats', integrationId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['wazuh-compliance', integrationId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['wazuh-vulnerabilities', integrationId] 
    });
  };

  return {
    useWazuhAgents,
    useWazuhAlerts,
    useWazuhStats,
    useWazuhCompliance,
    useWazuhVulnerabilities,
    testWazuhConnection,
    refreshData,
  };
};