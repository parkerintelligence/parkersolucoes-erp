
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import { Layout } from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Services from './pages/Services';
import Budgets from './pages/Budgets';
import Contracts from './pages/Contracts';
import Schedule from './pages/Schedule';
import Annotations from './pages/Annotations';
import Passwords from './pages/Passwords';
import Documents from './pages/Documents';
import Links from './pages/Links';
import WhatsApp from './pages/WhatsApp';
import WhatsAppChats from './pages/WhatsAppChats';
import WhatsAppTemplates from './pages/WhatsAppTemplates';
import Automation from './pages/Automation';
import Monitoring from './pages/Monitoring';
import Zabbix from './pages/Zabbix';
import UniFi from './pages/UniFi';
import GLPI from './pages/GLPI';
import Guacamole from './pages/Guacamole';
import Bacula from './pages/Bacula';
import Backups from './pages/Backups';
import Wasabi from './pages/Wasabi';
import Admin from './pages/Admin';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout><Outlet /></Layout>}>
              <Route index element={<Dashboard />} />
              <Route path="companies" element={<Companies />} />
              <Route path="services" element={<Services />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="annotations" element={<Annotations />} />
              <Route path="passwords" element={<Passwords />} />
              <Route path="documents" element={<Documents />} />
              <Route path="links" element={<Links />} />
              <Route path="whatsapp" element={<WhatsApp />} />
              <Route path="whatsapp-chats" element={<WhatsAppChats />} />
              <Route path="whatsapp-templates" element={<WhatsAppTemplates />} />
              <Route path="automation" element={<Automation />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="zabbix" element={<Zabbix />} />
              <Route path="unifi" element={<UniFi />} />
              <Route path="glpi" element={<GLPI />} />
              <Route path="guacamole" element={<Guacamole />} />
              <Route path="bacula" element={<Bacula />} />
              <Route path="backups" element={<Backups />} />
              <Route path="wasabi" element={<Wasabi />} />
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
