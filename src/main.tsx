import { createRoot } from 'react-dom/client';
import * as React from 'react';
import { validateReactAndInitialize } from './utils/reactValidator';

// Ensure React is globally available to prevent multiple instances
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Initialize app only after React validation
const initializeApp = async () => {
  try {
    console.log('Starting React validation...');
    
    // Validate React before doing anything else
    const isReactValid = await validateReactAndInitialize();
    
    if (!isReactValid) {
      console.error('React validation failed, cannot proceed');
      return;
    }

    console.log('React validation successful, loading app...');
    
    // Dynamically import App only after React is validated
    const { default: App } = await import('./App');
    
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    const root = createRoot(rootElement);
    root.render(React.createElement(App));
    
    console.log('App initialized successfully');
    
  } catch (error) {
    console.error('Critical initialization error:', error);
    
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center;">
          <div>
            <h1 style="color: #ef4444; margin-bottom: 1rem;">Erro Crítico</h1>
            <p style="margin-bottom: 1rem;">Falha crítica na inicialização: ${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
            <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
              Recarregar
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
