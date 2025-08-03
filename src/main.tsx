import { createRoot } from 'react-dom/client';
import * as React from 'react';
import App from './App.tsx';
import './index.css';

// Ensure React is globally available to prevent multiple instances
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Wait for DOM to be ready
const initializeApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Fallback: Show error message
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center;">
        <div>
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Erro de Inicialização</h1>
          <p style="margin-bottom: 1rem;">Falha ao carregar a aplicação. Por favor, recarregue a página.</p>
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
            Recarregar
          </button>
        </div>
      </div>
    `;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
