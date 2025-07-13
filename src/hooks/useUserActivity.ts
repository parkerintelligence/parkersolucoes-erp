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
    
    // Só resetar se passou pelo menos 30 segundos desde a última atividade
    // Isso evita spam de resets desnecessários
    if (now - lastActivityRef.current < 30000) return;
    
    lastActivityRef.current = now;
    
    // Limpar timer anterior se existir
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce de 10 segundos para evitar multiple resets
    debounceTimerRef.current = setTimeout(() => {
      resetSessionTimer();
    }, 10000);
  }, [isAuthenticated, session, resetSessionTimer]);

  useEffect(() => {
    // Só ativar se estiver autenticado e tiver sessão
    if (!isAuthenticated || !session) {
      return;
    }

    // Apenas eventos realmente importantes para considerar atividade
    const events = ['click', 'keydown'];
    
    // Adicionar listeners para atividade do usuário
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Cleanup
    return () => {
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