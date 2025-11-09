// Simple auth context without useState hooks
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isMaster: boolean;
  user: any;
  userProfile: any;
  session: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: true, // Always authenticated for now
  isLoading: false,
  isMaster: true,
  user: { id: '1', email: 'admin@admin.com' },
  userProfile: { role: 'master' },
  session: { user: { id: '1' } },
  login: async () => true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// No AuthProvider component needed - just export a simple hook
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};