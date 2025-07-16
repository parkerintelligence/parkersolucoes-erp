
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
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Create user profile from user data
  const createUserProfile = (user: User): UserProfile => {
    const isMasterEmail = user.email === 'contato@parkersolucoes.com.br';
    return {
      id: user.id,
      email: user.email || '',
      role: isMasterEmail ? 'master' : 'user'
    };
  };

  // Handle auth state changes
  const handleAuthStateChange = (event: string, session: Session | null) => {
    console.log('Auth state change:', event, !!session?.user);
    
    if (session?.user) {
      setSession(session);
      setUser(session.user);
      setUserProfile(createUserProfile(session.user));
    } else {
      setSession(null);
      setUser(null);
      setUserProfile(null);
    }
    
    setIsLoading(false);
  };

  React.useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (mounted) {
              handleAuthStateChange(event, session);
            }
          }
        );

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (mounted) {
          handleAuthStateChange('INITIAL_SESSION', session);
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (!data.user) {
        console.error('Login failed: no user returned');
        setIsLoading(false);
        return false;
      }

      console.log('Login successful for:', email);
      // Loading will be set to false by the auth state change handler
      return true;
    } catch (error) {
      console.error('Unexpected login error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      console.log('Logging out...');
      setIsLoading(true);
      await supabase.auth.signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  }, []);

  const value = React.useMemo(() => ({
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated: !!user && !!session,
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    isLoading
  }), [user, userProfile, session, login, logout, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
