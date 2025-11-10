import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface ChatwootEvent {
  id: string;
  event_type: string;
  conversation_id: number;
  event_data: any;
  created_at: string;
}

export const useChatwootRealtime = (integrationId: string | undefined, enabled: boolean = true) => {
  const queryClient = useQueryClient();

  const showNotification = useCallback((event: ChatwootEvent) => {
    // Verificar se o usuário deu permissão para notificações
    if ('Notification' in window && Notification.permission === 'granted') {
      const data = event.event_data;
      
      let title = 'Nova mensagem no Chatwoot';
      let body = '';
      const icon = '/icon-192.png';

      switch (event.event_type) {
        case 'message_created':
          const sender = data.sender?.name || data.conversation?.meta?.sender?.name || 'Cliente';
          const message = data.content || data.message?.content || '';
          title = `💬 Mensagem de ${sender}`;
          body = message.substring(0, 100);
          break;
        
        case 'conversation_created':
          title = '🆕 Nova conversa';
          body = `Cliente: ${data.meta?.sender?.name || 'Desconhecido'}`;
          break;
        
        case 'conversation_status_changed':
          title = '🔄 Status alterado';
          body = `Conversa #${event.conversation_id} - ${data.status}`;
          break;
      }

      new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: `chatwoot-${event.conversation_id}`
      });
    }

    // Toast notification sempre aparece
    const eventTypeLabels: Record<string, string> = {
      'message_created': '💬 Nova mensagem',
      'conversation_created': '🆕 Nova conversa',
      'conversation_status_changed': '🔄 Status alterado',
      'conversation_updated': '📝 Conversa atualizada'
    };

    toast({
      title: eventTypeLabels[event.event_type] || '🔔 Nova atividade',
      description: `Conversa #${event.conversation_id} foi atualizada`,
    });
  }, []);

  useEffect(() => {
    if (!enabled || !integrationId) return;

    console.log('🎧 Listening to Chatwoot realtime events for integration:', integrationId);

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Notification permission:', permission);
      });
    }

    // Criar canal Supabase Realtime
    const channel = supabase
      .channel('chatwoot-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatwoot_events',
          filter: `integration_id=eq.${integrationId}`
        },
        (payload) => {
          console.log('🔔 Realtime event received:', payload);
          
          const event = payload.new as ChatwootEvent;
          
          // Invalidar queries para atualizar dados
          queryClient.invalidateQueries({ queryKey: ['chatwoot-conversations'] });
          
          // Se for mensagem de uma conversa específica, atualizar mensagens
          if (event.event_type === 'message_created') {
            queryClient.invalidateQueries({ 
              queryKey: ['chatwoot-messages', integrationId, event.conversation_id.toString()] 
            });
          }

          // Mostrar notificação
          showNotification(event);
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
      });

    // Cleanup
    return () => {
      console.log('🔌 Unsubscribing from Chatwoot realtime events');
      supabase.removeChannel(channel);
    };
  }, [integrationId, enabled, queryClient, showNotification]);
};
