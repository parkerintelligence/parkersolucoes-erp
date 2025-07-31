// Verificação se React está completamente carregado
export const isReactReady = (): boolean => {
  try {
    const React = (window as any).React || require('react');
    return React && typeof React.useState === 'function' && typeof React.useEffect === 'function';
  } catch {
    return false;
  }
};

// Safe wrappers para hooks do React - usando acesso dinâmico
export const useSafeState = <T>(initialValue: T): [T, (value: T) => void] => {
  try {
    if (!isReactReady()) {
      // Fallback simples quando React não está disponível
      let value = initialValue;
      const setValue = (newValue: T) => {
        value = newValue;
      };
      return [value, setValue];
    }
    
    const React = (window as any).React || require('react');
    return React.useState(initialValue);
  } catch (error) {
    console.error('useState error:', error);
    // Fallback para quando React não está disponível
    let value = initialValue;
    const setValue = (newValue: T) => {
      value = newValue;
    };
    return [value, setValue];
  }
};

export const useSafeEffect = (effect: () => void | (() => void), deps?: any[]): void => {
  try {
    if (!isReactReady()) {
      // Tentar executar o efeito diretamente se React não estiver disponível
      try {
        effect();
      } catch (e) {
        console.warn('Effect execution failed:', e);
      }
      return;
    }
    
    const React = (window as any).React || require('react');
    return React.useEffect(effect, deps);
  } catch (error) {
    console.error('useEffect error:', error);
    // Fallback silencioso quando React não está disponível
  }
};