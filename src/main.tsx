import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log('=== MAIN.TSX INICIANDO ===');
console.log('React está disponível:', !!React);
console.log('React.useState está disponível:', !!React.useState);

const root = document.getElementById('root');
console.log('Elemento root encontrado:', !!root);

if (root) {
  const reactRoot = createRoot(root);
  console.log('Root criado com sucesso');
  reactRoot.render(React.createElement(App));
  console.log('App renderizado');
} else {
  console.error('ERRO: Elemento root não encontrado!');
}