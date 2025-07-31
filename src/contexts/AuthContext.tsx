
import React from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  isAuthenticated: boolean
  isMaster: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: any }>
  logout: () => Promise<void>
  resetSessionTimer: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const resetSessionTimer = () => {
    // Session timer logic can be implemented here if needed
  }

  React.useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            fetchUserProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setIsLoading(false)
      }
    )

    getInitialSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive"
        })
        return { error }
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao Sistema Parker!"
      })

      return { error: null }
    } catch (error: any) {
      console.error('Login error:', error)
      return { error }
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        toast({
          title: "Erro ao sair",
          description: "Não foi possível realizar o logout",
          variant: "destructive"
        })
        return
      }

      setUser(null)
      setSession(null)
      setUserProfile(null)
      
      toast({
        title: "Logout realizado",
        description: "Até a próxima!"
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isAuthenticated = !!user && !!session
  const isMaster = userProfile?.role === 'master'

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    isAuthenticated,
    isMaster,
    isLoading,
    login,
    logout,
    resetSessionTimer,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
