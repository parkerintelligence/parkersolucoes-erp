// Minimal AuthContext to bypass useState null error
// This is a temporary replacement while we fix the Vite cache issue

import { createContext, useContext } from 'react';
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
  resetSessionTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Minimal provider without useState - just static values for now
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = {
    user: null,
    userProfile: null,
    session: null,
    login: async (email: string, password: string): Promise<boolean> => {
      console.log('Minimal auth - login attempt:', email);
      return false;
    },
    logout: async () => {
      console.log('Minimal auth - logout');
    },
    isAuthenticated: false,
    isMaster: false,
    isLoading: false,
    resetSessionTimer: () => {
      console.log('Minimal auth - reset timer');
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};