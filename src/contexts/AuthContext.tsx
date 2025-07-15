
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
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchUserProfile = React.useCallback(async (userId: string) => {
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
  }, []);

  const handleAuthStateChange = React.useCallback(async (event: string, session: Session | null) => {
    console.log('🔄 Auth state changed:', event, !!session);
    
    if (session?.user && event === 'SIGNED_IN') {
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
        } else {
          // Criar perfil padrão se não existir
          const defaultProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            role: session.user.email === 'contato@parkersolucoes.com.br' ? 'master' : 'user'
          };
          setUserProfile(defaultProfile);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        // Criar perfil padrão mesmo com erro
        const defaultProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.email === 'contato@parkersolucoes.com.br' ? 'master' : 'user'
        };
        setUserProfile(defaultProfile);
      }
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      setUser(null);
      setUserProfile(null);
    }
  }, [fetchUserProfile]);

  React.useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticação...');
        
        // Limpar localStorage corrompido
        try {
          localStorage.removeItem('sb-mpvxppgoyadwukkfoccs-auth-token');
        } catch (e) {
          console.log('Erro ao limpar localStorage:', e);
        }

        // Configurar listener primeiro
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;
            handleAuthStateChange(event, session);
          }
        );

        // Verificar sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setIsLoading(false);
          }
          return subscription;
        }
        
        if (mounted) {
          if (session?.user) {
            console.log('✅ Sessão existente encontrada:', session.user.email);
            await handleAuthStateChange('SIGNED_IN', session);
          } else {
            console.log('ℹ️ Nenhuma sessão existente');
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
          
          setIsLoading(false);
        }

        return subscription;
      } catch (error) {
        console.error('❌ Erro ao inicializar autenticação:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setIsLoading(false);
        }
        return null;
      }
    };

    // Inicializar e guardar a subscription para cleanup
    let subscriptionPromise = initializeAuth();

    // Timeout de segurança para evitar loading infinito
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.log('⚠️ Timeout de segurança ativado - forçando fim do loading');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscriptionPromise.then(subscription => {
        if (subscription) {
          subscription.unsubscribe();
        }
      });
    };
  }, [handleAuthStateChange]);

  const login = React.useCallback(async (email: string, password: string): Promise<boolean> => {
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

  const logout = React.useCallback(async () => {
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

  const value = React.useMemo(() => ({
    user,
    userProfile,
    session,
    login,
    logout,
    isAuthenticated: !!user && !!session,
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    isLoading
  }), [user, userProfile, session, login, logout, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
