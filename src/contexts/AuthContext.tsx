// AuthContext simplificado que retorna valores padrão para todos os componentes
export const useAuth = () => ({
  isAuthenticated: false,
  isMaster: false,
  isLoading: false,
  user: null,
  userProfile: null,
  session: null,
  login: async (email: string, password: string) => {
    console.log('Login tentado:', email);
    return false;
  },
  logout: async () => {
    console.log('Logout executado');
  },
  resetSessionTimer: () => {
    console.log('Timer resetado');
  }
});

export const AuthProvider = ({ children }: { children: any }) => {
  console.log('AuthProvider renderizado sem React hooks');
  return children;
};