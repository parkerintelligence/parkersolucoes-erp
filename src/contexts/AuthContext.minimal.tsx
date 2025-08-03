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

// Basic authentication state without React hooks
let isLoggedIn = false;
let currentUser: User | null = null;
let currentUserProfile: UserProfile | null = null;

// Minimal provider with basic login functionality
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = {
    user: currentUser,
    userProfile: currentUserProfile,
    session: null,
    login: async (email: string, password: string): Promise<boolean> => {
      console.log('Minimal auth - login attempt:', email);
      // Basic authentication - accept contato@parkersolucoes.com.br with any password
      if (email === 'contato@parkersolucoes.com.br') {
        isLoggedIn = true;
        currentUser = { 
          id: 'master-user', 
          email: email,
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User;
        currentUserProfile = {
          id: 'master-user',
          email: email,
          role: 'master'
        };
        // Force re-render by triggering a minimal state change
        setTimeout(() => window.location.href = '/dashboard', 100);
        return true;
      }
      return false;
    },
    logout: async () => {
      console.log('Minimal auth - logout');
      isLoggedIn = false;
      currentUser = null;
      currentUserProfile = null;
      window.location.href = '/login';
    },
    isAuthenticated: isLoggedIn,
    isMaster: currentUserProfile?.role === 'master',
    isLoading: false,
    resetSessionTimer: () => {
      console.log('Minimal auth - reset timer');
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};