// Contexto de autenticação com Supabase
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface Profile {
  id: string
  email: string
  role: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isMaster: boolean
  login: (email: string, password: string) => Promise<{ error: any }>
  signup: (email: string, password: string) => Promise<{ error: any }>
  logout: () => Promise<void>
  resetSessionTimer: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile after setting session
          setTimeout(async () => {
            if (!mounted) return
            try {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              if (mounted) {
                setUserProfile(profile)
              }
            } catch (error) {
              console.error('Error fetching profile:', error)
            }
          }, 0)
        } else {
          if (mounted) {
            setUserProfile(null)
          }
        }
        
        if (mounted) {
          setIsLoading(false)
        }
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        if (!session) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signup = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    })
    return { error }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUserProfile(null)
  }

  const resetSessionTimer = () => {
    // Session timer functionality if needed
  }

  const isAuthenticated = !!session
  const isMaster = userProfile?.role === 'master'

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    isLoading,
    isAuthenticated,
    isMaster,
    login,
    signup,
    logout,
    resetSessionTimer,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}