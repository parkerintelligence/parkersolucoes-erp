import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure React is globally available for all components
(globalThis as any).React = React;
(window as any).React = React;

// Ensure React hooks are available
const hooks = ['useState', 'useEffect', 'useContext', 'useMemo', 'useCallback', 'useRef'];
hooks.forEach(hook => {
  (globalThis as any)[hook] = (React as any)[hook];
  (window as any)[hook] = (React as any)[hook];
});

console.log('React loaded:', !!React, 'React hooks available:', !!React.useState);

const root = createRoot(document.getElementById("root")!)
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
