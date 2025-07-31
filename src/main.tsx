import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// App simples para testar
const SimpleApp = () => {
  console.log('SimpleApp renderizando, React:', React);
  
  return React.createElement('div', {
    style: { 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }
  }, 'Sistema Carregando... React OK!');
};

// Inicialização simplificada
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(React.createElement(SimpleApp));
} else {
  console.error('Elemento root não encontrado');
}