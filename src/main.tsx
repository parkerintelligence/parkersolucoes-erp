import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Debug: Verificar instância do React no main
console.log('🔍 Main.tsx - React version:', React.version);
console.log('🔍 Main.tsx - React hooks available:', {
  useState: !!React.useState,
  useEffect: !!React.useEffect
});

// Aguardar que o DOM esteja completamente carregado
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Root element not found');
    return;
  }

  try {
    console.log('🚀 Iniciando aplicação...');
    const root = createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ Aplicação renderizada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao renderizar aplicação:', error);
    
    // Fallback simples em caso de erro
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: system-ui;">
        <div>
          <h1 style="color: #dc2626; margin-bottom: 16px;">Erro na Aplicação</h1>
          <p style="color: #6b7280; margin-bottom: 20px;">Ocorreu um erro ao carregar a aplicação.</p>
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
            Recarregar Página
          </button>
        </div>
      </div>
    `;
  }
});