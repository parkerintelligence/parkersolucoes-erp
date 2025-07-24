
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { Layout } from '@/components/Layout';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ActionPlan from './pages/ActionPlan';
import Schedule from './pages/Schedule';
import Services from './pages/Services';
import Companies from './pages/Companies';
import Contracts from './pages/Contracts';
import Budgets from './pages/Budgets';
import Financial from './pages/Financial';
import Documents from './pages/Documents';
import Passwords from './pages/Passwords';
import Links from './pages/Links';
import Annotations from './pages/Annotations';
import Automation from './pages/Automation';
import ReportsDashboard from './pages/ReportsDashboard';
import Backups from './pages/Backups';
import Bacula from './pages/Bacula';
import GLPI from './pages/GLPI';
import Zabbix from './pages/Zabbix';
import Alertas from './pages/Alertas';
import UniFi from './pages/UniFi';
import Guacamole from './pages/Guacamole';
import Wasabi from './pages/Wasabi';
import WhatsApp from './pages/WhatsApp';
import WhatsAppChats from './pages/WhatsAppChats';
import WhatsAppTemplates from './pages/WhatsAppTemplates';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';

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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="admin" element={<Admin />} />
                <Route path="action-plan" element={<ActionPlan />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="services" element={<Services />} />
                <Route path="companies" element={<Companies />} />
                <Route path="contracts" element={<Contracts />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="financial" element={<Financial />} />
                <Route path="documents" element={<Documents />} />
                <Route path="passwords" element={<Passwords />} />
                <Route path="links" element={<Links />} />
                <Route path="annotations" element={<Annotations />} />
                <Route path="automation" element={<Automation />} />
                <Route path="reports" element={<ReportsDashboard />} />
                <Route path="backups" element={<Backups />} />
                <Route path="bacula" element={<Bacula />} />
                <Route path="glpi" element={<GLPI />} />
                <Route path="zabbix" element={<Zabbix />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="unifi" element={<UniFi />} />
                <Route path="guacamole" element={<Guacamole />} />
                <Route path="wasabi" element={<Wasabi />} />
                <Route path="whatsapp" element={<WhatsApp />} />
                <Route path="whatsapp-chats" element={<WhatsAppChats />} />
                <Route path="whatsapp-templates" element={<WhatsAppTemplates />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
