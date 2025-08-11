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
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider initializing, React available:', typeof React.useState);
  
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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
        // Se não encontrar perfil, criar um perfil básico
        const basicProfile = {
          id: userId,
          email: '',
          role: 'user' as const
        };
        return basicProfile;
      }

      console.log('Perfil do usuário encontrado:', data);
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
            
            // Buscar perfil do usuário de forma assíncrona
            fetchUserProfile(session.user.id).then(profile => {
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
            }).catch(error => {
              console.error('Erro ao buscar perfil:', error);
            });
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
      (event, session) => {
        if (!mounted) return;
        
        console.log('Estado de autenticação alterado:', event, session?.user?.email || 'Logout');
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Buscar perfil do usuário de forma assíncrona
          fetchUserProfile(session.user.id).then(profile => {
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
          }).catch(error => {
            console.error('Erro ao atualizar perfil:', error);
          });
        } else {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
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
    isAuthenticated: !!session,
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    isLoading
  };

  console.log('AuthContext Estado:', { 
    isAuthenticated: !!session, 
    isMaster: userProfile?.role === 'master' || user?.email === 'contato@parkersolucoes.com.br',
    userEmail: user?.email,
    userRole: userProfile?.role,
    isLoading,
    hasSession: !!session
  });

  return React.createElement(AuthContext.Provider, { value }, children);
};