import * as React from 'react';

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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Minimal implementation to test React hooks
  const [isLoading, setIsLoading] = React.useState(false);
  
  const value: AuthContextType = {
    user: null,
    userProfile: null,
    session: null,
    login: async () => false,
    logout: async () => {},
    isAuthenticated: false,
    isMaster: false,
    isLoading,
    resetSessionTimer: () => {}
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};