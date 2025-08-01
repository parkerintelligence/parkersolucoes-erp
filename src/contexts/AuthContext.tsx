import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Debug: Verificar instância do React
console.log('🔍 AuthContext React version:', React.version, React);

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

// Componente com fallback para erro de hooks
const AuthProviderInternal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔍 AuthProviderInternal rendering, React available:', !!React);
  
  // Tentar usar hooks do React de forma segura
  let user, setUser, session, setSession, userProfile, setUserProfile, isLoading, setIsLoading;
  let sessionTimerRef, sessionTimerIdRef;
  
  try {
    [user, setUser] = React.useState<User | null>(null);
    [session, setSession] = React.useState<Session | null>(null);
    [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    [isLoading, setIsLoading] = React.useState(true);
    
    sessionTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    sessionTimerIdRef = React.useRef<string | null>(null);
    
    console.log('✅ Hooks inicializados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar hooks:', error);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui'
      }}>
        <div>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Erro de Inicialização</h1>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Problemas na inicialização do React. Tentando recarregar...
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

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

  const validateSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.log('🔍 Sessão inválida ou expirada no Supabase');
        return false;
      }
      
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
    clearSessionTimer();
    
    if (!session || !user) {
      console.log('⚠️ Não pode criar timer - usuário ou sessão não disponível');
      return;
    }
    
    const timerId = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionTimerIdRef.current = timerId;
    
    sessionTimerRef.current = setTimeout(async () => {
      console.log('⏰ Timer de 30 minutos executado:', timerId);
      
      if (sessionTimerIdRef.current !== timerId) {
        console.log('⚠️ Timer desatualizado, ignorando:', timerId);
        return;
      }
      
      const isValid = await validateSession();
      if (isValid) {
        console.log('✅ Sessão ainda válida, renovando timer em vez de logout');
        startSessionTimer();
        return;
      }
      
      console.log('❌ Sessão expirada após 30 minutos, fazendo logout...');
      await logout();
    }, 30 * 60 * 1000);
  }, [session, user, clearSessionTimer]);

  const resetSessionTimer = React.useCallback(() => {
    if (!session || !user) {
      return;
    }
    startSessionTimer();
  }, [session, user, startSessionTimer]);

  React.useEffect(() => {
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
              
              console.log('🎯 Iniciando timer de sessão após inicialização completa');
              startSessionTimer();
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
        
        console.log('Estado de autenticação alterado:', event, session?.user?.email || 'Logout');
        
        if (session?.user && event === 'SIGNED_IN') {
          console.log('🔄 Novo login detectado');
          setSession(session);
          setUser(session.user);
          
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
            
            console.log('🎯 Iniciando timer de sessão após novo login');
            startSessionTimer();
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 Logout detectado');
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
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wrapper com error boundary interno
  try {
    return <AuthProviderInternal>{children}</AuthProviderInternal>;
  } catch (error) {
    console.error('❌ Erro crítico no AuthProvider:', error);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h1>Erro na Autenticação</h1>
          <p>Não foi possível inicializar o sistema de autenticação.</p>
          <button onClick={() => window.location.reload()}>
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
};