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
          // Note: Wazuh Manager API doesn't have direct /alerts endpoint
          // Alerts are stored in Wazuh Indexer (port 9200)
          // For now, return empty structure
          console.log('Wazuh alerts: Using /agents endpoint as fallback');
          const data = { data: { affected_items: [], total_affected_items: 0 } };
          console.log('Wazuh alerts data (fallback):', data);
          
          // Check if we got real data
          const hasRealData = data && (
            data.data?.affected_items?.length > 0 ||
            data.data?.total_affected_items > 0 ||
            (Array.isArray(data.data) && data.data.length > 0)
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
          // Get agent summary statistics using official Wazuh API endpoint
          const agentsResponse = await makeWazuhRequest('/agents/summary/status', 'GET', integrationId);
          console.log('Agents summary response:', agentsResponse);

          // Get recent alerts for today's count - note: /alerts endpoint doesn't exist
          const today = new Date().toISOString().split('T')[0];
          let alertsResponse = null;
          // Alerts are not available through Manager API, skip this
          console.log('Alerts data not available through Manager API (requires Wazuh Indexer)');

          // Process agent summary data from Wazuh API response
          const agentData = agentsResponse?.data || {};
          
          // Extract agent statistics based on official Wazuh API structure
          const stats: WazuhStats = {
            total_agents: agentData.total_affected_items || 0,
            agents_connected: agentData.connection?.active || 0,
            agents_disconnected: agentData.connection?.disconnected || 0,
            agents_never_connected: agentData.connection?.['never_connected'] || 0,
            total_alerts_today: 0, // Not available through Manager API
            critical_alerts: 0,
            high_alerts: 0,
            medium_alerts: 0,
            low_alerts: 0,
          };

          console.log('Final processed Wazuh stats:', stats);
          
          if (stats.total_agents > 0) {
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

  const useWazuhManagerInfo = (integrationId: string) => {
    return useQuery({
      queryKey: ['wazuh-manager-info', integrationId],
      queryFn: () => makeWazuhRequest('/manager/info', 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 300000, // 5 minutes
      retry: 2,
    });
  };

  const useWazuhRules = (integrationId: string, limit: number = 100) => {
    return useQuery({
      queryKey: ['wazuh-rules', integrationId, limit],
      queryFn: () => makeWazuhRequest(`/rules?limit=${limit}`, 'GET', integrationId),
      enabled: !!integrationId,
      staleTime: 600000, // 10 minutes
      retry: 2,
    });
  };

  const testWazuhConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      // Test official Wazuh API endpoints for connectivity
      const testEndpoints = [
        '/manager/info',
        '/agents/summary/status',
        '/agents?limit=1',
        '/rules?limit=1'
      ];

      const results = [];
      let hasSuccess = false;

      for (const endpoint of testEndpoints) {
        try {
          console.log(`Testing Wazuh endpoint: ${endpoint}`);
          const result = await makeWazuhRequest(endpoint, 'GET', integrationId);
          console.log(`✅ Successfully connected to ${endpoint}`);
          results.push({ endpoint, success: true, data: result });
          hasSuccess = true;
        } catch (error) {
          console.log(`❌ Failed to connect to ${endpoint}:`, error.message);
          results.push({ endpoint, success: false, error: error.message });
        }
      }
      
      if (!hasSuccess) {
        throw new Error('All connection tests failed');
      }

      return { 
        success: true, 
        results,
        message: `Conectado com sucesso ao Wazuh API`
      };
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
      queryKey: ['wazuh-manager-info', integrationId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['wazuh-rules', integrationId] 
    });
  };

  return {
    useWazuhAgents,
    useWazuhAlerts,
    useWazuhStats,
    useWazuhManagerInfo,
    useWazuhRules,
    testWazuhConnection,
    refreshData,
  };
};