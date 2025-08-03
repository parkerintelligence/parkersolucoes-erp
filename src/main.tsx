import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure React is globally available for our fallback auth system
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Enhanced error handler for React bundling issues
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  if (event.error?.message?.includes('useContext') || 
      event.error?.message?.includes('useState') ||
      event.error?.message?.includes('React')) {
    console.warn('React bundling issue detected, attempting graceful fallback');
    
    // Don't replace the entire page, let our fallback auth system handle it
    return;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

try {
  const root = createRoot(rootElement);
  root.render(React.createElement(App));
} catch (error) {
  console.error("Critical error mounting React app:", error);
  // Fallback error display
  rootElement.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <h1>Erro no Sistema</h1>
        <p>Falha ao carregar a aplicação. Recarregue a página.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Recarregar
        </button>
      </div>
    </div>
  `;
}
