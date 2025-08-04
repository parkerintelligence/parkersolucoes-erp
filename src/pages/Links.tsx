import React from 'react';

// EMERGENCY MODE - Sistema em modo de emergência
const Links = () => {
  return React.createElement('div', {
    className: 'min-h-screen bg-slate-900 p-8'
  }, [
    React.createElement('h1', {
      key: 'title',
      className: 'text-3xl font-bold text-white mb-4'
    }, 'Sistema de Links - Modo Emergência'),
    React.createElement('div', {
      key: 'content',
      className: 'bg-slate-800 p-6 rounded-lg border border-slate-700'
    }, [
      React.createElement('p', {
        key: 'msg',
        className: 'text-white mb-4'
      }, 'React hooks não funcionando. Sistema em modo de emergência.'),
      React.createElement('div', {
        key: 'status',
        className: 'text-yellow-400 text-sm'
      }, 'Status: Aguardando correção de conflitos de dependências.')
    ])
  ]);
};

export default Links;