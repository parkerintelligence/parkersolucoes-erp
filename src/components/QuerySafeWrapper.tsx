import React, { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { ReactSafeWrapper } from './ReactSafeWrapper';

interface QuerySafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const QueryContextChecker: React.FC<QuerySafeWrapperProps> = ({ 
  children, 
  fallback 
}) => {
  try {
    const queryClient = useQueryClient();
    
    if (!queryClient) {
      throw new Error('QueryClient not available');
    }

    return <>{children}</>;
  } catch (error) {
    console.error('QueryClient context error:', error);
    
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-400" />
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Contexto de consulta não disponível
              </h3>
              <p className="text-gray-400 text-sm">
                Aguardando inicialização do sistema...
              </p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          </div>
        </CardContent>
      </Card>
    );
  }
};

export const QuerySafeWrapper: React.FC<QuerySafeWrapperProps> = ({ 
  children, 
  fallback 
}) => {
  return (
    <ReactSafeWrapper fallback={fallback}>
      <QueryContextChecker fallback={fallback}>
        {children}
      </QueryContextChecker>
    </ReactSafeWrapper>
  );
};