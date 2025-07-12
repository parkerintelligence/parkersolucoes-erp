
import * as React from 'react';
const { createContext, useContext, useState, useEffect } = React;
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
      console.log('Buscando perfil do usuário:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return null;
      }

      console.log('Perfil do usuário encontrado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
  };

  const startSessionTimer = () => {
    // Limpar timer existente
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
    
    // Criar novo timer para 30 minutos (1800000 ms)
    const timer = setTimeout(async () => {
      console.log('Sessão expirada após 30 minutos, fazendo logout...');
      await logout();
    }, 30 * 60 * 1000);
    
    setSessionTimer(timer);
    console.log('Timer de sessão iniciado/renovado: 30 minutos');
  };

  const resetSessionTimer = () => {
    // Só resetar se tiver usuário e sessão válidos
    if (session && user && sessionTimer) {
      console.log('Timer de sessão resetado por atividade do usuário');
      startSessionTimer();
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Inicializando autenticação...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted) {
          console.log('Sessão inicial:', session?.user?.email || 'Nenhuma sessão');
          
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            startSessionTimer(); // Iniciar timer de sessão
            
            // Buscar perfil do usuário
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
              const typedProfile: UserProfile = {
                id: profile.id,
                email: profile.email,
                role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
              };
              console.log('Perfil do usuário definido:', typedProfile);
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

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Estado de autenticação alterado:', event, session?.user?.email || 'Logout');
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          startSessionTimer(); // Iniciar timer de sessão
          
          // Buscar perfil do usuário
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
              console.log('Perfil atualizado:', typedProfile);
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
      console.log('🔐 Tentando fazer login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        return false;
      }

      if (!data.user) {
        console.error('❌ Login sem usuário retornado');
        return false;
      }

      console.log('✅ Login bem-sucedido para:', email);
      console.log('👤 Usuário:', data.user.id);
      console.log('🔑 Sessão:', !!data.session);
      
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('Fazendo logout...');
      
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        setSessionTimer(null);
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      console.log('Logout realizado com sucesso');
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

  console.log('AuthContext Estado:', { 
    isAuthenticated: !!user && !!session, 
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    userEmail: user?.email,
    userRole: userProfile?.role,
    isLoading
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
