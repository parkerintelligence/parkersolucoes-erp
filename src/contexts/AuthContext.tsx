// AuthContext ultra-simplificado sem hooks
export const useAuth = () => ({
  isAuthenticated: false,
  isMaster: false,
  isLoading: false,
  user: null,
  userProfile: null,
  session: null,
  login: async () => false,
  logout: async () => {},
  resetSessionTimer: () => {}
});

export const AuthProvider = ({ children }: { children: any }) => children;