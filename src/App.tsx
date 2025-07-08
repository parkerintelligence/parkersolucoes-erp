
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import GLPI from '@/pages/GLPI';
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
import Guacamole from '@/pages/Guacamole';
import { Layout } from '@/components/Layout';
import UniFi from '@/pages/UniFi';

// Create a single QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
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
                path="/links"
                element={
                  <Layout>
                    <Links />
                  </Layout>
                }
              />
              <Route
                path="/whatsapp-chats"
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
                path="/guacamole"
                element={
                  <Layout>
                    <Guacamole />
                  </Layout>
                }
              />
              <Route path="/unifi" element={<Layout><UniFi /></Layout>} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
