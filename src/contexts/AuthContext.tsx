// Contexto temporário simples apenas para que a aplicação compile
import React from 'react';

export const useAuth = () => ({
  user: null,
  userProfile: null,
  isMaster: false,
  isAuthenticated: false,
  login: async (email: string, password: string) => false,
  logout: async () => {},
  isLoading: false
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};