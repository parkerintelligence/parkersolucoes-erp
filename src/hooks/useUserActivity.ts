import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook simplificado para detectar atividade do usuário (sem timer de sessão)
export const useUserActivity = () => {
  const { isAuthenticated, session } = useAuth();
  const lastActivityRef = useRef<number>(0);

  // Função para detectar atividade do usuário
  const handleUserActivity = useCallback(() => {
    // Só processar se estiver autenticado
    if (!isAuthenticated || !session) return;
    
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Pode ser usado para analytics ou outras funcionalidades no futuro
    console.debug('User activity detected');
  }, [isAuthenticated, session]);

  useEffect(() => {
    // Só ativar se estiver autenticado e tiver sessão
    if (!isAuthenticated || !session) {
      return;
    }

    // Eventos para detectar atividade
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
    };
  }, [isAuthenticated, session, handleUserActivity]);
};