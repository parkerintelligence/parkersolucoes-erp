
import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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
            <Route path="/" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-lg">Cache cleared - AuthProvider removed</div></div>} />
            <Route path="*" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-lg">Cache cleared - AuthProvider removed</div></div>} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
