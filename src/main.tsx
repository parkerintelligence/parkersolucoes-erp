import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// CRITICAL: Initialize React IMMEDIATELY before any other code
const initializeReact = () => {
  if ((window as any).__REACT_INITIALIZED__) return;
  
  // Force React to be available globally with all hooks
  (window as any).React = React;
  (globalThis as any).React = React;
  
  // Export all React hooks individually  
  Object.keys(React).forEach(key => {
    if (key.startsWith('use') || key === 'createElement' || key === 'Component') {
      (window as any)[key] = (React as any)[key];
      (globalThis as any)[key] = (React as any)[key];
    }
  });
  
  (window as any).__REACT_INITIALIZED__ = true;
  console.log('React force-initialized globally');
};

// Initialize React FIRST
initializeReact();

const root = createRoot(document.getElementById("root")!)
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
