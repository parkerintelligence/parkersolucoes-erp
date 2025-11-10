import { useState, useEffect, lazy, Suspense } from 'react';

const Login = lazy(() => import('./Login'));

const SafeLogin = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure React is fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
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

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    }>
      <Login />
    </Suspense>
  );
};

export default SafeLogin;
