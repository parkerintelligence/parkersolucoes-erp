import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProviderComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile after successful authentication
          setTimeout(async () => {
            if (!mounted) return;
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setUserProfile(profile);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          if (mounted) {
            setUserProfile(profile);
          }
        });
      }
      
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Wrap with error boundary to catch any hook issues
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  try {
    return <AuthProviderComponent>{children}</AuthProviderComponent>;
  } catch (error) {
    console.error('AuthProvider Error:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Erro de Autenticação
          </h2>
          <p className="text-sm text-muted-foreground">
            Recarregue a página para tentar novamente.
          </p>
        </div>
      </div>
    );
  }
};