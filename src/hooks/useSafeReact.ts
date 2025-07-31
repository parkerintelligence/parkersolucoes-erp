import { useState as reactUseState, useEffect as reactUseEffect, ReactNode } from 'react';

// Safe wrappers para hooks do React
export const useSafeState = <T>(initialValue: T): [T, (value: T) => void] => {
  try {
    return reactUseState(initialValue);
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
    return reactUseEffect(effect, deps);
  } catch (error) {
    console.error('useEffect error:', error);
    // Fallback silencioso quando React não está disponível
  }
};

// Verificação se React está completamente carregado
export const isReactReady = (): boolean => {
  try {
    return typeof reactUseState === 'function' && typeof reactUseEffect === 'function';
  } catch {
    return false;
  }
};