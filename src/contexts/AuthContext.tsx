import React from 'react';

interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'master';
}

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  session: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isMaster: boolean;
  isLoading: boolean;
}

// Valor padrão temporário sem contexto React para evitar hooks
const defaultAuth: AuthContextType = {
  user: null,
  userProfile: null,
  session: null,
  login: async () => true,
  logout: async () => {},
  isAuthenticated: false,
  isMaster: true,
  isLoading: false,
};

export const useAuth = () => {
  return defaultAuth;
};

// Provider que apenas retorna children sem contexto ou hooks
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};