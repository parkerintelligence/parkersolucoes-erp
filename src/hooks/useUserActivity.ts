import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook para detectar atividade do usuário e resetar timer de sessão
export const useUserActivity = () => {
  const { resetSessionTimer, isAuthenticated, session } = useAuth();

  useEffect(() => {
    // Só ativar se estiver autenticado e tiver sessão
    if (!isAuthenticated || !session) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let debounceTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      // Debounce para evitar chamadas excessivas
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        resetSessionTimer();
      }, 1000); // 1 segundo de debounce
    };

    // Adicionar listeners para atividade do usuário
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      clearTimeout(debounceTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, session, resetSessionTimer]);
};