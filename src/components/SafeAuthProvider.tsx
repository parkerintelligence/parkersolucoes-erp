import { useState, useEffect, ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

interface SafeAuthProviderProps {
  children: ReactNode;
}

export const SafeAuthProvider = ({ children }: SafeAuthProviderProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Longer delay to ensure React and all contexts are fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Iniciando sistema...</div>
      </div>
    );
  }

  return <AuthProvider>{children}</AuthProvider>;
};
