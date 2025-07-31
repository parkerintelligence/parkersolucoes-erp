import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { TopHeader } from '@/components/TopHeader'
import { AppSidebar } from '@/components/AppSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/toaster'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, isLoading, resetSessionTimer } = useAuth()

  // Reset session timer on user activity
  React.useEffect(() => {
    const handleUserActivity = () => {
      if (isAuthenticated) {
        resetSessionTimer()
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
    }
  }, [isAuthenticated, resetSessionTimer])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Carregando sistema...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0 flex flex-col">
          <TopHeader />
          <main className="flex-1 overflow-auto">
            <div className="container-responsive py-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      {isAuthenticated && !isLoading && <Toaster />}
    </SidebarProvider>
  )
}