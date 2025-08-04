import React from 'react';

const Links = () => {
  // No hooks at all to test basic React functionality
  return React.createElement('div', {
    className: 'min-h-screen bg-slate-900 p-4'
  }, [
    React.createElement('h1', {
      key: 'title',
      className: 'text-2xl font-bold text-white'
    }, 'Sistema em Modo de Emergência'),
    React.createElement('p', {
      key: 'desc',
      className: 'text-slate-400 mt-4'
    }, 'Corrigindo problemas fundamentais do React...'),
    React.createElement('div', {
      key: 'status',
      className: 'mt-8 p-4 bg-slate-800 rounded-lg'
    }, [
      React.createElement('p', {
        key: 'msg',
        className: 'text-white'
      }, 'React está sendo reconstruído para resolver conflitos de importação.')
    ])
  ]);
};

export default Links;