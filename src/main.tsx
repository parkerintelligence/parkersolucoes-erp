import React from 'react'
import 'react/jsx-runtime'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force React to be available in all chunks - CRITICAL FIX
const originalReact = window.React;
Object.defineProperty(window, 'React', {
  value: React,
  writable: false,
  configurable: false
});
Object.defineProperty(globalThis, 'React', {
  value: React, 
  writable: false,
  configurable: false
});

// Override any cached React references in Vite chunks
if (typeof window !== 'undefined') {
  (window as any).__vite_react_override__ = React;
}

console.log('React version loaded:', React.version, 'Available globally:', !!(window as any).React);

const root = createRoot(document.getElementById("root")!)
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
