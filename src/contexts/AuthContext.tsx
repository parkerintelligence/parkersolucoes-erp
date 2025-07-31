import { createContext, useContext, useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: any | null
  isLoading: boolean
  isAuthenticated: boolean
  isMaster: boolean
  login: (email: string, password: string) => Promise<{ error: any }>
  logout: () => Promise<void>
  resetSessionTimer: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,
  isMaster: false,
  login: async () => ({ error: null }),
  logout: async () => {},
  resetSessionTimer: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const resetSessionTimer = () => {
    // Stub function for compatibility
  }

  const value = {
    user,
    session,
    userProfile: null,
    isLoading,
    isAuthenticated: !!user && !!session,
    isMaster: false,
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