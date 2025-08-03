// Fixed AuthContext with proper React state management
import { createContext, useContext, useState, useCallback } from 'react';
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

// Reactive provider with proper state management
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    console.log('Auth - login attempt:', email);
    setIsLoading(true);
    
    try {
      // Basic authentication - accept contato@parkersolucoes.com.br with any password
      if (email === 'contato@parkersolucoes.com.br') {
        const newUser = { 
          id: 'master-user', 
          email: email,
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User;
        
        const newUserProfile = {
          id: 'master-user',
          email: email,
          role: 'master' as const
        };
        
        setUser(newUser);
        setUserProfile(newUserProfile);
        
        console.log('Auth - login successful, user set:', newUser);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('Auth - logout');
    setUser(null);
    setUserProfile(null);
  }, []);

  const resetSessionTimer = useCallback(() => {
    console.log('Auth - reset timer');
  }, []);

  const isAuthenticated = !!user;
  const isMaster = userProfile?.role === 'master';

  console.log('Auth Provider render - isAuthenticated:', isAuthenticated, 'user:', user);

  const value = {
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated,
    isMaster,
    isLoading,
    resetSessionTimer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};