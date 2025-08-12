import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { TopHeader } from '@/components/TopHeader';
import { AppSidebar } from '@/components/AppSidebar';

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
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-primary">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader />
        <main className="flex-1 overflow-auto bg-slate-900">
          <div className="container-responsive py-4 sm:py-6 lg:py-8 bg-slate-900">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};