import React, { ReactNode, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface ReactSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ReactSafeWrapper: React.FC<ReactSafeWrapperProps> = ({ 
  children, 
  fallback 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeReact = async () => {
      try {
        // Ensure React is fully loaded
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (mounted && typeof React !== 'undefined' && React.useState) {
          setIsReady(true);
          setError(null);
        } else {
          throw new Error('React not fully initialized');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    };

    initializeReact();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Erro de inicialização
              </h3>
              <p className="text-gray-400 text-sm">
                {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isReady) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Carregando sistema...
              </h3>
              <p className="text-gray-400 text-sm">
                Aguarde enquanto inicializamos os componentes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};