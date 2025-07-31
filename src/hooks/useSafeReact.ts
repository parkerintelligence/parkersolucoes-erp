import { useState, useEffect } from 'react';

// Verificação se React está completamente carregado
export const isReactReady = (): boolean => {
  try {
    // Verificar se os hooks estão disponíveis diretamente
    return typeof useState === 'function' && typeof useEffect === 'function';
  } catch {
    return false;
  }
};

// Safe wrappers para hooks do React - usando importação direta com verificações
export const useSafeState = <T>(initialValue: T): [T, (value: T) => void] => {
  // Fallback que simula useState sem depender de React
  let currentValue = initialValue;
  const setValue = (newValue: T) => {
    currentValue = newValue;
    // Tentar forçar um re-render se possível
    try {
      if (typeof useState === 'function') {
        // Se React estiver disponível, usar normalmente
        const [, forceUpdate] = useState({});
        forceUpdate({});
      }
    } catch (e) {
      console.log('Re-render failed:', e);
    }
  };

  try {
    // Verificar se useState está disponível antes de usar
    if (typeof useState === 'function') {
      return useState(initialValue);
    } else {
      console.warn('useState não disponível, usando fallback');
      return [currentValue, setValue];
    }
  } catch (error) {
    console.error('useState error:', error);
    return [currentValue, setValue];
  }
};

export const useSafeEffect = (effect: () => void | (() => void), deps?: any[]): void => {
  try {
    // Verificar se useEffect está disponível antes de usar
    if (typeof useEffect === 'function') {
      return useEffect(effect, deps);
    } else {
      console.warn('useEffect não disponível, executando efeito diretamente');
      // Tentar executar o efeito diretamente se React não estiver disponível
      try {
        effect();
      } catch (e) {
        console.warn('Effect execution failed:', e);
      }
      return;
    }
  } catch (error) {
    console.error('useEffect error:', error);
    // Fallback silencioso quando React não está disponível
  }
};