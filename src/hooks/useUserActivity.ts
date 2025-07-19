
import * as React from 'react';

export const useUserActivity = () => {
  const isAuthenticated = true; // Auth removido
  const lastActivityRef = React.useRef<number>(0);
  const throttleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleUserActivity = React.useCallback(() => {
    if (!isAuthenticated) return;
    
    if (throttleTimeoutRef.current) return;
    
    const now = Date.now();
    lastActivityRef.current = now;
    
    throttleTimeoutRef.current = setTimeout(() => {
      throttleTimeoutRef.current = null;
    }, 1000);
    
    console.debug('User activity detected');
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['click', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, handleUserActivity]);

  React.useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);
};
