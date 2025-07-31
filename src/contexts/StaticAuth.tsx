// New static auth context to avoid Vite cache issues
export const useAuth = () => ({
  user: null,
  session: null,
  userProfile: null,
  isLoading: false,
  isAuthenticated: false,
  isMaster: false,
  login: async () => ({ error: null }),
  logout: async () => {},
  resetSessionTimer: () => {},
})

export const AuthProvider = (props: { children: any }) => props.children