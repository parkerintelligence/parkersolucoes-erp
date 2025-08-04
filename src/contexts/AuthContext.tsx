// Emergency fallback without React hooks
const AuthProvider = ({ children }) => {
  console.log('AuthProvider emergency mode - no hooks');
  return children;
};

const useAuth = () => {
  console.log('useAuth emergency mode - returning defaults');
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
};

export { AuthProvider, useAuth };