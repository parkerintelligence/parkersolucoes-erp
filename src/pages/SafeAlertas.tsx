import React, { useState, useEffect } from 'react';
import Alertas from './Alertas';

export default function SafeAlertas() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Delay to ensure React and QueryClient are fully initialized
    const timer = setTimeout(() => {
      try {
        // Test if React hooks are working
        if (typeof React !== 'undefined' && React.useState) {
          setIsReady(true);
        } else {
          setError('React not properly initialized');
        }
      } catch (err) {
        setError('Failed to initialize: ' + (err as Error).message);
      }
    }, 100); // Small delay to ensure everything is loaded

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
            <p className="text-red-400">Erro ao carregar: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
            <p className="text-muted-foreground">Inicializando sistema...</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border-slate-700 p-4 rounded-lg">
            <div className="h-8 w-16 bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="bg-slate-800 border-slate-700 p-4 rounded-lg">
            <div className="h-8 w-16 bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="bg-slate-800 border-slate-700 p-4 rounded-lg">
            <div className="h-8 w-16 bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return <Alertas />;
}