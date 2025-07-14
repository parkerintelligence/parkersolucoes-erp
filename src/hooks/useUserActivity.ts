import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook para detectar atividade do usuário e resetar timer de sessão
export const useUserActivity = () => {
  const { resetSessionTimer, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => {
      resetSessionTimer();
    };

    // Adicionar listeners para atividade do usuário
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, resetSessionTimer]);
};