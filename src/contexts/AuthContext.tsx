import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  session: null,
  login: async () => false,
  logout: async () => {},
  isAuthenticated: false,
  isMaster: false,
  isLoading: true,
  resetSessionTimer: () => {}
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        console.error('Login error:', error.message);
        return false;
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSessionTimer = () => {
    // Implementation for session timer reset if needed
  };

  useEffect(() => {
    let mounted = true;
    
    console.log('AuthContext: Initializing authentication...');
    
    // Set up auth state listener - CRITICAL: No async calls here
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, !!session, session?.user?.id);
        
        // Only synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false); // CRITICAL: Always set loading to false here
        
        // Defer profile fetching to avoid conflicts
        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).then(profile => {
                if (mounted) {
                  setUserProfile(profile);
                }
              }).catch(error => {
                console.error('Error fetching profile after auth change:', error);
              });
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Initial session check:', !!session, error?.message);
        
        if (error) {
          console.error('Session error:', error);
          setIsLoading(false);
          return;
        }
        
        // Set initial state
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false); // CRITICAL: Always set loading to false
        
        // Fetch profile separately
        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.error('Error fetching initial profile:', profileError);
            // Don't block authentication for profile errors
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // More aggressive safety timeout
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth timeout - forcing loading to false (emergency fallback)');
        setIsLoading(false);
      }
    }, 2000); // Reduced from 5000 to 2000

    return () => {
      console.log('AuthContext: Cleaning up...');
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated: !!user,
    isMaster: userProfile?.role === 'master',
    isLoading,
    resetSessionTimer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};