
import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useUserActivity } from '@/hooks/useUserActivity';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import GLPI from '@/pages/GLPI';
import Guacamole from '@/pages/Guacamole';
import Backups from '@/pages/Backups';
import Passwords from '@/pages/Passwords';
import Annotations from '@/pages/Annotations';
import Links from '@/pages/Links';
import WhatsApp from '@/pages/WhatsApp';
import WhatsAppTemplates from '@/pages/WhatsAppTemplates';
import Wasabi from '@/pages/Wasabi';
import Schedule from '@/pages/Schedule';
import Automation from '@/pages/Automation';
import Zabbix from '@/pages/Zabbix';
import Services from '@/pages/Services';
import Budgets from '@/pages/Budgets';
import Contracts from '@/pages/Contracts';
import Financial from '@/pages/Financial';
import Companies from '@/pages/Companies';
import Bacula from '@/pages/Bacula';
import ReportsDashboard from '@/pages/ReportsDashboard';
import ActionPlan from '@/pages/ActionPlan';
import Alertas from '@/pages/Alertas';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryClientTest } from '@/components/QueryClientTest';


// Componente para detectar atividade apenas em páginas autenticadas
function AuthenticatedContent() {
  const { isAuthenticated } = useAuth();
  
  // Só usar o hook de atividade se estiver autenticado
  if (isAuthenticated) {
    useUserActivity();
  }
  
  return null;
}

// Componente interno com proteção de rotas
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Mostrar loading durante inicialização
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <QueryClientTest />
      <AuthenticatedContent />
      <Routes>
        {/* Redirecionar root baseado no status de autenticação */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/alertas" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        {/* Login page outside Layout but inside QueryClientProvider */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/alertas"
          element={
            <Layout>
              <Alertas />
            </Layout>
          }
        />
        <Route
          path="/links"
          element={
            <Layout>
              <Links />
            </Layout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/admin"
          element={
            <Layout>
              <Admin />
            </Layout>
          }
        />
        <Route
          path="/glpi"
          element={
            <Layout>
              <GLPI />
            </Layout>
          }
        />
        <Route
          path="/conexao-remota"
          element={
            <Layout>
              <Guacamole />
            </Layout>
          }
        />
        <Route
          path="/backups"
          element={
            <Layout>
              <Backups />
            </Layout>
          }
        />
        <Route
          path="/passwords"
          element={
            <Layout>
              <Passwords />
            </Layout>
          }
        />
        <Route
          path="/annotations"
          element={
            <Layout>
              <Annotations />
            </Layout>
          }
        />
        <Route
          path="/whatsapp"
          element={
            <Layout>
              <WhatsApp />
            </Layout>
          }
        />
        <Route
          path="/whatsapp-templates"
          element={
            <Layout>
              <WhatsAppTemplates />
            </Layout>
          }
        />
        <Route
          path="/wasabi"
          element={
            <Layout>
              <Wasabi />
            </Layout>
          }
        />
        <Route
          path="/schedule"
          element={
            <Layout>
              <Schedule />
            </Layout>
          }
        />
        <Route
          path="/automation"
          element={
            <Layout>
              <Automation />
            </Layout>
          }
        />
        <Route
          path="/zabbix"
          element={
            <Layout>
              <Zabbix />
            </Layout>
          }
        />
        <Route
          path="/services"
          element={
            <Layout>
              <Services />
            </Layout>
          }
        />
        <Route
          path="/budgets"
          element={
            <Layout>
              <Budgets />
            </Layout>
          }
        />
        <Route
          path="/contracts"
          element={
            <Layout>
              <Contracts />
            </Layout>
          }
        />
        <Route
          path="/financial"
          element={
            <Layout>
              <Financial />
            </Layout>
          }
        />
        <Route
          path="/companies"
          element={
            <Layout>
              <Companies />
            </Layout>
          }
        />
        <Route 
          path="/bacula" 
          element={
            <Layout>
              <Bacula />
            </Layout>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <Layout>
              <ReportsDashboard />
            </Layout>
          } 
        />
        <Route 
          path="/plano-de-acao" 
          element={
            <Layout>
              <ActionPlan />
            </Layout>
          } 
        />
      </Routes>
    </div>
  );
}

// Create a single QueryClient instance with proper defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
