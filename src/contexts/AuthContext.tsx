
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  logout: () => void;
  isAuthenticated: boolean;
  isMaster: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('User profile fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check for existing session first
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        console.log('Initial session check:', session?.user?.email);
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
            const typedProfile: UserProfile = {
              id: profile.id,
              email: profile.email,
              role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
            };
            console.log('Setting initial user profile:', typedProfile);
            setUserProfile(typedProfile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
            const typedProfile: UserProfile = {
              id: profile.id,
              email: profile.email,
              role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
            };
            console.log('Setting user profile from auth change:', typedProfile);
            setUserProfile(typedProfile);
          }
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

      console.log('Login successful for:', email);
      return !!data.user;
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

  const value = {
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated: !!user,
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    isLoading
  };

  console.log('AuthContext value:', { 
    isAuthenticated: !!user, 
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    userEmail: user?.email,
    userRole: userProfile?.role,
    isLoading
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
