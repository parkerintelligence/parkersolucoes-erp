import { useState, useEffect } from 'react';
import Login from './Login';

const SafeLogin = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait longer to ensure React context is fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-2xl font-bold text-gold">
            Parker Soluções ERP
          </div>
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  return <Login />;
};

export default SafeLogin;
