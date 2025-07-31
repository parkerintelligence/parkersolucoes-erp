import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { TestComponent } from '@/components/TestComponent';
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

// Create a single QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/test" element={<TestComponent />} />
            <Route path="/" element={<AuthProvider><Login /></AuthProvider>} />
            <Route path="/login" element={<AuthProvider><Login /></AuthProvider>} />
              <Route
                path="/alertas"
                element={
                  <AuthProvider>
                    <Layout>
                      <Alertas />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/links"
                element={
                  <AuthProvider>
                    <Layout>
                      <Links />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <AuthProvider>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </AuthProvider>
                }
               />
              <Route
                path="/admin"
                element={
                  <AuthProvider>
                    <Layout>
                      <Admin />
                    </Layout>
                  </AuthProvider>
                }
              />
               <Route
                 path="/glpi"
                 element={
                   <AuthProvider>
                     <Layout>
                       <GLPI />
                     </Layout>
                   </AuthProvider>
                 }
               />
               <Route
                 path="/conexao-remota"
                 element={
                   <AuthProvider>
                     <Layout>
                       <Guacamole />
                     </Layout>
                   </AuthProvider>
                 }
               />
               <Route
                 path="/backups"
                element={
                  <AuthProvider>
                    <Layout>
                      <Backups />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/passwords"
                element={
                  <AuthProvider>
                    <Layout>
                      <Passwords />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/annotations"
                element={
                  <AuthProvider>
                    <Layout>
                      <Annotations />
                    </Layout>
                  </AuthProvider>
                }
               />
              <Route
                path="/whatsapp"
                element={
                  <AuthProvider>
                    <Layout>
                      <WhatsApp />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/whatsapp-templates"
                element={
                  <AuthProvider>
                    <Layout>
                      <WhatsAppTemplates />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/wasabi"
                element={
                  <AuthProvider>
                    <Layout>
                      <Wasabi />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/schedule"
                element={
                  <AuthProvider>
                    <Layout>
                      <Schedule />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/automation"
                element={
                  <AuthProvider>
                    <Layout>
                      <Automation />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/zabbix"
                element={
                  <AuthProvider>
                    <Layout>
                      <Zabbix />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/services"
                element={
                  <AuthProvider>
                    <Layout>
                      <Services />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/budgets"
                element={
                  <AuthProvider>
                    <Layout>
                      <Budgets />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/contracts"
                element={
                  <AuthProvider>
                    <Layout>
                      <Contracts />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/financial"
                element={
                  <AuthProvider>
                    <Layout>
                      <Financial />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route
                path="/companies"
                element={
                  <AuthProvider>
                    <Layout>
                      <Companies />
                    </Layout>
                  </AuthProvider>
                }
              />
              <Route 
                path="/bacula" 
                element={
                  <AuthProvider>
                    <Layout>
                      <Bacula />
                    </Layout>
                  </AuthProvider>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <AuthProvider>
                    <Layout>
                      <ReportsDashboard />
                    </Layout>
                  </AuthProvider>
                } 
              />
              <Route 
                path="/plano-de-acao" 
                element={
                  <AuthProvider>
                    <Layout>
                      <ActionPlan />
                    </Layout>
                  </AuthProvider>
                } 
              />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
  );
}

export default App;