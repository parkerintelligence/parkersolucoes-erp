
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { TopHeader } from '@/components/TopHeader';
import { HorizontalNav } from '@/components/HorizontalNav';

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
    <div className="min-h-screen flex flex-col w-full bg-background">
      <TopHeader />
      <HorizontalNav />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
