import React from 'react';

interface ReactInitializerProps {
  children: React.ReactNode;
}

export const ReactInitializer: React.FC<ReactInitializerProps> = ({ children }) => {
  // Verificar se React está funcionando completamente
  const isReactReady = React && React.useState && React.useEffect && React.createContext;
  
  if (!isReactReady) {
    console.error('React hooks não estão disponíveis, tentando novamente...');
    
    // Tentar recarregar após um delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 2000);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-lg">
          Inicializando React... 
          <br />
          <small>Recarregando automaticamente...</small>
        </div>
      </div>
    );
  }

  // React está funcionando, renderizar children
  return <>{children}</>;
};