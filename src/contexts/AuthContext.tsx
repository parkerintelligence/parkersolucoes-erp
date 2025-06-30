
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: 'user' | 'master';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('it-tool-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call - In production, this would be a real authentication
    if (username === 'admin' && password === 'admin123') {
      const newUser = { id: '1', username: 'admin', role: 'user' as const };
      setUser(newUser);
      localStorage.setItem('it-tool-user', JSON.stringify(newUser));
      return true;
    } else if (username === 'master' && password === 'master123') {
      const newUser = { id: '2', username: 'master', role: 'master' as const };
      setUser(newUser);
      localStorage.setItem('it-tool-user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('it-tool-user');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isMaster: user?.role === 'master'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
