import React from 'react'
import 'react/jsx-runtime'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Absolutely critical: Ensure React is available globally BEFORE any other imports
if (typeof window !== 'undefined') {
  window.React = React;
  (window as any).__REACT_VERSION__ = React.version;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).React = React;
}

console.log('React version loaded:', React.version, 'Available globally:', !!(window as any).React);

const root = createRoot(document.getElementById("root")!)
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
