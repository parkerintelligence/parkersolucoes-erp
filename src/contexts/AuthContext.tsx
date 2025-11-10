import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isMaster: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Debug logging
  console.log('[useAuth] Context value:', context ? 'exists' : 'NULL');
  console.log('[useAuth] React version check:', typeof useContext);
  
  if (!context) {
    console.error('[useAuth] AuthContext is null! This usually means:');
    console.error('1. Component is rendered outside AuthProvider');
    console.error('2. Multiple React instances are loaded (check Vite config dedupe)');
    console.error('3. Browser cache needs clearing (Ctrl+Shift+R)');
    
    // Return a safe default instead of throwing
    return {
      isAuthenticated: false,
      isLoading: true,
      isMaster: false,
      user: null,
      userProfile: null,
      session: null,
      login: async () => false,
      logout: async () => {},
    };
  }
  
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('[AuthProvider] Rendering - React hooks check:', typeof useState, typeof useEffect);
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('[AuthProvider] State initialized, isLoading:', isLoading);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      // Limpar estados
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Mesmo com erro, limpar estados e redirecionar
      setUser(null);
      setSession(null);
      setUserProfile(null);
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile after successful authentication
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session with error handling for corrupted tokens
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session, clearing corrupted tokens:', error);
          // Clear corrupted tokens
          localStorage.removeItem('sb-mpvxppgoyadwukkfoccs-auth-token');
          localStorage.removeItem('supabase.auth.token');
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserProfile(session.user.id).then(setUserProfile);
        }
        
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Fatal error getting session:', error);
        // Clear all auth data on fatal error
        localStorage.clear();
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    isAuthenticated: !!session && !!user,
    isLoading,
    isMaster: userProfile?.role === 'master',
    user,
    userProfile,
    session,
    login,
    logout,
  };
  
  console.log('[AuthProvider] Providing context value:', {
    isAuthenticated: value.isAuthenticated,
    isLoading: value.isLoading,
    hasUser: !!value.user
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};