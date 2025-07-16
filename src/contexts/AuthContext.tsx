
import * as React from 'react';
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

  const fetchUserProfile = React.useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  const createUserProfile = React.useCallback((user: User): UserProfile => {
    const isMasterEmail = user.email === 'contato@parkersolucoes.com.br';
    return {
      id: user.id,
      email: user.email || '',
      role: isMasterEmail ? 'master' : 'user'
    };
  }, []);

  const handleAuthStateChange = React.useCallback(async (event: string, session: Session | null) => {
    console.log('Auth state change:', event, !!session?.user);
    
    if (event === 'SIGNED_IN' && session?.user) {
      setSession(session);
      setUser(session.user);
      
      // Fetch user profile
      const profile = await fetchUserProfile(session.user.id);
      if (profile) {
        const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
        const typedProfile: UserProfile = {
          id: profile.id,
          email: profile.email,
          role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
        };
        setUserProfile(typedProfile);
      } else {
        const defaultProfile = createUserProfile(session.user);
        setUserProfile(defaultProfile);
      }
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      setUser(null);
      setUserProfile(null);
    }
  }, [fetchUserProfile, createUserProfile]);

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
        } else if (session?.user && mounted) {
          await handleAuthStateChange('SIGNED_IN', session);
        }
        
        if (mounted) {
          setIsLoading(false);
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
  }, [handleAuthStateChange]);

  const login = React.useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      if (!data.user) {
        console.error('Login failed: no user returned');
        return false;
      }

      console.log('Login successful for:', email);
      return true;
    } catch (error) {
      console.error('Unexpected login error:', error);
      return false;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      console.log('Logging out...');
      await supabase.auth.signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
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
