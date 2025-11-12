import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isMaster: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityCheckRef = useRef<number>(0);

  const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      // Limpar estados
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Mesmo com erro, limpar estados e redirecionar
      setUser(null);
      setSession(null);
      setUserProfile(null);
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  // Reset inactivity timer on user activity (com throttle agressivo para evitar rate limiting)
  const resetInactivityTimer = useCallback(() => {
    if (!session || !user) return;

    const now = Date.now();
    
    // Aumentar intervalo para 2 minutos para evitar rate limiting
    if (now - lastActivityCheckRef.current < 120000) { // 2 minutos
      return;
    }
    
    lastActivityCheckRef.current = now;
    localStorage.setItem('lastActivity', now.toString());

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.log('⏰ Usuário inativo por 8 horas, fazendo logout automático...');
      logout();
    }, INACTIVITY_TIMEOUT);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, user, INACTIVITY_TIMEOUT]);

  // Set up activity listeners (apenas eventos essenciais para evitar rate limiting)
  useEffect(() => {
    if (!session || !user) return;

    // Usar apenas eventos essenciais e menos frequentes
    const events = ['click', 'keydown'];
    
    // Reset timer on any activity
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Initialize timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [session, user, resetInactivityTimer]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        
        // Ignorar eventos de refresh de token - apenas atualizar a sessão
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed, mantendo sessão atual');
          if (session) {
            setSession(session);
            setUser(session.user);
          }
          return;
        }
        
        // CRÍTICO: Não fazer logout em erros temporários ou rate limiting
        // Apenas fazer logout se for explicitamente SIGNED_OUT
        if (!session && event !== 'SIGNED_OUT') {
          console.warn('⚠️ Evento de auth sem sessão mas não é sign out:', event);
          console.warn('⚠️ Mantendo usuário logado para evitar logout acidental');
          // Manter o usuário logado - não limpar session/user
          return;
        }
        
        // Atualizar session e user apenas em eventos válidos
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('👤 Buscando perfil do usuário...');
            setTimeout(async () => {
              const profile = await fetchUserProfile(session.user.id);
              setUserProfile(profile);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          // Limpar perfil apenas em logout explícito
          console.log('🚪 Usuário deslogado, limpando perfil');
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          // Não limpar tokens em erros de rede ou rate limiting
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Sessão verificada:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserProfile(session.user.id).then(setUserProfile);
        }
        
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('❌ Erro ao obter sessão (catch):', error);
        // Não limpar localStorage em erros
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    isAuthenticated: !!session && !!user,
    isLoading,
    isMaster: userProfile?.role === 'master',
    user,
    userProfile,
    session,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};