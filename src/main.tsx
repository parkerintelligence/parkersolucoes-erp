import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// SOLUÇÃO DEFINITIVA: React disponível globalmente ANTES de qualquer coisa
const setupReact = () => {
  // Garantir que React está disponível globalmente
  (window as any).React = React;
  (globalThis as any).React = React;
  
  // Garantir que todos os hooks estão disponíveis
  Object.keys(React).forEach(key => {
    if (typeof (React as any)[key] === 'function') {
      (window as any)[key] = (React as any)[key];
      (globalThis as any)[key] = (React as any)[key];
    }
  });
  
  console.log('✅ React configurado globalmente:', !!window.React);
};

// Executar IMEDIATAMENTE
setupReact();

const root = createRoot(document.getElementById("root")!)
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);