
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
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil do usuário:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        // Não forçar logout por erro de RLS - continuar com dados básicos
        return {
          id: userId,
          email: '',
          role: 'user'
        };
      }

      if (!data) {
        console.log('Perfil não encontrado, usando dados padrão');
        return {
          id: userId,
          email: '',
          role: 'user'
        };
      }

      console.log('Perfil do usuário encontrado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      // Fallback para evitar quebrar a sessão
      return {
        id: userId,
        email: '',
        role: 'user'
      };
    }
  };

  const startSessionTimer = () => {
    // Limpar timer existente
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
    
    // Criar novo timer para 2 horas (7200000 ms) - mais tempo para evitar logout prematuro
    const timer = setTimeout(async () => {
      console.log('Sessão expirada após 2 horas, fazendo logout...');
      console.log('Timer disparado - usuário ativo:', !!user);
      console.log('Perfil atual:', userProfile);
      
      // Verificar se ainda existe sessão ativa antes de fazer logout
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log('Sessão ainda válida, mas timer expirou - fazendo logout');
          await logout();
        } else {
          console.log('Sessão já expirou anteriormente');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        await logout();
      }
    }, 2 * 60 * 60 * 1000);
    
    setSessionTimer(timer);
    console.log('Timer de sessão iniciado: 2 horas');
  };

  const resetSessionTimer = () => {
    if (user && session) {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
      startSessionTimer();
      console.log('Timer de sessão resetado');
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
              const isMasterEmail = session.user.email === 'contato@parkersolucoes.com.br';
              const typedProfile: UserProfile = {
                id: profile.id,
                email: session.user.email || profile.email,
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
          
          // Buscar perfil do usuário sem setTimeout para evitar race conditions
          const profile = await fetchUserProfile(session.user.id);
          if (profile && mounted) {
            const isMasterEmail = session.user.email === 'contato@parkersolucoes.com.br';
            const typedProfile: UserProfile = {
              id: profile.id,
              email: session.user.email || profile.email,
              role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
            };
            console.log('Perfil atualizado:', typedProfile);
            setUserProfile(typedProfile);
          }
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
      console.log('=== INICIANDO LOGOUT ===');
      console.log('Stack trace:', new Error().stack);
      console.log('Usuário atual:', user?.email);
      console.log('Perfil atual:', userProfile);
      console.log('Session timer ativo:', !!sessionTimer);
      
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        setSessionTimer(null);
        console.log('Session timer limpo');
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      console.log('=== LOGOUT CONCLUÍDO ===');
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
