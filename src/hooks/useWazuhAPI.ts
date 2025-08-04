"use client"

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
      queryFn: async () => {
        try {
          const data = await makeWazuhRequest('/agents', 'GET', integrationId);
          console.log('Wazuh agents data received:', data);
          
          // Check if we got real data from Wazuh
          const hasRealData = data && (
            data.data?.affected_items?.length > 0 ||
            data.data?.total_affected_items > 0 ||
            (Array.isArray(data.data) && data.data.length > 0) ||
            data.affected_items?.length > 0
          );
          
          console.log('Has real agents data:', hasRealData);
          
          if (!hasRealData) {
            toast({
              title: "Nenhum agente encontrado",
              description: "Wazuh conectado com sucesso, mas nenhum agente foi encontrado.",
              variant: "default",
            });
          }
          
          return data;
        } catch (error) {
          console.error('Failed to fetch Wazuh agents:', error);
          toast({
            title: "Erro ao buscar agentes",
            description: `Falha na conexão: ${error.message}`,
            variant: "destructive",
          });
          throw error;
        }
      },
      enabled: !!integrationId,
      staleTime: 30000, // 30 seconds
      retry: 1, // Reduced retry for faster fallback
    });
  };

  const useWazuhAlerts = (integrationId: string, limit: number = 50) => {
    return useQuery({
      queryKey: ['wazuh-alerts', integrationId, limit],
      queryFn: async () => {
        try {
          const data = await makeWazuhRequest(`/alerts?limit=${limit}&sort=-timestamp`, 'GET', integrationId);
          console.log('Wazuh alerts data received:', data);
          
          // Check if we got real data
          const hasRealData = data && (
            data.data?.affected_items?.length > 0 ||
            data.data?.total_affected_items > 0 ||
            (Array.isArray(data.data) && data.data.length > 0) ||
            data.affected_items?.length > 0
          );
          
          console.log('Has real alerts data:', hasRealData);
          return data;
        } catch (error) {
          console.error('Failed to fetch Wazuh alerts:', error);
          throw error;
        }
      },
      enabled: !!integrationId,
      staleTime: 30000, // 30 seconds
      retry: 1,
    });
  };

  const useWazuhStats = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-stats', integrationId],
      queryFn: async (): Promise<WazuhStats> => {
        try {
          // Try different endpoints for stats based on Wazuh API version
          const statsEndpoints = [
            '/agents/summary/status',
            '/agents/stats',
            '/agents',
            '/summary/agents'
          ];

          let agentsResponse = null;
          let alertsResponse = null;

          // Try to get agent statistics from different endpoints
          for (const endpoint of statsEndpoints) {
            try {
              agentsResponse = await makeWazuhRequest(endpoint, 'GET', integrationId);
              console.log(`Successfully got agents data from ${endpoint}:`, agentsResponse);
              break;
            } catch (error) {
              console.log(`Failed to get data from ${endpoint}:`, error.message);
              continue;
            }
          }

          // Try to get alerts if agents endpoint worked
          if (agentsResponse) {
            try {
              alertsResponse = await makeWazuhRequest('/alerts', 'GET', integrationId);
              console.log('Got alerts response:', alertsResponse);
            } catch (alertsError) {
              console.log('Could not get alerts, continuing with agents only:', alertsError.message);
            }
          }

          // Process the responses to create our stats object
          let agentStats: any = {};
          let alertStats: any = {};

          if (agentsResponse) {
            // Handle different response structures
            agentStats = agentsResponse?.data?.affected_items?.[0] || 
                        agentsResponse?.data || 
                        agentsResponse?.affected_items?.[0] || 
                        agentsResponse || {};
          }

          if (alertsResponse) {
            alertStats = alertsResponse?.data?.affected_items?.[0] || 
                        alertsResponse?.data || 
                        alertsResponse?.affected_items?.[0] || 
                        alertsResponse || {};
          }

          console.log('Processed agent stats:', agentStats);
          console.log('Processed alert stats:', alertStats);

          // Create stats object with fallback values
          const stats: WazuhStats = {
            total_agents: agentStats?.total || agentStats?.Total || agentStats?.total_agents || 0,
            agents_connected: agentStats?.active || agentStats?.Active || agentStats?.connected || 0,
            agents_disconnected: agentStats?.disconnected || agentStats?.Disconnected || 0,
            agents_never_connected: agentStats?.never_connected || agentStats?.['Never connected'] || 0,
            total_alerts_today: alertStats?.total_today || alertStats?.total || 0,
            critical_alerts: alertStats?.critical || 0,
            high_alerts: alertStats?.high || 0,
            medium_alerts: alertStats?.medium || 0,
            low_alerts: alertStats?.low || 0,
          };

          console.log('Final processed Wazuh stats:', stats);
          
          // Check if we have any real data
          const hasAnyData = stats.total_agents > 0 || stats.total_alerts_today > 0;
          if (hasAnyData) {
            toast({
              title: "Dados carregados com sucesso",
              description: `${stats.total_agents} agentes encontrados`,
              variant: "default",
            });
          }

          return stats;
        } catch (error) {
          console.error('Failed to fetch Wazuh stats:', error);
          toast({
            title: "Erro ao buscar estatísticas",
            description: `Falha na conexão: ${error.message}`,
            variant: "destructive",
          });
          throw error;
        }
      },
      enabled: !!integrationId,
      staleTime: 60000, // 1 minute
      retry: 1,
    });
  };

  const useWazuhCompliance = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-compliance', integrationId],
      queryFn: () => makeWazuhRequest('/compliance', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 300000, // 5 minutes
      retry: 2,
    });
  };

  const useWazuhVulnerabilities = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-vulnerabilities', integrationId],
      queryFn: () => makeWazuhRequest('/vulnerability', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 300000, // 5 minutes
      retry: 2,
    });
  };

  const testWazuhConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      // Test multiple endpoints to verify connectivity
      const testEndpoints = [
        '/manager/info',
        '/manager/status', 
        '/',
        '/agents',
        '/security/user/authenticate/run_as'
      ];

      let lastError;
      for (const endpoint of testEndpoints) {
        try {
          console.log(`Testing Wazuh endpoint: ${endpoint}`);
          const result = await makeWazuhRequest(endpoint, 'GET', integrationId);
          console.log(`Successfully connected to ${endpoint}:`, result);
          return { 
            success: true, 
            endpoint,
            data: result,
            message: `Conectado com sucesso via ${endpoint}`
          };
        } catch (error) {
          console.log(`Failed to connect to ${endpoint}:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      // If all endpoints failed, throw the last error
      throw lastError || new Error('All connection attempts failed');
    },
    onSuccess: (data) => {
      toast({
        title: "Conexão realizada com sucesso",
        description: data.message || "A conexão com o Wazuh foi estabelecida.",
      });
    },
    onError: (error: Error) => {
      console.error('Wazuh connection test failed:', error);
      toast({
        title: "Erro na conexão",
        description: error.message || "Falha ao conectar com o Wazuh. Verifique as configurações.",
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