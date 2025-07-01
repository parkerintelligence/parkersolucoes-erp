
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Services from "./pages/Services";
import Budgets from "./pages/Budgets";
import Contracts from "./pages/Contracts";
import GLPI from "./pages/GLPI";
import Zabbix from "./pages/Zabbix";
import Mikrotik from "./pages/Mikrotik";
import Backups from "./pages/Backups";
import Passwords from "./pages/Passwords";
import Links from "./pages/Links";
import WhatsAppChats from "./pages/WhatsAppChats";
import Wasabi from "./pages/Wasabi";
import Monitoring from "./pages/Monitoring";
import Schedule from "./pages/Schedule";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota pública - Login */}
            <Route path="/" element={<Login />} />
            
            {/* Rotas protegidas - todas dentro do Layout */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/companies" element={<Layout><Companies /></Layout>} />
            <Route path="/services" element={<Layout><Services /></Layout>} />
            <Route path="/budgets" element={<Layout><Budgets /></Layout>} />
            <Route path="/contracts" element={<Layout><Contracts /></Layout>} />
            <Route path="/glpi" element={<Layout><GLPI /></Layout>} />
            <Route path="/zabbix" element={<Layout><Zabbix /></Layout>} />
            <Route path="/mikrotik" element={<Layout><Mikrotik /></Layout>} />
            <Route path="/backups" element={<Layout><Backups /></Layout>} />
            <Route path="/passwords" element={<Layout><Passwords /></Layout>} />
            <Route path="/links" element={<Layout><Links /></Layout>} />
            <Route path="/whatsapp-chats" element={<Layout><WhatsAppChats /></Layout>} />
            <Route path="/wasabi" element={<Layout><Wasabi /></Layout>} />
            <Route path="/monitoring" element={<Layout><Monitoring /></Layout>} />
            <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
            <Route path="/admin" element={<Layout><Admin /></Layout>} />
            
            {/* Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
