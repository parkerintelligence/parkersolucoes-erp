import React from 'react';

// EMERGENCY MODE - Minimal React component
const Links = () => {
  console.log('Links emergency mode - no hooks');
  
  return React.createElement('div', 
    { className: 'min-h-screen bg-slate-900 p-8' },
    React.createElement('h1', 
      { className: 'text-3xl font-bold text-white mb-4' },
      'Sistema de Gestão ERP'
    ),
    React.createElement('p', 
      { className: 'text-slate-400 mb-8' },
      'Modo de emergência ativo. Sistema sendo corrigido...'
    ),
    React.createElement('div',
      { className: 'bg-slate-800 p-6 rounded-lg border border-slate-700' },
      React.createElement('p',
        { className: 'text-white' },
        'React hooks temporariamente desabilitados para correção de conflitos.'
      )
    )
  );
};

export default Links;