import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'master';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isMaster: boolean;
  isLoading: boolean;
}

// Criar contexto com valor padrão temporário
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  session: null,
  login: async () => false,
  logout: async () => {},
  isAuthenticated: false,
  isMaster: false,
  isLoading: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

// Provider simplificado temporariamente
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // Estado temporário simplificado
  const value = {
    user: null,
    userProfile: null,
    session: null,
    login: async () => true, // Mock sempre sucesso para testar
    logout: async () => {},
    isAuthenticated: false,
    isMaster: true, // Mock como master para acessar tudo
    isLoading: false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};