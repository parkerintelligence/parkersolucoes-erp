// Stub para compatibilidade temporária
export const useAuth = () => ({
  user: null,
  session: null,
  userProfile: null,
  isAuthenticated: false,
  isMaster: false,
  isLoading: false,
  login: async () => ({ error: null }),
  logout: async () => {},
  resetSessionTimer: () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}