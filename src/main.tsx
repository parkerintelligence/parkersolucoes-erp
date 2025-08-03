// CRITICAL: Import React first and ensure it's globally available before anything else
import React from 'react';

// Ensure React is globally available IMMEDIATELY
if (typeof window !== 'undefined') {
  (window as any).React = React;
  // Ensure React hooks are available globally as backup
  (window as any).__REACT_HOOKS_GLOBAL__ = {
    useState: React.useState,
    useEffect: React.useEffect,
    useContext: React.useContext,
    createContext: React.createContext
  };
}

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure DOM is ready before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Simple direct render - no complex wrappers that might cause issues
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
