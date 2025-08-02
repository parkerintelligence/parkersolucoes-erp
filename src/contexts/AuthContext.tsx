import React from 'react';
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
  resetSessionTimer: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Simple test component to verify React is working
const TestComponent = () => {
  const [test] = React.useState('test');
  return null;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Basic state - start with minimal hooks
  const [isLoading, setIsLoading] = React.useState(true);
  const [isReady, setIsReady] = React.useState(false);
  
  // Initialize with safe defaults
  React.useEffect(() => {
    console.log('AuthProvider initializing...');
    setIsLoading(false);
    setIsReady(true);
  }, []);

  const mockValue: AuthContextType = {
    user: null,
    userProfile: null,
    session: null,
    login: async () => false,
    logout: async () => {},
    isAuthenticated: false,
    isMaster: false,
    isLoading,
    resetSessionTimer: () => {}
  };

  // Don't render children until ready
  if (!isReady) {
    return React.createElement('div', { 
      className: "min-h-screen bg-slate-900 flex items-center justify-center" 
    }, React.createElement('div', { 
      className: "text-lg text-white" 
    }, "Inicializando sistema..."));
  }

  return React.createElement(AuthContext.Provider, { value: mockValue }, 
    React.createElement(TestComponent),
    children
  );
};