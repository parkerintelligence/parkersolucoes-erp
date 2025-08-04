import React from 'react';

const Links = () => {
  console.log('Links component renderizando...');
  
  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="text-white">
        <h1 className="text-2xl font-bold mb-4">Links de Acesso</h1>
        <p className="text-slate-400">
          Modo de emergência ativo - Corrigindo problemas de React hooks...
        </p>
        <div className="mt-8 p-4 bg-slate-800 rounded-lg">
          <p className="text-white">Sistema sendo otimizado para corrigir erros de contexto React.</p>
          <p className="text-slate-400 text-sm mt-2">
            Os links de acesso voltarão em breve após a correção completa.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Links;