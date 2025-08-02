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

// Create context with default values
const AuthContext = React.createContext<AuthContextType>({
  user: null,
  userProfile: null,
  session: null,
  login: async () => false,
  logout: async () => {},
  isAuthenticated: false,
  isMaster: false,
  isLoading: false,
  resetSessionTimer: () => {}
});

export const useAuth = () => {
  return React.useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Static values - no hooks
  const value: AuthContextType = {
    user: null,
    userProfile: null,
    session: null,
    login: async () => false,
    logout: async () => {},
    isAuthenticated: false,
    isMaster: false,
    isLoading: false,
    resetSessionTimer: () => {}
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};