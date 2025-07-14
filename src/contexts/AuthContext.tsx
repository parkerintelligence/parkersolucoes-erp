
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


  React.useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Limpar localStorage corrompido
        try {
          localStorage.removeItem('sb-mpvxppgoyadwukkfoccs-auth-token');
        } catch (e) {
          console.log('Erro ao limpar localStorage:', e);
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
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
            setSession(session);
            setUser(session.user);
            
            // Buscar perfil do usuário em background
            setTimeout(async () => {
              if (!mounted) return;
              
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
                } else if (mounted) {
                  // Criar perfil padrão se não existir
                  const defaultProfile: UserProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    role: session.user.email === 'contato@parkersolucoes.com.br' ? 'master' : 'user'
                  };
                  setUserProfile(defaultProfile);
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
                }
              }
            }, 0);
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
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setIsLoading(false);
        }
      }
    };

    // Configurar listener primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, !!session);
        
        if (session?.user && event === 'SIGNED_IN') {
          setSession(session);
          setUser(session.user);
          
          // Buscar perfil em background
          setTimeout(async () => {
            if (!mounted) return;
            
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
              } else if (mounted) {
                const defaultProfile: UserProfile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  role: session.user.email === 'contato@parkersolucoes.com.br' ? 'master' : 'user'
                };
                setUserProfile(defaultProfile);
              }
            } catch (error) {
              console.error('Erro ao buscar perfil durante login:', error);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    // Inicializar depois
    initializeAuth();

    // Timeout de segurança para evitar loading infinito
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Timeout de segurança ativado - forçando fim do loading');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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
      console.log('🚪 Fazendo logout...');
      
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
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
