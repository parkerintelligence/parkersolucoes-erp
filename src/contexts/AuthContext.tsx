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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
  };

  const startSessionTimer = () => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
    
    const timer = setTimeout(async () => {
      console.log('Sessão expirada após 30 minutos, fazendo logout...');
      await logout();
    }, 30 * 60 * 1000);
    
    setSessionTimer(timer);
  };

  const resetSessionTimer = () => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      startSessionTimer();
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted) {
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            startSessionTimer();
            
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
              const typedProfile: UserProfile = {
                id: profile.id,
                email: profile.email,
                role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
              };
              setUserProfile(typedProfile);
            }
          } else {
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          startSessionTimer();
          
          setTimeout(async () => {
            if (!mounted) return;
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
              const typedProfile: UserProfile = {
                id: profile.id,
                email: profile.email,
                role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
              };
              setUserProfile(typedProfile);
            }
          }, 0);
        } else {
          if (sessionTimer) {
            clearTimeout(sessionTimer);
            setSessionTimer(null);
          }
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        setSessionTimer(null);
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const value = {
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated: !!user && !!session,
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    isLoading,
    resetSessionTimer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};