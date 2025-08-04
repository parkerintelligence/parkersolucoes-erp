import React from 'react';

// Emergency mode context - using minimal React functionality
const AuthContext = React.createContext(null);

const AuthProvider = ({ children }) => {
  console.log('AuthProvider emergency mode - providing static context');
  
  const authValue = {
    user: null,
    userProfile: null,
    session: null,
    login: async () => false,
    logout: async () => {},
    isAuthenticated: false,
    isMaster: false,
    isLoading: false
  };

  return React.createElement(AuthContext.Provider, { value: authValue }, children);
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === null) {
    console.error('useAuth emergency: AuthContext is null');
    // Return fallback instead of throwing error
    return {
      user: null,
      userProfile: null,
      session: null,
      login: async () => false,
      logout: async () => {},
      isAuthenticated: false,
      isMaster: false,
      isLoading: false
    };
  }
  return context;
};

export { AuthProvider, useAuth };