import { useEffect, useCallback, useRef } from 'react';
import { ChatwootConversation } from './useChatwootAPI';
import { toast } from 'sonner';

/**
 * Hook para gerenciar notificações desktop de novas conversas
 * Monitora todas as conversas abertas e notifica quando novas mensagens chegam
 */
export const useDesktopNotifications = (
  conversations: ChatwootConversation[] | undefined,
  enabled: boolean = true
) => {
  const previousConversationsRef = useRef<Map<number, number>>(new Map());
  const notificationPermissionRequested = useRef(false);

  // Solicitar permissão para notificações
  useEffect(() => {
    if (!enabled || notificationPermissionRequested.current) return;
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Desktop notification permission:', permission);
        if (permission === 'granted') {
          toast.success('Notificações ativadas', {
            description: 'Você receberá notificações de novas mensagens',
            duration: 3000
          });
        }
      });
      notificationPermissionRequested.current = true;
    }
  }, [enabled]);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

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

  const showDesktopNotification = useCallback((conversation: ChatwootConversation) => {
    // Só notifica conversas abertas
    if (conversation.status !== 'open') return;

    const sender = conversation.meta?.sender?.name || 'Cliente';
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
    const content = lastMessage?.content || 'Nova mensagem';

    // Desktop notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`💬 ${sender}`, {
        body: content.substring(0, 100),
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `chatwoot-conv-${conversation.id}`,
        requireInteraction: false,
        silent: false
      });

      // Auto-fechar após 5 segundos
      setTimeout(() => notification.close(), 5000);

      // Focar na aba quando clicar na notificação
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Toast notification
    toast('💬 Nova mensagem', {
      description: `${sender}: ${content.substring(0, 80)}...`,
      duration: 5000,
      position: 'bottom-right',
    });

    // Sound
    playNotificationSound();
  }, [playNotificationSound]);

  // Detectar novas mensagens em conversas abertas
  useEffect(() => {
    if (!enabled || !conversations || conversations.length === 0) return;

    const currentConversations = new Map<number, number>();
    
    conversations.forEach(conv => {
      // Contar mensagens na conversa
      const messageCount = conv.messages?.length || 0;
      currentConversations.set(conv.id, messageCount);

      // Comparar com estado anterior
      const previousCount = previousConversationsRef.current.get(conv.id) || 0;
      
      // Se houver novas mensagens E a conversa está aberta
      if (messageCount > previousCount && conv.status === 'open') {
        console.log(`🔔 Nova mensagem detectada na conversa ${conv.id}`);
        showDesktopNotification(conv);
      }
    });

    // Atualizar referência
    previousConversationsRef.current = currentConversations;
  }, [conversations, enabled, showDesktopNotification]);

  return {
    isNotificationPermissionGranted: typeof window !== 'undefined' && 
      'Notification' in window && 
      Notification.permission === 'granted'
  };
};
