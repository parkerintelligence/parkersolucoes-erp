import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure React is globally available for all components
(globalThis as any).React = React;
(window as any).React = React;

console.log('React loaded:', !!React, 'React hooks available:', !!React.useState);

const root = createRoot(document.getElementById("root")!)
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
