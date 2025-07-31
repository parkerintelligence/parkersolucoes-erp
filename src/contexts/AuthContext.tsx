// Stub mínimo sem hooks para evitar conflitos React
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}