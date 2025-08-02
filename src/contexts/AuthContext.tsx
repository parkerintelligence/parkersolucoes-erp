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
  resetSessionTimer: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sessionTimer, setSessionTimer] = React.useState<NodeJS.Timeout | null>(null);
  const [isReady, setIsReady] = React.useState(false);

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

  const startSessionTimer = React.useCallback(() => {
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
    console.log('Timer de sessão iniciado: 30 minutos');
  }, [sessionTimer]);

  const resetSessionTimer = React.useCallback(() => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      startSessionTimer();
      console.log('Timer de sessão resetado');
    }
  }, [sessionTimer, startSessionTimer]);

  React.useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

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
          setIsReady(true);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    // Safety timeout to prevent infinite loading
    initTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Auth initialization timeout reached, forcing loading to false');
        setIsLoading(false);
      }
    }, 10000);

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
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Tentando fazer login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        return false;
      }

      console.log('Login bem-sucedido para:', email);
      return !!data.user;
    } catch (error) {
      console.error('Erro no login:', error);
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

  // Don't render children until the context is ready
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-lg text-white">Inicializando sistema...</div>
      </div>
    );
  }

  console.log('AuthContext Estado:', { 
    isAuthenticated: !!user && !!session, 
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    userEmail: user?.email,
    userRole: userProfile?.role,
    isLoading
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};