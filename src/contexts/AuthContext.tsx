
import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (mounted) {
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            
            // Criar perfil simplificado baseado apenas no email
            const isMasterEmail = session.user.email === 'contato@parkersolucoes.com.br';
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              role: isMasterEmail ? 'master' : 'user'
            };
            setUserProfile(profile);
          } else {
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Timeout de segurança para evitar loading infinito
    initTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Timeout de inicialização - forçando estado não autenticado');
        setIsLoading(false);
        setSession(null);
        setUser(null);
        setUserProfile(null);
      }
    }, 10000);

    initializeAuth();

    // Listener simplificado de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          const isMasterEmail = session.user.email === 'contato@parkersolucoes.com.br';
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            role: isMasterEmail ? 'master' : 'user'
          };
          setUserProfile(profile);
        } else {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const resetSessionTimer = () => {
    // Função vazia - removido timer de sessão para simplificar
  };

  const value = {
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated: !!user && !!session,
    isMaster: userProfile?.role === 'master',
    isLoading,
    resetSessionTimer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
