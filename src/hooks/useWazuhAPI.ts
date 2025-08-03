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
      queryFn: () => makeWazuhRequest('/agents', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  const useWazuhAlerts = (integrationId: string, limit: number = 50) => {
    return useQuery({
      queryKey: ['wazuh-alerts', integrationId, limit],
      queryFn: () => makeWazuhRequest(`/alerts?limit=${limit}&sort=-timestamp`, 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  const useWazuhStats = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-stats', integrationId],
      queryFn: async (): Promise<WazuhStats> => {
        const [agentsResponse, alertsResponse] = await Promise.all([
          makeWazuhRequest('/agents/summary/status', 'GET', integrationId),
          makeWazuhRequest('/alerts/summary', 'GET', integrationId),
        ]);

        // Process the responses to create our stats object
        const agentStats = agentsResponse?.data || {};
        const alertStats = alertsResponse?.data || {};

        return {
          total_agents: agentStats.Total || 0,
          agents_connected: agentStats.Active || 0,
          agents_disconnected: agentStats.Disconnected || 0,
          agents_never_connected: agentStats['Never connected'] || 0,
          total_alerts_today: alertStats.total_today || 0,
          critical_alerts: alertStats.critical || 0,
          high_alerts: alertStats.high || 0,
          medium_alerts: alertStats.medium || 0,
          low_alerts: alertStats.low || 0,
        };
      },
      enabled: !!integrationId,
      staleTime: 60000, // 1 minute
      retry: 2,
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
      return makeWazuhRequest('//', 'GET', integrationId);
    },
    onSuccess: () => {
      toast({
        title: "Conexão realizada com sucesso",
        description: "A conexão com o Wazuh foi estabelecida.",
      });
    },
    onError: (error: Error) => {
      console.error('Wazuh connection test failed:', error);
      toast({
        title: "Erro na conexão",
        description: error.message || "Falha ao conectar com o Wazuh.",
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