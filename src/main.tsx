import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure React is globally available before any other imports
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (globalThis as any).React = React;
}

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