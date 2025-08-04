
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Temporarily disabled
// import { TooltipProvider } from '@/components/ui/tooltip'; // Temporarily disabled
import Login from '@/pages/Login';
import VPS from '@/pages/VPS';
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
import Security from '@/pages/Security';
import UniFi from '@/pages/UniFi';
import { Layout } from '@/components/Layout';

// Create a single QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
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
                path="/vps"
                element={
                  <Layout>
                    <VPS />
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
              <Route 
                path="/security" 
                element={
                  <Layout>
                    <Security />
                  </Layout>
                } 
              />
              <Route 
                path="/unifi" 
                element={
                  <Layout>
                    <UniFi />
                  </Layout>
                } 
              />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
