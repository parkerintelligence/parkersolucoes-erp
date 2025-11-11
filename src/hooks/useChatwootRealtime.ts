import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChatwootMessage } from './useChatwootAPI';

interface ChatwootEvent {
  id: string;
  event_type: string;
  conversation_id: number;
  event_data: any;
  created_at: string;
}

// Hook para detectar novas mensagens e notificar
export const useChatwootMessageNotifications = (
  messages: ChatwootMessage[] | undefined,
  conversationId: string | null,
  enabled: boolean = true
) => {
  const previousMessagesRef = useRef<ChatwootMessage[]>([]);

  const playNotificationSound = useCallback(() => {
    // Criar som de notificação usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar som (tipo WhatsApp)
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Segunda nota
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 600;
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator2.start(audioContext.currentTime + 0.1);
      oscillator2.stop(audioContext.currentTime + 0.6);

    } catch (error) {
      console.log('Não foi possível tocar o som:', error);
    }
  }, []);

  const showMessageNotification = useCallback((message: ChatwootMessage) => {
    const isIncoming = message.message_type === 0; // 0 = incoming, 1 = outgoing
    
    if (!isIncoming) return; // Só notifica mensagens recebidas

    // Notificação do navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      const sender = message.sender?.name || 'Cliente';
      const content = message.content || 'Nova mensagem';
      
      new Notification(`💬 ${sender}`, {
        body: content.substring(0, 100),
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `chatwoot-msg-${message.id}`,
        requireInteraction: false
      });
    }

    // Toast
    toast('💬 Nova mensagem', {
      description: `${message.sender?.name || 'Cliente'}: ${(message.content || '').substring(0, 80)}...`,
      duration: 5000,
      position: 'bottom-right',
    });

    // Som
    playNotificationSound();
  }, [playNotificationSound]);

  // Detectar novas mensagens
  useEffect(() => {
    if (!enabled || !messages || !conversationId) return;

    const previousMessages = previousMessagesRef.current;
    
    // Se temos mensagens anteriores, comparar
    if (previousMessages.length > 0 && messages.length > previousMessages.length) {
      // Encontrar mensagens novas
      const newMessages = messages.filter(
        msg => !previousMessages.some(prev => prev.id === msg.id)
      );

      // Notificar cada mensagem nova
      newMessages.forEach(msg => {
        showMessageNotification(msg);
      });
    }

    // Atualizar referência
    previousMessagesRef.current = messages;
  }, [messages, conversationId, enabled, showMessageNotification]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Notification permission:', permission);
      });
    }
  }, [enabled]);
};

export const useChatwootRealtime = (
  integrationId: string | undefined, 
  enabled: boolean = true,
  enablePopupNotifications: boolean = true
) => {
  const queryClient = useQueryClient();
  const previousConversationsCount = useRef<number>(0);

  const showNotification = useCallback((event: ChatwootEvent) => {
    if (!enablePopupNotifications) return;

    // Verificar se o usuário deu permissão para notificações do navegador
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

    // Toast popup estilo WhatsApp no canto inferior direito
    const eventTypeData: Record<string, { icon: string, title: string }> = {
      'message_created': { icon: '💬', title: 'Nova mensagem' },
      'conversation_created': { icon: '🆕', title: 'Nova conversa' },
      'conversation_status_changed': { icon: '🔄', title: 'Status alterado' },
      'conversation_updated': { icon: '📝', title: 'Conversa atualizada' }
    };

    const eventInfo = eventTypeData[event.event_type] || { icon: '🔔', title: 'Nova atividade' };
    const data = event.event_data;
    const sender = data.sender?.name || data.meta?.sender?.name || 'Cliente';

    toast(`${eventInfo.icon} ${eventInfo.title}`, {
      description: event.event_type === 'conversation_created' 
        ? `Nova conversa de ${sender}`
        : `Conversa #${event.conversation_id} foi atualizada`,
      duration: 5000,
      position: 'bottom-right',
    });
  }, [enablePopupNotifications]);

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
