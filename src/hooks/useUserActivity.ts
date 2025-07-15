import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook otimizado para detectar atividade do usuário com throttling
export const useUserActivity = () => {
  const { isAuthenticated } = useAuth();
  const lastActivityRef = useRef<number>(0);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função throttled para detectar atividade do usuário
  const handleUserActivity = useCallback(() => {
    // Só processar se estiver autenticado
    if (!isAuthenticated) return;
    
    // Throttling: só processar uma vez por segundo
    if (throttleTimeoutRef.current) return;
    
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Throttle por 1 segundo
    throttleTimeoutRef.current = setTimeout(() => {
      throttleTimeoutRef.current = null;
    }, 1000);
    
    // Pode ser usado para analytics ou outras funcionalidades no futuro
    console.debug('User activity detected (throttled)');
  }, [isAuthenticated]); // Removido session das dependências

  useEffect(() => {
    // Só ativar se estiver autenticado
    if (!isAuthenticated) {
      return;
    }

    // Eventos para detectar atividade (menos eventos para melhor performance)
    const events = ['click', 'keydown'];
    
    // Adicionar listeners para atividade do usuário
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      // Limpar timeout do throttle
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, handleUserActivity]); // Dependências otimizadas

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);
};