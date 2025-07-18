
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Companies from '@/pages/Companies';
import Passwords from '@/pages/Passwords';
import Annotations from '@/pages/Annotations';
import Contracts from '@/pages/Contracts';
import Budgets from '@/pages/Budgets';
import Services from '@/pages/Services';
import Documents from '@/pages/Documents';
import Links from '@/pages/Links';
import Schedule from '@/pages/Schedule';
import Wasabi from '@/pages/Wasabi';
import Monitoring from '@/pages/Monitoring';
import Backups from '@/pages/Backups';
import Bacula from '@/pages/Bacula';
import Zabbix from '@/pages/Zabbix';
import WhatsApp from '@/pages/WhatsApp';
import WhatsAppChats from '@/pages/WhatsAppChats';
import WhatsAppTemplates from '@/pages/WhatsAppTemplates';
import Guacamole from '@/pages/Guacamole';
import UniFi from '@/pages/UniFi';
import GLPI from '@/pages/GLPI';
import Alertas from '@/pages/Alertas';
import Financial from '@/pages/Financial';
import ReportsDashboard from '@/pages/ReportsDashboard';
import ActionPlan from '@/pages/ActionPlan';
import Automation from '@/pages/Automation';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Outlet />
                        </Layout>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/alertas" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="passwords" element={<Passwords />} />
                    <Route path="annotations" element={<Annotations />} />
                    <Route path="contracts" element={<Contracts />} />
                    <Route path="budgets" element={<Budgets />} />
                    <Route path="services" element={<Services />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="links" element={<Links />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="wasabi" element={<Wasabi />} />
                    <Route path="monitoring" element={<Monitoring />} />
                    <Route path="backups" element={<Backups />} />
                    <Route path="bacula" element={<Bacula />} />
                    <Route path="zabbix" element={<Zabbix />} />
                    <Route path="whatsapp" element={<WhatsApp />} />
                    <Route path="whatsapp-chats" element={<WhatsAppChats />} />
                    <Route path="whatsapp-templates" element={<WhatsAppTemplates />} />
                    <Route path="guacamole" element={<Guacamole />} />
                    <Route path="unifi" element={<UniFi />} />
                    <Route path="glpi" element={<GLPI />} />
                    <Route path="alertas" element={<Alertas />} />
                    <Route path="financial" element={<Financial />} />
                    <Route path="reports" element={<ReportsDashboard />} />
                    <Route path="action-plan" element={<ActionPlan />} />
                    <Route path="automation" element={<Automation />} />
                    <Route path="admin" element={<Admin />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
