
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClientWrapper } from '@/components/QueryClientWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

// Lazy load components to prevent initialization issues
const Login = React.lazy(() => import('@/pages/Login'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Admin = React.lazy(() => import('@/pages/Admin'));
const GLPI = React.lazy(() => import('@/pages/GLPI'));
const Guacamole = React.lazy(() => import('@/pages/Guacamole'));
const Backups = React.lazy(() => import('@/pages/Backups'));
const Passwords = React.lazy(() => import('@/pages/Passwords'));
const Annotations = React.lazy(() => import('@/pages/Annotations'));
const Links = React.lazy(() => import('@/pages/Links'));
const WhatsApp = React.lazy(() => import('@/pages/WhatsApp'));
const WhatsAppTemplates = React.lazy(() => import('@/pages/WhatsAppTemplates'));
const Wasabi = React.lazy(() => import('@/pages/Wasabi'));
const Schedule = React.lazy(() => import('@/pages/Schedule'));
const Automation = React.lazy(() => import('@/pages/Automation'));
const Zabbix = React.lazy(() => import('@/pages/Zabbix'));
const Services = React.lazy(() => import('@/pages/Services'));
const Budgets = React.lazy(() => import('@/pages/Budgets'));
const Contracts = React.lazy(() => import('@/pages/Contracts'));
const Financial = React.lazy(() => import('@/pages/Financial'));
const Companies = React.lazy(() => import('@/pages/Companies'));
const Bacula = React.lazy(() => import('@/pages/Bacula'));
const ReportsDashboard = React.lazy(() => import('@/pages/ReportsDashboard'));
const ActionPlan = React.lazy(() => import('@/pages/ActionPlan'));
const Alertas = React.lazy(() => import('@/pages/Alertas'));
// Import Layout normally since it's used as a wrapper
import { Layout } from '@/components/Layout';

// Loading component
const PageLoading = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-white text-lg">Carregando...</div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientWrapper>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-900">
              <Suspense fallback={<PageLoading />}>
                <Routes>
              <Route path="/" element={<Login />} />
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
              </Suspense>
              <Toaster />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientWrapper>
    </ErrorBoundary>
  );
}

export default App;
