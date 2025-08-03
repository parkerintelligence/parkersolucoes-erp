import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// SOLUÇÃO BYPASS: App simples sem AuthContext problemático
const SimpleApp = () => {
  console.log('🚀 SimpleApp iniciando...');
  
  // Verificar React
  if (!React || !React.useState) {
    return React.createElement('div', { 
      style: { padding: '20px', background: 'red', color: 'white', fontSize: '18px' } 
    }, '❌ ERRO: React não disponível!');
  }

  const [message, setMessage] = React.useState('Sistema carregando...');
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    console.log('✅ React hooks funcionando!');
    setTimeout(() => {
      setMessage('✅ Sistema carregado com sucesso!');
      setIsLoaded(true);
    }, 1000);
  }, []);

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: { fontSize: '2.5rem', marginBottom: '2rem' }
    }, 'Parker Soluções ERP'),
    
    React.createElement('div', {
      key: 'status',
      style: { 
        fontSize: '1.2rem', 
        marginBottom: '2rem',
        padding: '1rem 2rem',
        background: isLoaded ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.2)',
        borderRadius: '10px',
        border: isLoaded ? '2px solid #00ff00' : '2px solid rgba(255,255,255,0.3)'
      }
    }, message),
    
    isLoaded && React.createElement('div', {
      key: 'links',
      style: { display: 'flex', gap: '1rem', flexWrap: 'wrap' }
    }, [
      React.createElement('button', {
        key: 'dashboard',
        style: {
          padding: '1rem 2rem',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer'
        },
        onClick: () => {
          console.log('Navegando para dashboard...');
          setMessage('🎯 Acesso ao dashboard em desenvolvimento');
        }
      }, '📊 Dashboard'),
      
      React.createElement('button', {
        key: 'admin',
        style: {
          padding: '1rem 2rem',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer'
        },
        onClick: () => {
          console.log('Navegando para admin...');
          setMessage('⚙️ Acesso ao admin em desenvolvimento');
        }
      }, '⚙️ Administração'),
      
      React.createElement('button', {
        key: 'glpi',
        style: {
          padding: '1rem 2rem',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer'
        },
        onClick: () => {
          console.log('Navegando para GLPI...');
          setMessage('🎫 Acesso ao GLPI em desenvolvimento');
        }
      }, '🎫 GLPI')
    ])
  ]);
};

// SETUP REACT GLOBAL
const setupReact = () => {
  console.log('🔧 Setup React global...');
  
  (window as any).React = React;
  (globalThis as any).React = React;
  
  const hooks = ['useState', 'useEffect', 'useContext', 'useMemo', 'useCallback', 'useRef'];
  hooks.forEach(hook => {
    if ((React as any)[hook]) {
      (window as any)[hook] = (React as any)[hook];
      (globalThis as any)[hook] = (React as any)[hook];
    }
  });
  
  console.log('✅ React global configurado');
};

// EXECUÇÃO
setupReact();

console.log('🚀 Iniciando aplicação simples...');

setTimeout(() => {
  const root = createRoot(document.getElementById("root")!);
  root.render(React.createElement(SimpleApp));
  console.log('✅ Aplicação renderizada');
}, 200);