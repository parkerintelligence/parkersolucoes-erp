// React null reference fix utility
// This ensures React hooks are never null globally across the application

import * as React from 'react';

// Ensure React is globally available
if (typeof window !== 'undefined') {
  (window as any).React = React;
  
  // Backup hook references to prevent null issues
  const originalUseState = React.useState;
  const originalUseEffect = React.useEffect;
  const originalUseContext = React.useContext;
  
  // Override React namespace to ensure hooks are never null
  Object.defineProperty(React, 'useState', {
    get() {
      return originalUseState || (() => { throw new Error('React.useState is not available'); });
    },
    configurable: false
  });
  
  Object.defineProperty(React, 'useEffect', {
    get() {
      return originalUseEffect || (() => { throw new Error('React.useEffect is not available'); });
    },
    configurable: false
  });
  
  Object.defineProperty(React, 'useContext', {
    get() {
      return originalUseContext || (() => { throw new Error('React.useContext is not available'); });
    },
    configurable: false
  });
}

// Export all React components and hooks
export const { 
  useState, 
  useEffect, 
  useContext, 
  createContext,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
  useReducer
} = React;

export default React;