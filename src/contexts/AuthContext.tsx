import React from 'react';

// Fallback básico se React não estiver disponível
const SafeReact = React || (window as any).React || require('react');

console.log('AuthContext - SafeReact disponível:', !!SafeReact);
console.log('AuthContext - useState disponível:', !!SafeReact?.useState);

// Context simples temporário para debugging
const AuthContext = SafeReact.createContext({
  isAuthenticated: false,
  isMaster: false,
  isLoading: false,
  user: null,
  userProfile: null,
  session: null,
  login: async () => false,
  logout: async () => {},
  resetSessionTimer: () => {}
});

export const useAuth = () => {
  return SafeReact.useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider renderizando...');
  
  // Versão simplificada sem useState para testar
  const value = {
    isAuthenticated: false,
    isMaster: false,
    isLoading: false,
    user: null,
    userProfile: null,
    session: null,
    login: async () => false,
    logout: async () => {},
    resetSessionTimer: () => {}
  };

  return SafeReact.createElement(AuthContext.Provider, { value }, children);
};