import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Login from '@/pages/Login';
import VPS from '@/pages/VPS';
import { SafeAdmin } from '@/components/SafeAdmin';
import { SafeGLPI } from '@/components/SafeGLPI';
import { SafeGuacamole } from '@/components/SafeGuacamole';
import Backups from '@/pages/Backups';
import Passwords from '@/pages/Passwords';
import Annotations from '@/pages/Annotations';
import Links from '@/pages/Links';
import WhatsApp from '@/pages/WhatsApp';
import WhatsAppTemplates from '@/pages/WhatsAppTemplates';
import Wasabi from '@/pages/Wasabi';
import Schedule from '@/pages/Schedule';
import Automation from '@/pages/Automation';
import { SafeZabbix } from '@/components/SafeZabbix';
import Services from '@/pages/Services';
import Budgets from '@/pages/Budgets';
import Contracts from '@/pages/Contracts';
import Financial from '@/pages/Financial';
import Companies from '@/pages/Companies';
import { SafeBacula } from '@/components/SafeBacula';
import ReportsDashboard from '@/pages/ReportsDashboard';
import { SafeActionPlan } from '@/components/SafeActionPlan';
import { SafeAlertas } from '@/components/SafeAlertas';
import { SafeAtendimentos } from '@/components/SafeAtendimentos';
import Security from '@/pages/Security';
import { SafeUniFi } from '@/components/SafeUniFi';
import { Layout } from '@/components/Layout';

// Create single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/atendimentos" element={<Layout><SafeAtendimentos /></Layout>} />
              <Route path="/alertas" element={<Layout><SafeAlertas /></Layout>} />
              <Route path="/links" element={<Layout><Links /></Layout>} />
              <Route path="/vps" element={<Layout><VPS /></Layout>} />
              <Route path="/admin" element={<Layout><SafeAdmin /></Layout>} />
              <Route path="/glpi" element={<Layout><SafeGLPI /></Layout>} />
              <Route path="/conexao-remota" element={<Layout><SafeGuacamole /></Layout>} />
              <Route path="/backups" element={<Layout><Backups /></Layout>} />
              <Route path="/passwords" element={<Layout><Passwords /></Layout>} />
              <Route path="/annotations" element={<Layout><Annotations /></Layout>} />
              <Route path="/whatsapp" element={<Layout><WhatsApp /></Layout>} />
              <Route path="/whatsapp-templates" element={<Layout><WhatsAppTemplates /></Layout>} />
              <Route path="/wasabi" element={<Layout><Wasabi /></Layout>} />
              <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
              <Route path="/automation" element={<Layout><Automation /></Layout>} />
              <Route path="/zabbix" element={<Layout><SafeZabbix /></Layout>} />
              <Route path="/services" element={<Layout><Services /></Layout>} />
              <Route path="/budgets" element={<Layout><Budgets /></Layout>} />
              <Route path="/contracts" element={<Layout><Contracts /></Layout>} />
              <Route path="/financial" element={<Layout><Financial /></Layout>} />
              <Route path="/companies" element={<Layout><Companies /></Layout>} />
              <Route path="/bacula" element={<Layout><SafeBacula /></Layout>} />
              <Route path="/reports" element={<Layout><ReportsDashboard /></Layout>} />
              <Route path="/plano-de-acao" element={<Layout><SafeActionPlan /></Layout>} />
              <Route path="/security" element={<Layout><Security /></Layout>} />
              <Route path="/unifi" element={<Layout><SafeUniFi /></Layout>} />
            </Routes>
          </div>
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;