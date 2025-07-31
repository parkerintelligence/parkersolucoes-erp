
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TopHeader } from '@/components/TopHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { resetSessionTimer } = useAuth();

  // Resetar timer de sessão a cada atividade do usuário
  React.useEffect(() => {
    const handleUserActivity = () => {
      resetSessionTimer();
    };

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [resetSessionTimer]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-primary">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0 flex flex-col transition-all duration-200 md:ml-0">
          <TopHeader />
          <main className="flex-1 overflow-auto bg-slate-900">
            <div className="container-responsive py-4 sm:py-6 lg:py-8 bg-slate-900">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
