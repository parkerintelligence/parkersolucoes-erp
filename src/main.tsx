import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force React to be available before any other modules load
Object.defineProperty(window, 'React', { value: React, writable: false });
Object.defineProperty(globalThis, 'React', { value: React, writable: false });

// Force all React hooks to be available globally
const reactHooks = Object.keys(React).filter(key => key.startsWith('use'));
reactHooks.forEach(hook => {
  (window as any)[hook] = (React as any)[hook];
  (globalThis as any)[hook] = (React as any)[hook];
});

console.log('React globally initialized:', !!window.React, 'Hooks available:', reactHooks.length);

const root = createRoot(document.getElementById("root")!)
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
