import React, { useState, useEffect } from 'react';
import SimpleAlertas from './SimpleAlertas';

// Lazy load the full Alertas component
const Alertas = React.lazy(() => import('./Alertas'));

export default function SafeAlertas() {
  const [stage, setStage] = useState<'loading' | 'simple' | 'full' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    console.log('SafeAlertas: Starting initialization sequence...');
    
    // Stage 1: Initial delay
    setTimeout(() => {
      if (!mounted) return;
      console.log('SafeAlertas: Moving to simple stage...');
      setStage('simple');
      
      // Stage 2: Try to load full component after simple one is shown
      setTimeout(() => {
        if (!mounted) return;
        try {
          console.log('SafeAlertas: Attempting to load full Alertas...');
          setStage('full');
        } catch (err) {
          console.error('SafeAlertas: Failed to load full component:', err);
          setError('Failed to load full component: ' + (err as Error).message);
          setStage('error');
        }
      }, 2000); // Wait 2 seconds before trying full component
      
    }, 300); // Initial delay

    return () => {
      mounted = false;
    };
  }, []);

  if (stage === 'loading') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
            <p className="text-muted-foreground">Carregando sistema...</p>
          </div>
        </div>
        
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

  if (stage === 'error') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
            <p className="text-red-400">Erro: {error}</p>
          </div>
        </div>
        <SimpleAlertas />
      </div>
    );
  }

  if (stage === 'simple') {
    return <SimpleAlertas />;
  }

  // Stage 'full'
  return (
    <React.Suspense fallback={<SimpleAlertas />}>
      <Alertas />
    </React.Suspense>
  );
}