import { useState, useEffect, ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

interface SafeAuthProviderProps {
  children: ReactNode;
}

export const SafeAuthProvider = ({ children }: SafeAuthProviderProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure React is fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Iniciando...</div>
      </div>
    );
  }

  return <AuthProvider>{children}</AuthProvider>;
};
