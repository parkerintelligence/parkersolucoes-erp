import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// SOLUÇÃO DEFINITIVA: Substituir QUALQUER referência null de React
const forceReactGlobally = () => {
  console.log('🔧 Iniciando setup React definitivo...');
  
  // Garantir React disponível globalmente
  (window as any).React = React;
  (globalThis as any).React = React;
  
  // Substituir TODOS os hooks globalmente
  const hooks = ['useState', 'useEffect', 'useContext', 'useMemo', 'useCallback', 'useRef', 'useReducer', 'useLayoutEffect'];
  
  hooks.forEach(hookName => {
    if ((React as any)[hookName]) {
      (window as any)[hookName] = (React as any)[hookName];
      (globalThis as any)[hookName] = (React as any)[hookName];
      
      // Força override de qualquer referência null
      try {
        Object.defineProperty(window, hookName, {
          value: (React as any)[hookName],
          writable: false,
          configurable: false
        });
      } catch(e) {
        console.log(`Hook ${hookName} já definido`);
      }
    }
  });
  
  // Força React.createElement global
  (window as any).createElement = React.createElement;
  (globalThis as any).createElement = React.createElement;
  
  // Override do console para detectar problemas
  const originalError = console.error;
  console.error = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('Cannot read properties of null')) {
      console.log('🚨 ERRO NULL DETECTADO:', args);
      console.log('React disponível:', !!window.React);
      console.log('useState disponível:', !!(window as any).useState);
    }
    originalError.apply(console, args);
  };
  
  console.log('✅ React setup completo - Version:', React.version);
  console.log('✅ Hooks disponíveis:', hooks.map(h => `${h}:${!!(window as any)[h]}`));
};

// EXECUÇÃO IMEDIATA - ANTES DE QUALQUER COISA
forceReactGlobally();

// DELAY para garantir que React está pronto
setTimeout(() => {
  const root = createRoot(document.getElementById("root")!)
  root.render(
    React.createElement(React.StrictMode, null, React.createElement(App))
  );
}, 100);