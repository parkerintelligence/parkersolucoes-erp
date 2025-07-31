import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as TooltipToaster } from '@/components/ui/toaster';
import { ReactInitializer } from '@/components/ReactInitializer';
import { AuthProvider } from '@/contexts/AuthContext';
import App from './App';
import './index.css';

// Garantir que React está disponível globalmente - CRÍTICO para funcionamento
if (typeof window !== 'undefined') {
  // Forçar React como disponível globalmente
  (window as any).React = React;
  
  // Verificação mais robusta
  const reactReady = React && React.useState && React.useEffect && React.createContext;
  console.log('React inicializado:', {
    reactExists: !!React,
    hasUseState: !!React?.useState,
    hasUseEffect: !!React?.useEffect,
    ready: reactReady
  });
  
  // Se React não está completamente pronto, tentar novamente
  if (!reactReady) {
    console.error('React não está completamente carregado, tentando novamente...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Verificar se React está funcionando antes de renderizar
if (!React || !React.useState) {
  console.error('React não está disponível! Recarregando...');
  window.location.reload();
} else {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  
  root.render(
    <React.StrictMode>
      <ReactInitializer>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
              <Toaster />
              <TooltipToaster />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ReactInitializer>
    </React.StrictMode>
  );
}