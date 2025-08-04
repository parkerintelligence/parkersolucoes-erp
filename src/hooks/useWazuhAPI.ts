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
          
          // Process the real Wazuh agents data
          if (data?.data?.affected_items) {
            return {
              ...data,
              data: {
                ...data.data,
                affected_items: data.data.affected_items.map((agent: any) => ({
                  id: agent.id,
                  name: agent.name,
                  ip: agent.ip,
                  status: agent.status, // active, disconnected, never_connected
                  version: agent.version,
                  os: agent.os,
                  lastKeepAlive: agent.lastKeepAlive,
                  group: agent.group,
                }))
              }
            };
          }
          
          return data;
        } catch (error) {
          console.error('Failed to fetch Wazuh agents:', error);
          toast({
            title: "Erro ao buscar agentes",
            description: "Usando dados de exemplo. Verifique a conexão com Wazuh.",
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
          
          // Process real Wazuh alerts data
          if (data?.data?.affected_items) {
            return {
              ...data,
              data: {
                ...data.data,
                affected_items: data.data.affected_items.map((alert: any) => ({
                  id: alert.id || `${alert.agent?.id}-${alert.timestamp}`,
                  timestamp: alert.timestamp,
                  rule: {
                    id: alert.rule?.id,
                    level: alert.rule?.level,
                    description: alert.rule?.description,
                  },
                  agent: {
                    id: alert.agent?.id,
                    name: alert.agent?.name,
                  },
                  location: alert.location,
                  full_log: alert.full_log,
                }))
              }
            };
          }
          
          return data;
        } catch (error) {
          console.error('Failed to fetch Wazuh alerts:', error);
          throw error;
        }
      },
      enabled: !!integrationId,
      staleTime: 30000, // 30 seconds
      retry: 2,
    });
  };

  const useWazuhStats = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-stats', integrationId],
      queryFn: async (): Promise<WazuhStats> => {
        try {
          // Use real Wazuh API endpoints
          const [agentsResponse, alertsResponse] = await Promise.all([
            makeWazuhRequest('/agents', 'GET', integrationId),
            makeWazuhRequest('/alerts?limit=1000', 'GET', integrationId),
          ]);

          console.log('Raw agents response:', agentsResponse);
          console.log('Raw alerts response:', alertsResponse);

          // Process agents data - Wazuh returns agents in data.affected_items
          const agents = agentsResponse?.data?.affected_items || [];
          const total_agents = agents.length;
          const agents_connected = agents.filter((agent: any) => agent.status === 'active').length;
          const agents_disconnected = agents.filter((agent: any) => agent.status === 'disconnected').length;
          const agents_never_connected = agents.filter((agent: any) => agent.status === 'never_connected').length;

          // Process alerts data - Wazuh returns alerts in data.affected_items
          const alerts = alertsResponse?.data?.affected_items || [];
          const today = new Date().toISOString().split('T')[0];
          const alertsToday = alerts.filter((alert: any) => 
            alert.timestamp && alert.timestamp.startsWith(today)
          );
          
          const critical_alerts = alertsToday.filter((alert: any) => alert.rule?.level >= 12).length;
          const high_alerts = alertsToday.filter((alert: any) => alert.rule?.level >= 7 && alert.rule?.level < 12).length;
          const medium_alerts = alertsToday.filter((alert: any) => alert.rule?.level >= 4 && alert.rule?.level < 7).length;
          const low_alerts = alertsToday.filter((alert: any) => alert.rule?.level < 4).length;

          const stats = {
            total_agents,
            agents_connected,
            agents_disconnected,
            agents_never_connected,
            total_alerts_today: alertsToday.length,
            critical_alerts,
            high_alerts,
            medium_alerts,
            low_alerts,
          };

          console.log('Processed Wazuh stats:', stats);
          return stats;
        } catch (error) {
          console.error('Failed to fetch Wazuh stats:', error);
          // Return fallback stats
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
      return makeWazuhRequest('/', 'GET', integrationId);
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