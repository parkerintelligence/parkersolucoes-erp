
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/alertas" replace />} />
              
              {/* Rotas protegidas */}
              <Route
                path="/alertas"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Alertas />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/links"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Links />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
               />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Admin />
                    </Layout>
                  </ProtectedRoute>
                }
              />
               <Route
                 path="/glpi"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <GLPI />
                     </Layout>
                   </ProtectedRoute>
                 }
               />
               <Route
                 path="/conexao-remota"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <Guacamole />
                     </Layout>
                   </ProtectedRoute>
                 }
               />
               <Route
                 path="/backups"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Backups />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/passwords"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Passwords />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/annotations"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Annotations />
                    </Layout>
                  </ProtectedRoute>
                }
               />
              <Route
                path="/whatsapp"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <WhatsApp />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/whatsapp-templates"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <WhatsAppTemplates />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wasabi"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Wasabi />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Schedule />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/automation"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Automation />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/zabbix"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Zabbix />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Services />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budgets"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Budgets />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Contracts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financial"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Financial />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Companies />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/bacula" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Bacula />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportsDashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/plano-de-acao" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ActionPlan />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
