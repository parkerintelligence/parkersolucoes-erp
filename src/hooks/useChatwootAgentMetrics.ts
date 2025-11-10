import { useQuery } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { ChatwootAgent } from './useChatwootAgents';

const makeChatwootRequest = async (integrationId: string, endpoint: string, options: { method?: string; body?: any } = {}) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data: { session } } = await supabase.auth.refreshSession();
  if (!session) throw new Error('Não autenticado');

  const response = await fetch(
    'https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/chatwoot-proxy',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        integrationId,
        endpoint,
        method: options.method || 'GET',
        body: options.body,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Erro ${response.status}`);
  }

  return response.json();
};

export interface AgentMetrics {
  agentId: number;
  agentName: string;
  agentEmail: string;
  avatarUrl?: string;
  totalConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  pendingConversations: number;
  resolutionRate: number;
  averageResponseTime: number | null;
  conversationsByStatus: {
    open: number;
    pending: number;
    resolved: number;
  };
}

export const useChatwootAgentMetrics = () => {
  const { data: integrations } = useIntegrations();
  
  const chatwootIntegration = integrations?.find(
    integration => integration.type === 'chatwoot' && integration.is_active
  );

  return useQuery({
    queryKey: ['chatwoot-agent-metrics', chatwootIntegration?.id],
    queryFn: async () => {
      if (!chatwootIntegration?.id) return [];

      console.log('🔄 Calculando métricas de agentes...');

      // 1. Buscar agentes
      const profile = await makeChatwootRequest(chatwootIntegration.id, '/profile');
      const accountId = profile.account_id;
      
      const agents = await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/agents`
      );

      console.log(`📊 ${agents.length} agentes encontrados`);

      // 2. Buscar todas as conversas
      const conversations = await makeChatwootRequest(
        chatwootIntegration.id,
        `/accounts/${accountId}/conversations?status=all`
      );

      const conversationsData = Array.isArray(conversations)
        ? conversations
        : (conversations.data?.payload || conversations.payload || []);

      console.log(`💬 ${conversationsData.length} conversas encontradas`);

      // 3. Inicializar métricas para cada agente
      const metricsMap = new Map<number, AgentMetrics>();

      agents.forEach((agent: ChatwootAgent) => {
        metricsMap.set(agent.id, {
          agentId: agent.id,
          agentName: agent.name,
          agentEmail: agent.email,
          avatarUrl: agent.avatar_url,
          totalConversations: 0,
          activeConversations: 0,
          resolvedConversations: 0,
          pendingConversations: 0,
          resolutionRate: 0,
          averageResponseTime: null,
          conversationsByStatus: {
            open: 0,
            pending: 0,
            resolved: 0,
          },
        });
      });

      // 4. Calcular métricas por conversa
      const responseTimes: { [agentId: number]: number[] } = {};

      for (const conv of conversationsData) {
        const assigneeId = conv.assignee?.id || conv.meta?.assignee?.id;
        if (!assigneeId) continue;

        const metrics = metricsMap.get(assigneeId);
        if (!metrics) continue;

        // Contar conversas
        metrics.totalConversations++;
        
        const status = conv.status || 'open';
        
        if (status === 'open' || status === 'pending') {
          metrics.activeConversations++;
        }
        
        if (status === 'resolved') {
          metrics.resolvedConversations++;
        }
        
        if (status === 'pending') {
          metrics.pendingConversations++;
        }

        metrics.conversationsByStatus[status as 'open' | 'pending' | 'resolved'] = 
          (metrics.conversationsByStatus[status as 'open' | 'pending' | 'resolved'] || 0) + 1;

        // Calcular tempo de resposta (apenas se mensagens estiverem disponíveis)
        if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 1) {
          const messages = [...conv.messages].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          // Primeira mensagem do cliente (incoming = 0)
          const firstClientMessage = messages.find(m => m.message_type === 0);
          
          if (firstClientMessage) {
            // Primeira resposta do agente após mensagem do cliente
            const firstAgentResponse = messages.find(
              m => m.message_type === 1 && 
                   new Date(m.created_at).getTime() > new Date(firstClientMessage.created_at).getTime()
            );

            if (firstAgentResponse) {
              const responseTimeMinutes = 
                (new Date(firstAgentResponse.created_at).getTime() - 
                 new Date(firstClientMessage.created_at).getTime()) / 1000 / 60;

              if (!responseTimes[assigneeId]) {
                responseTimes[assigneeId] = [];
              }
              responseTimes[assigneeId].push(responseTimeMinutes);
            }
          }
        }
      }

      // 5. Calcular médias e taxas finais
      metricsMap.forEach((metrics, agentId) => {
        // Taxa de resolução
        if (metrics.totalConversations > 0) {
          metrics.resolutionRate = 
            (metrics.resolvedConversations / metrics.totalConversations) * 100;
        }

        // Tempo médio de resposta
        if (responseTimes[agentId] && responseTimes[agentId].length > 0) {
          const sum = responseTimes[agentId].reduce((a, b) => a + b, 0);
          metrics.averageResponseTime = sum / responseTimes[agentId].length;
        }
      });

      const finalMetrics = Array.from(metricsMap.values());
      console.log('✅ Métricas calculadas:', finalMetrics);

      return finalMetrics;
    },
    enabled: !!chatwootIntegration,
    staleTime: 60000, // Cache por 1 minuto
    refetchInterval: 120000, // Atualizar a cada 2 minutos
  });
};
