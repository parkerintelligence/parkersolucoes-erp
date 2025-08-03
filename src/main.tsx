import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Fallback error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (event.error?.message?.includes('useContext') || event.error?.message?.includes('useState')) {
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
});

try {
  createRoot(rootElement).render(React.createElement(App));
} catch (error) {
  console.error("Error mounting React app:", error);
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
