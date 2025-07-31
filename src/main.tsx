import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as TooltipToaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import App from './App';
import './index.css';

// Garantir que React está disponível globalmente - CRÍTICO para funcionamento
if (typeof window !== 'undefined') {
  window.React = React;
  console.log('React inicializado:', !!React, !!React.useState);
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
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster />
            <TooltipToaster />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}