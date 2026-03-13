import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWebhookNotifications = () => {
  const { isAuthenticated } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.3);

      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);
      osc2.start(audioContext.currentTime + 0.15);
      osc2.stop(audioContext.currentTime + 0.45);
    } catch (e) {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    channelRef.current = supabase
      .channel('webhook-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_logs',
        },
        (payload) => {
          const record = payload.new as any;
          const body = record.request_body;
          const isTest = record.is_test;

          // Build a summary from the payload
          let summary = '';
          if (body && typeof body === 'object') {
            const keys = Object.keys(body);
            if (body.trigger) summary = String(body.trigger);
            else if (body.message) summary = String(body.message).substring(0, 80);
            else if (body.text) summary = String(body.text).substring(0, 80);
            else if (keys.length > 0) summary = keys.slice(0, 3).join(', ');
          }

          // Desktop notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(
              isTest ? '🧪 Webhook de Teste Recebido' : '🔔 Webhook Recebido',
              {
                body: summary || 'Novo payload recebido',
                icon: '/icon-192.png',
                tag: `webhook-${record.id}`,
                requireInteraction: false,
              }
            );
            setTimeout(() => notification.close(), 6000);
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }

          // Toast notification
          toast(isTest ? '🧪 Webhook de Teste' : '🔔 Webhook Recebido', {
            description: summary || 'Novo payload recebido',
            duration: 6000,
            position: 'bottom-right',
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = '/webhooks';
              },
            },
          });

          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, playNotificationSound]);
};
