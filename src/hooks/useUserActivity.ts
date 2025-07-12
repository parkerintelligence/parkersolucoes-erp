import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook otimizado para detectar atividade do usuário e resetar timer de sessão
export const useUserActivity = () => {
  const { resetSessionTimer, isAuthenticated, session } = useAuth();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);

  // Função otimizada para reset do timer com debounce inteligente
  const handleUserActivity = useCallback(() => {
    // Só processar se estiver autenticado
    if (!isAuthenticated || !session) return;
    
    const now = Date.now();
    
    // Só resetar se passou pelo menos 5 segundos desde a última atividade
    // Isso evita spam de resets desnecessários
    if (now - lastActivityRef.current < 5000) return;
    
    lastActivityRef.current = now;
    
    // Limpar timer anterior se existir
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce de 3 segundos para evitar multiple resets
    debounceTimerRef.current = setTimeout(() => {
      console.log('🎯 Atividade do usuário detectada - resetando timer de sessão');
      resetSessionTimer();
    }, 3000);
  }, [isAuthenticated, session, resetSessionTimer]);

  useEffect(() => {
    // Só ativar se estiver autenticado e tiver sessão
    if (!isAuthenticated || !session) {
      console.log('⚠️ useUserActivity: Não ativado - usuário não autenticado');
      return;
    }

    console.log('🎯 useUserActivity: Ativado para usuário autenticado');

    // Eventos importantes que indicam atividade real do usuário
    // Removendo 'mousemove' para evitar spam excessivo
    const events = ['click', 'keypress', 'scroll', 'touchstart'];
    
    // Adicionar listeners para atividade do usuário
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Cleanup
    return () => {
      console.log('🧹 useUserActivity: Limpando listeners');
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, session, handleUserActivity]);
};