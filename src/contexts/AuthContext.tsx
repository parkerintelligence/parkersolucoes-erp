// Static auth context - no React hooks to avoid conflicts
const staticAuth = {
  user: null,
  session: null,
  userProfile: null,
  isLoading: false,
  isAuthenticated: false,
  isMaster: false,
  login: async () => ({ error: null }),
  logout: async () => {},
  resetSessionTimer: () => {},
}

export const useAuth = () => staticAuth

export const AuthProvider = ({ children }: { children: any }) => children