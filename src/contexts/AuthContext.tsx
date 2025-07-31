import { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSafeState, useSafeEffect, isReactReady } from '@/hooks/useSafeReact';

interface AuthContextType {
  isAuthenticated: boolean;
  isMaster: boolean;
  isLoading: boolean;
  user: User | null;
  userProfile: any;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetSessionTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Verificar se React está pronto antes de usar hooks
  if (!isReactReady()) {
    console.warn('React hooks não estão prontos, renderizando fallback');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-lg">Inicializando autenticação...</div>
      </div>
    );
  }

  const [user, setUser] = useSafeState<User | null>(null);
  const [session, setSession] = useSafeState<Session | null>(null);
  const [userProfile, setUserProfile] = useSafeState<any>(null);
  const [isLoading, setIsLoading] = useSafeState(true);

  useSafeEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile after successful auth
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              setUserProfile(profile);
            } catch (error) {
              console.log('Profile fetch error:', error);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data?.user) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao sistema!",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetSessionTimer = (): void => {
    // Session timer reset implementation
    console.log('Session timer reset');
  };

  const isAuthenticated = !!user;
  const isMaster = userProfile?.role === 'master';

  const value: AuthContextType = {
    isAuthenticated,
    isMaster,
    isLoading,
    user,
    userProfile,
    session,
    login,
    logout,
    resetSessionTimer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};