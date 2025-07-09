import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Layout } from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const GLPI = lazy(() => import('@/pages/GLPI'));
const Backups = lazy(() => import('@/pages/Backups'));
const Passwords = lazy(() => import('@/pages/Passwords'));
const Annotations = lazy(() => import('@/pages/Annotations'));
const Links = lazy(() => import('@/pages/Links'));
const WhatsAppChats = lazy(() => import('@/pages/WhatsAppChats'));
const WhatsAppTemplates = lazy(() => import('@/pages/WhatsAppTemplates'));
const Wasabi = lazy(() => import('@/pages/Wasabi'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const Automation = lazy(() => import('@/pages/Automation'));
const Bacula = lazy(() => import('@/pages/Bacula'));
const Monitoring = lazy(() => import('@/pages/Monitoring'));
const Zabbix = lazy(() => import('@/pages/Zabbix'));
const WhatsApp = lazy(() => import('@/pages/WhatsApp'));
const Admin = lazy(() => import('@/pages/Admin'));
const Guacamole = lazy(() => import('@/pages/Guacamole'));
const Companies = lazy(() => import('@/pages/Companies'));
const Services = lazy(() => import('@/pages/Services'));
const Budgets = lazy(() => import('@/pages/Budgets'));
const Contracts = lazy(() => import('@/pages/Contracts'));
const Financial = lazy(() => import('@/pages/Financial'));
const Documents = lazy(() => import('@/pages/Documents'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
                  <Login />
                </Suspense>
              } />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/glpi" element={<GLPI />} />
                        <Route path="/backups" element={<Backups />} />
                        <Route path="/passwords" element={<Passwords />} />
                        <Route path="/annotations" element={<Annotations />} />
                        <Route path="/links" element={<Links />} />
                        <Route path="/whatsapp-chats" element={<WhatsAppChats />} />
                        <Route path="/whatsapp-templates" element={<WhatsAppTemplates />} />
                        <Route path="/wasabi" element={<Wasabi />} />
                        <Route path="/schedule" element={<Schedule />} />
                        <Route path="/automation" element={<Automation />} />
                        <Route path="/bacula" element={<Bacula />} />
                        <Route path="/monitoring" element={<Monitoring />} />
                        <Route path="/zabbix" element={<Zabbix />} />
                        <Route path="/whatsapp" element={<WhatsApp />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/guacamole" element={<Guacamole />} />
                        <Route path="/companies" element={<Companies />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="/contracts" element={<Contracts />} />
                        <Route path="/financial" element={<Financial />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
