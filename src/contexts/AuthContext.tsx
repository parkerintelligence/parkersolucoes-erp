import * as React from 'react';

// Minimal auth context that doesn't rely on React hooks initially
let globalAuthState = {
  user: null as any,
  session: null as any,
  userProfile: null as any,
  isAuthenticated: false,
  isMaster: false,
  isLoading: true
};

// Simple event emitter for auth state changes
const authListeners = new Set<() => void>();

const notifyListeners = () => {
  authListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Auth listener error:', error);
    }
  });
};

const updateAuthState = (newState: Partial<typeof globalAuthState>) => {
  globalAuthState = { ...globalAuthState, ...newState };
  notifyListeners();
};

// Auth interface
interface AuthContextType {
  user: any;
  userProfile: any;
  session: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isMaster: boolean;
  isLoading: boolean;
  resetSessionTimer: () => void;
}

// Create a simple React context using a factory pattern
const createAuthContext = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to access React - if it fails, we'll handle it
    const React = (window as any).React || require('react');
    if (!React || !React.createContext) {
      throw new Error('React not available');
    }
    
    return React.createContext({
      user: null,
      userProfile: null,
      session: null,
      login: async () => false,
      logout: async () => {},
      isAuthenticated: false,
      isMaster: false,
      isLoading: true,
      resetSessionTimer: () => {}
    });
  } catch (error) {
    console.error('Failed to create auth context:', error);
    return null;
  }
};

const AuthContext = createAuthContext();

// Hook that works with or without React context
export const useAuth = (): AuthContextType => {
  try {
    const React = (window as any).React || require('react');
    
    if (AuthContext && React && React.useContext) {
      const context = React.useContext(AuthContext);
      if (context) return context;
    }
  } catch (error) {
    console.warn('useAuth falling back to global state:', error);
  }
  
  // Fallback to global state
  return {
    ...globalAuthState,
    login: async (email: string, password: string) => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          console.error('Login error:', error);
          return false;
        }
        
        updateAuthState({
          user: data.user,
          session: data.session,
          isAuthenticated: !!data.user,
          isLoading: false
        });
        
        return !!data.user;
      } catch (error) {
        console.error('Login failed:', error);
        return false;
      }
    },
    logout: async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.auth.signOut();
        updateAuthState({
          user: null,
          session: null,
          userProfile: null,
          isAuthenticated: false,
          isLoading: false
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    },
    resetSessionTimer: () => {}
  };
};

// Safe auth provider that handles React availability
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const React = (window as any).React || require('react');
    
    if (!React || !React.useState) {
      throw new Error('React hooks not available');
    }

    // If we get here, React is available
    const [authState, setAuthState] = React.useState(globalAuthState);
    
    React.useEffect(() => {
      const listener = () => setAuthState({ ...globalAuthState });
      authListeners.add(listener);
      
      // Initialize auth
      const initAuth = async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: { session } } = await supabase.auth.getSession();
          
          updateAuthState({
            user: session?.user || null,
            session: session,
            isAuthenticated: !!session?.user,
            isLoading: false
          });
        } catch (error) {
          console.error('Auth init error:', error);
          updateAuthState({ isLoading: false });
        }
      };
      
      initAuth();
      
      return () => {
        authListeners.delete(listener);
      };
    }, []);

    const contextValue: AuthContextType = {
      ...authState,
      login: async (email: string, password: string) => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          
          if (error) {
            console.error('Login error:', error);
            return false;
          }
          
          updateAuthState({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.user
          });
          
          return !!data.user;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },
      logout: async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase.auth.signOut();
          updateAuthState({
            user: null,
            session: null,
            userProfile: null,
            isAuthenticated: false
          });
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
      resetSessionTimer: () => {}
    };

    if (AuthContext && React.createElement) {
      return React.createElement(AuthContext.Provider, { value: contextValue }, children);
    } else {
      return children;
    }
  } catch (error) {
    console.error('AuthProvider error, using fallback:', error);
    
    // Fallback: just render children without context
    return children as any;
  }
};