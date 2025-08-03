// Import React fix first to ensure hooks are never null
import '@/utils/reactFix';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure DOM is ready before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Use a simple wrapper to ensure React is fully initialized
const AppWrapper = () => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure React context is properly set up
    const timer = setTimeout(() => setIsReady(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }
  
  return <App />;
};

root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
