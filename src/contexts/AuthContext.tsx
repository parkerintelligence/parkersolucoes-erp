
import * as React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef, useContext, createContext } from 'react';
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
  const [retryCount, setRetryCount] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const processedSessionsRef = useRef<Set<string>>(new Set());

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Buscando perfil do usuário:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar perfil do usuário:', error);
        return null;
      }

      console.log('✅ Perfil encontrado:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil do usuário:', error);
      return null;
    }
  }, []);

  const createUserProfile = useCallback((user: User): UserProfile => {
    const isMasterEmail = user.email === 'contato@parkersolucoes.com.br';
    return {
      id: user.id,
      email: user.email || '',
      role: isMasterEmail ? 'master' : 'user'
    };
  }, []);

  const processSession = useCallback(async (session: Session | null, skipDuplicateCheck = false) => {
    if (!session?.user) {
      console.log('🚫 Nenhuma sessão válida para processar');
      setSession(null);
      setUser(null);
      setUserProfile(null);
      return;
    }

    // Evitar processamento duplicado
    const sessionKey = `${session.user.id}-${session.access_token.substring(0, 10)}`;
    if (!skipDuplicateCheck && processedSessionsRef.current.has(sessionKey)) {
      console.log('⚠️ Sessão já processada, ignorando:', sessionKey);
      return;
    }

    processedSessionsRef.current.add(sessionKey);
    console.log('🔄 Processando sessão:', session.user.email, sessionKey);

    // Atualizar estado básico imediatamente
    setSession(session);
    setUser(session.user);

    // Buscar perfil do usuário
    try {
      const profile = await fetchUserProfile(session.user.id);
      if (profile) {
        const isMasterEmail = profile.email === 'contato@parkersolucoes.com.br';
        const typedProfile: UserProfile = {
          id: profile.id,
          email: profile.email,
          role: (isMasterEmail || profile.role === 'master') ? 'master' : 'user'
        };
        setUserProfile(typedProfile);
        console.log('✅ Perfil do usuário definido:', typedProfile);
      } else {
        // Criar perfil padrão se não existir
        const defaultProfile = createUserProfile(session.user);
        setUserProfile(defaultProfile);
        console.log('✅ Perfil padrão criado:', defaultProfile);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar perfil, usando padrão:', error);
      const defaultProfile = createUserProfile(session.user);
      setUserProfile(defaultProfile);
    }
  }, [fetchUserProfile, createUserProfile]);

  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('🔄 Auth state change:', event, !!session?.user);
    
    if (event === 'SIGNED_IN' && session?.user) {
      await processSession(session);
    } else if (event === 'SIGNED_OUT') {
      console.log('🚪 Usuário deslogado');
      processedSessionsRef.current.clear();
      setSession(null);
      setUser(null);
      setUserProfile(null);
    }
  }, [processSession]);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticação...');
        setIsLoading(true);
        setInitError(null); // Clear any previous errors
        
        // Limpar localStorage corrompido e session refs
        try {
          localStorage.removeItem('sb-mpvxppgoyadwukkfoccs-auth-token');
          processedSessionsRef.current.clear();
        } catch (e) {
          console.log('Erro ao limpar localStorage:', e);
        }

        // Configurar listener primeiro
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) {
              console.log('🚫 Componente desmontado, ignorando evento:', event);
              return;
            }
            console.log('🔔 Auth listener triggered:', event);
            handleAuthStateChange(event, session).catch(err => {
              console.error('Erro no handleAuthStateChange:', err);
            });
          }
        );
        
        subscription = authSubscription;

        // Verificar sessão atual - SEM chamar handleAuthStateChange novamente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          if (retryCount < 3) {
            console.log(`🔄 Tentativa ${retryCount + 1}/3 de retry...`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              if (mounted) initializeAuth();
            }, 1000 * (retryCount + 1));
            return;
          }
          
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
            console.log('✅ Sessão existente encontrada:', session.user.email);
            // Processar sessão diretamente, sem duplicar com o listener
            await processSession(session, true);
          } else {
            console.log('ℹ️ Nenhuma sessão existente');
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
          
          setIsLoading(false);
          setRetryCount(0);
          console.log('✅ Inicialização de auth completa');
        }
      } catch (error) {
        console.error('❌ Erro crítico ao inicializar autenticação:', error);
        if (mounted) {
          if (retryCount < 3) {
            console.log(`🔄 Retry após erro: ${retryCount + 1}/3`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              if (mounted) initializeAuth();
            }, 2000 * (retryCount + 1));
          } else {
            console.error('❌ Máximo de tentativas excedido, usando modo de erro');
            setInitError(`Falha na inicialização após 3 tentativas: ${error}`);
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setIsLoading(false);
          }
        }
      }
    };

    // Wrap initialization in try-catch to prevent provider from failing completely
    try {
      initializeAuth();
    } catch (error) {
      console.error('❌ Erro fatal na inicialização do AuthProvider:', error);
      setInitError(`Erro fatal: ${error}`);
      setIsLoading(false);
    }

    // Timeout de segurança mais curto
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⚠️ Timeout de segurança ativado - forçando fim do loading');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Erro ao desinscrever subscription:', error);
        }
      }
    };
  }, []); // Remover dependência que causa loops

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
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
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated: !!user && !!session,
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    isLoading
  }), [user, userProfile, session, login, logout, isLoading]);

  // If there's an initialization error, still provide the context with safe defaults
  if (initError) {
    console.error('AuthProvider initialization error:', initError);
    const errorValue = {
      user: null,
      userProfile: null,
      session: null,
      login: async () => false,
      logout: async () => {},
      isAuthenticated: false,
      isMaster: false,
      isLoading: false
    };
    return <AuthContext.Provider value={errorValue}>{children}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
