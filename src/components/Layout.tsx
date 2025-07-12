
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { TopHeader } from '@/components/TopHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('Layout - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Carregando sistema...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Usuário não autenticado, redirecionando para login');
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-primary">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0 flex flex-col transition-all duration-200 md:ml-0">
          <TopHeader />
          <main className="flex-1 overflow-auto bg-primary">
            <div className="container-responsive py-4 sm:py-6 lg:py-8 bg-slate-900">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
