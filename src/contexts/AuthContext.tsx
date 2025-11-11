import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
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
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('[AuthProvider] State initialized, isLoading:', isLoading);

  const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

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
      
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
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

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (!session || !user) return;

    const now = Date.now();
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (lastActivity) {
      const timeSinceActivity = now - parseInt(lastActivity);
      if (timeSinceActivity < 1000) {
        return;
      }
    }
    
    localStorage.setItem('lastActivity', now.toString());

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.log('Usuário inativo por 4 horas, fazendo logout...');
      logout();
    }, INACTIVITY_TIMEOUT);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, user, INACTIVITY_TIMEOUT]);

  // Set up activity listeners
  useEffect(() => {
    if (!session || !user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Reset timer on any activity
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Initialize timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [session, user, resetInactivityTimer]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        // Ignore token refresh events to prevent unnecessary updates
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed, maintaining current session');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile after successful authentication
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // Only clear profile on explicit sign out
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
          // Don't clear tokens on network errors or temporary issues
          // Only set loading to false and let the user retry
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
        console.error('Error getting session:', error);
        // Don't clear localStorage on errors - this is too aggressive
        // Just set loading to false
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