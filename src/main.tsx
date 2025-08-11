import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Main.tsx initializing, React available:', typeof React.StrictMode);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

try {
  root.render(
    React.createElement(React.StrictMode, null,
      React.createElement(App)
    )
  );
} catch (error) {
  console.error('Error rendering app:', error);
  // Fallback render without StrictMode
  root.render(React.createElement(App));
}