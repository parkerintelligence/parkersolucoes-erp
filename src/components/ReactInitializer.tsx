import React from 'react';

interface ReactInitializerProps {
  children: React.ReactNode;
}

export const ReactInitializer: React.FC<ReactInitializerProps> = ({ children }) => {
  // Verificar se React está funcionando
  if (!React || !React.useState || !React.useEffect) {
    console.error('React não está disponível - forçando reload');
    
    // Fallback visual enquanto recarrega
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-lg">
          Inicializando React... 
          <br />
          <small>Se esta tela persistir, recarregue a página</small>
        </div>
      </div>
    );
  }

  // React está funcionando, renderizar children
  return <>{children}</>;
};