// Completely non-React based validation
export const validateReactAndInitialize = async (): Promise<boolean> => {
  let attempts = 0;
  const maxAttempts = 20;
  
  const showLoadingMessage = (message: string) => {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: hsl(var(--background, 0 0% 100%));">
          <div style="text-align: center;">
            <div style="margin: 0 auto 1rem; width: 32px; height: 32px; border: 2px solid transparent; border-top: 2px solid hsl(var(--primary, 222.2 84% 4.9%)); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="color: hsl(var(--muted-foreground, 215.4 16.3% 46.9%));">${message}</p>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </div>
        </div>
      `;
    }
  };

  const showErrorMessage = (error: string) => {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: hsl(var(--background, 0 0% 100%));">
          <div style="text-align: center; max-width: 400px; padding: 2rem;">
            <h1 style="color: hsl(var(--destructive, 0 84.2% 60.2%)); margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold;">Erro de React</h1>
            <p style="color: hsl(var(--muted-foreground, 215.4 16.3% 46.9%)); margin-bottom: 1.5rem;">${error}</p>
            <button onclick="window.location.reload()" style="background: hsl(var(--primary, 222.2 84% 4.9%)); color: hsl(var(--primary-foreground, 210 40% 98%)); padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">
              Recarregar Página
            </button>
          </div>
        </div>
      `;
    }
  };

  return new Promise((resolve) => {
    const validateReact = () => {
      try {
        attempts++;
        showLoadingMessage(`Validando React... (${attempts}/${maxAttempts})`);
        
        // Check if React is available globally
        const globalReact = (window as any).React;
        
        // Check if React module is available
        const moduleReact = require('react');
        
        if (
          globalReact && 
          typeof globalReact.useState === 'function' &&
          typeof globalReact.useEffect === 'function' &&
          moduleReact &&
          typeof moduleReact.useState === 'function'
        ) {
          console.log('React validation successful');
          resolve(true);
          return;
        }

        if (attempts >= maxAttempts) {
          const error = `React não pôde ser carregado após ${maxAttempts} tentativas. Possível conflito de versões ou bundle corrompido.`;
          console.error(error);
          showErrorMessage(error);
          resolve(false);
          return;
        }

        // Try again in 200ms
        setTimeout(validateReact, 200);
        
      } catch (error) {
        if (attempts >= maxAttempts) {
          const errorMsg = `Erro crítico do React: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          console.error(errorMsg);
          showErrorMessage(errorMsg);
          resolve(false);
          return;
        }
        
        // Try again on error
        setTimeout(validateReact, 200);
      }
    };

    // Start validation
    validateReact();
  });
};