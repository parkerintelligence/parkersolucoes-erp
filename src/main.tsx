// Import React FIRST and make it globally available immediately
import React, { StrictMode } from 'react';

// CRITICAL: Ensure React is globally available before ANY other imports
(globalThis as any).React = React;
(window as any).React = React;

// Force React to be included in bundle to prevent tree-shaking
console.log('🔧 React forced inclusion:', {
  React: !!React,
  useState: !!React.useState,
  useEffect: !!React.useEffect,
  useContext: !!React.useContext,
  createContext: !!React.createContext
});

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Main.tsx initializing, React available:', typeof React, 'React.useContext:', typeof React.useContext);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  // Fallback render without StrictMode
  root.render(<App />);
}