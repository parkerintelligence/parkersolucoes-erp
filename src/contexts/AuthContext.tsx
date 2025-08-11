import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// CRITICAL: Ensure React is available globally and force all hooks to exist
if (typeof window !== 'undefined') {
  (window as any).React = React;
}
(globalThis as any).React = React;

// Defensive check to ensure React hooks are available
if (!React || !React.useState || !React.useEffect || !React.useContext || !React.createContext) {
  console.error('❌ CRITICAL: React hooks not available in AuthContext');
  throw new Error('React hooks are not available - application cannot start');
}

// Force inclusion of all hooks in bundle
const requiredHooks = {
  useState: React.useState,
  useEffect: React.useEffect, 
  useContext: React.useContext,
  createContext: React.createContext
};

console.log('🔧 AuthContext - React hooks validation:', {
  React: !!React,
  useState: !!useState,
  useEffect: !!useEffect,
  useContext: !!useContext,
  createContext: !!createContext,
  requiredHooks: Object.keys(requiredHooks).every(key => !!requiredHooks[key as keyof typeof requiredHooks])
});

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('AuthProvider initializing, React available:', typeof React);
  
  // Use React hooks with defensive checks
  if (!useState) {
    throw new Error('useState is not available');
  }
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};