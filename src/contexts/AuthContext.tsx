
import * as React from 'react';
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
  if (!React || !React.useContext) {
    throw new Error('React hooks not available');
  }
  
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if React hooks are available before using them
  if (!React || !React.useState || !React.useEffect || !React.useRef || !React.useCallback) {
    return <>{children}</>;
  }

  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Usar useRef para o timer para evitar re-renders desnecessários
  const sessionTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const sessionTimerIdRef = React.useRef<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

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

  // Verificar se a sessão ainda é válida no Supabase
  const validateSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.log('🔍 Sessão inválida ou expirada no Supabase');
        return false;
      }
      
      // Verificar se o token ainda é válido (não expirou)
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('🔍 Token de sessão expirado');
        return false;
      }
      
      console.log('✅ Sessão válida no Supabase');
      return true;
    } catch (error) {
      console.error('❌ Erro ao validar sessão:', error);
      return false;
    }
  };

  const clearSessionTimer = React.useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
      sessionTimerIdRef.current = null;
    }
  }, []);

  const startSessionTimer = React.useCallback(() => {
    // Primeiro, limpar qualquer timer existente
    clearSessionTimer();
    
    // Só criar timer se estiver autenticado
    if (!session || !user) {
      console.log('⚠️ Não pode criar timer - usuário ou sessão não disponível');
      return;
    }
    
    // Gerar ID único para este timer
    const timerId = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionTimerIdRef.current = timerId;
    
    // Criar novo timer para 30 minutos (1800000 ms)
    sessionTimerRef.current = setTimeout(async () => {
      console.log('⏰ Timer de 30 minutos executado:', timerId);
      
      // Verificar se este é ainda o timer ativo
      if (sessionTimerIdRef.current !== timerId) {
        console.log('⚠️ Timer desatualizado, ignorando:', timerId);
        return;
      }
      
      // Verificar se a sessão ainda é válida antes de fazer logout
      const isValid = await validateSession();
      if (isValid) {
        console.log('✅ Sessão ainda válida, renovando timer em vez de logout');
        startSessionTimer(); // Renovar o timer
        return;
      }
      
      console.log('❌ Sessão expirada após 30 minutos, fazendo logout...');
      await logout();
    }, 30 * 60 * 1000);
    
    // Timer iniciado silenciosamente para melhorar performance
  }, [session, user, clearSessionTimer]);

  const resetSessionTimer = React.useCallback(() => {
    // Só resetar se tiver usuário e sessão válidos
    if (!session || !user) {
      return;
    }
    
    startSessionTimer();
  }, [session, user, startSessionTimer]);

  React.useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Primeiro, limpar qualquer sessão corrompida
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          // Limpar sessão corrompida
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted) {
          if (session?.user) {
            // Verificar se o token é válido
            const now = Math.floor(Date.now() / 1000);
            if (session.expires_at && session.expires_at < now) {
              console.log('🔍 Token expirado, fazendo logout');
              await supabase.auth.signOut();
              setUser(null);
              setSession(null);
              setUserProfile(null);
              setIsLoading(false);
              return;
            }
            
            setSession(session);
            setUser(session.user);
            
            // Buscar perfil do usuário em background
            setTimeout(async () => {
              try {
                const profile = await fetchUserProfile(session.user.id);
                if (profile && mounted) {
                  const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
                  const typedProfile: UserProfile = {
                    id: profile.id,
                    email: profile.email,
                    role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
                  };
                  setUserProfile(typedProfile);
                  startSessionTimer();
                } else if (mounted) {
                  // Criar perfil padrão se não existir
                  const defaultProfile: UserProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    role: session.user.email === 'contato@parkersolucoes.com.br' ? 'master' : 'user'
                  };
                  setUserProfile(defaultProfile);
                  startSessionTimer();
                }
              } catch (profileError) {
                console.error('Erro ao buscar perfil:', profileError);
                // Criar perfil padrão mesmo com erro
                if (mounted) {
                  const defaultProfile: UserProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    role: session.user.email === 'contato@parkersolucoes.com.br' ? 'master' : 'user'
                  };
                  setUserProfile(defaultProfile);
                  startSessionTimer();
                }
              }
            }, 0);
          } else {
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
          
          // Sempre definir loading como false após processar
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        // Em caso de erro, limpar tudo e mostrar login
        if (mounted) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user && event === 'SIGNED_IN') {
          setSession(session);
          setUser(session.user);
          
          // Buscar perfil em background sem bloquear
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
              const typedProfile: UserProfile = {
                id: profile.id,
                email: profile.email,
                role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
              };
              setUserProfile(typedProfile);
              startSessionTimer();
            }
          } catch (error) {
            console.error('Erro ao buscar perfil durante login:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          clearSessionTimer();
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearSessionTimer();
      subscription.unsubscribe();
    };
  }, [clearSessionTimer, startSessionTimer]);

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
      console.log('🚪 Fazendo logout...');
      
      // Limpar timer de sessão
      clearSessionTimer();
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
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
