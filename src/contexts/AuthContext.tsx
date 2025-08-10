import * as React from 'react';

// Minimal AuthContext just to test React works
const AuthContext = React.createContext(null);

export const useAuth = () => {
  return {
    isAuthenticated: false,
    isLoading: false,
    isMaster: false,
    user: null,
    userProfile: null,
    session: null,
    login: async (email: string, password: string) => false,
    logout: async () => {}
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value = {
    isAuthenticated: false,
    isLoading: false,
    isMaster: false,
    user: null,
    userProfile: null,
    session: null,
    login: async (email: string, password: string) => false,
    logout: async () => {}
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};