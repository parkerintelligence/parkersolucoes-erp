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
          const data = await makeWazuhRequest('/v1/agents?pretty=true&wait_for_complete=true', 'GET', integrationId);
          console.log('Wazuh agents data received:', data);
          
          // Process real Wazuh data structure
          if (data?.data?.affected_items) {
            return data.data.affected_items.map((agent: any) => ({
              id: agent.id,
              name: agent.name,
              ip: agent.ip,
              status: agent.status,
              version: agent.version,
              os: agent.os,
              lastKeepAlive: agent.last_keep_alive,
              group: agent.group,
            }));
          }
          
          return data;
    } catch (error) {
      console.error('Failed to fetch Wazuh agents:', error);
      
      // Show toast only for network/auth errors, not for expected API errors
      if (error.message.includes('401') || error.message.includes('403')) {
        toast({
          title: "Erro de Autenticação",
          description: "Credenciais inválidas. Verifique a configuração do Wazuh.",
          variant: "destructive",
        });
      } else if (error.message.includes('503') || error.message.includes('Cannot connect')) {
        toast({
          title: "Erro de Conectividade",
          description: "Não foi possível conectar ao servidor Wazuh. Verifique a rede.",
          variant: "destructive",
        });
      }
      
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
          const data = await makeWazuhRequest(`/v1/alerts?pretty=true&limit=${limit}&sort=-timestamp`, 'GET', integrationId);
          console.log('Wazuh alerts data received:', data);
          
          // Process real Wazuh data structure
          if (data?.data?.affected_items) {
            return data.data.affected_items.map((alert: any) => ({
              id: alert.id || alert._id,
              timestamp: alert.timestamp || alert['@timestamp'],
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
            }));
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
          const [agentsResponse, alertsResponse] = await Promise.all([
            makeWazuhRequest('/v1/agents?pretty=true', 'GET', integrationId),
            makeWazuhRequest('/v1/alerts?pretty=true&limit=1000', 'GET', integrationId),
          ]);

          // Process agents data
          const agents = agentsResponse?.data?.affected_items || [];
          const agentStats = {
            total: agents.length,
            active: agents.filter((a: any) => a.status === 'active').length,
            disconnected: agents.filter((a: any) => a.status === 'disconnected').length,
            never_connected: agents.filter((a: any) => a.status === 'never_connected').length,
          };

          // Process alerts data
          const alerts = alertsResponse?.data?.affected_items || [];
          const today = new Date().toISOString().split('T')[0];
          const todayAlerts = alerts.filter((alert: any) => {
            const alertDate = new Date(alert.timestamp || alert['@timestamp']).toISOString().split('T')[0];
            return alertDate === today;
          });

          const alertStats = {
            total_today: todayAlerts.length,
            critical: alerts.filter((a: any) => a.rule?.level >= 12).length,
            high: alerts.filter((a: any) => a.rule?.level >= 7 && a.rule?.level < 12).length,
            medium: alerts.filter((a: any) => a.rule?.level >= 4 && a.rule?.level < 7).length,
            low: alerts.filter((a: any) => a.rule?.level < 4).length,
          };

          return {
            total_agents: agentStats.total,
            agents_connected: agentStats.active,
            agents_disconnected: agentStats.disconnected,
            agents_never_connected: agentStats.never_connected,
            total_alerts_today: alertStats.total_today,
            critical_alerts: alertStats.critical,
            high_alerts: alertStats.high,
            medium_alerts: alertStats.medium,
            low_alerts: alertStats.low,
          };
        } catch (error) {
          console.error('Failed to fetch Wazuh stats:', error);
          throw error;
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
      queryFn: () => makeWazuhRequest('/v1/sca?pretty=true', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 300000, // 5 minutes
      retry: 2,
    });
  };

  const useWazuhVulnerabilities = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-vulnerabilities', integrationId],
      queryFn: () => makeWazuhRequest('/v1/vulnerability?pretty=true', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 300000, // 5 minutes
      retry: 2,
    });
  };

  const testWazuhConnection = useMutation({
    mutationFn: async (params: { endpoint: string; method: string; integrationId: string }) => {
      const { endpoint, method, integrationId } = params;
      
      console.log('Testing Wazuh connection with params:', params);
      
      // Test connectivity first
      const connectivityData = await makeWazuhRequest('/test-connectivity', 'GET', integrationId);
      
      console.log('Connectivity test data:', connectivityData);
      
      if (!connectivityData.connectivity?.success) {
        throw new Error(`Connection failed: ${connectivityData.connectivity?.error || 'Unknown error'}`);
      }
      
      // Try to fetch basic info if not just testing connectivity
      let apiData = null;
      if (endpoint !== '/test-connectivity') {
        try {
          apiData = await makeWazuhRequest('/v1?pretty=true', 'GET', integrationId);
        } catch (error) {
          console.log('API info fetch failed, but connectivity works:', error);
        }
      }
      
      return {
        success: true,
        data: apiData,
        connectivity: connectivityData,
        message: `Connection successful using ${connectivityData.connectivity.method.toUpperCase()} protocol`
      };
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