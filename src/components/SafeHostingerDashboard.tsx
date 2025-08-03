import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HostingerDashboard } from '@/components/HostingerDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

const SafeHostingerWrapper: React.FC = () => {
  // Add a loading state to ensure React Query is ready
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Small delay to ensure React Query context is fully initialized
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8">
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando sistema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  try {
    // Test if React Query context is available
    const queryClient = useQueryClient();
    
    if (!queryClient) {
      throw new Error('QueryClient not available');
    }

    return <HostingerDashboard />;
  } catch (error) {
    console.error('Error in SafeHostingerWrapper:', error);
    
    return (
      <Card className="bg-yellow-900/20 border-yellow-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="h-5 w-5" />
            Sistema Indisponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-yellow-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Inicializando sistema de monitoramento...</span>
          </div>
          <p className="text-yellow-200 mt-2 text-sm">
            O sistema está sendo carregado. Se o problema persistir, recarregue a página.
          </p>
        </CardContent>
      </Card>
    );
  }
};

export const SafeHostingerDashboard: React.FC = () => {
  return (
    <ErrorBoundary>
      <SafeHostingerWrapper />
    </ErrorBoundary>
  );
};