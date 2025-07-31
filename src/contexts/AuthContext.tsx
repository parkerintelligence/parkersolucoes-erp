// Static auth hook - não usa React Context para evitar erros
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

// Função simples que apenas retorna children
export const AuthProvider = (props: { children: any }) => props.children