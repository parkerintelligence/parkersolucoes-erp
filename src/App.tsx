
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Services from "./pages/Services";
import Budgets from "./pages/Budgets";
import Contracts from "./pages/Contracts";
import GLPI from "./pages/GLPI";
import Zabbix from "./pages/Zabbix";
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
            
            {/* Rotas protegidas - todas dentro do MainLayout */}
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/companies" element={<MainLayout><Companies /></MainLayout>} />
            <Route path="/services" element={<MainLayout><Services /></MainLayout>} />
            <Route path="/budgets" element={<MainLayout><Budgets /></MainLayout>} />
            <Route path="/contracts" element={<MainLayout><Contracts /></MainLayout>} />
            <Route path="/glpi" element={<MainLayout><GLPI /></MainLayout>} />
            <Route path="/zabbix" element={<MainLayout><Zabbix /></MainLayout>} />
            <Route path="/backups" element={<MainLayout><Backups /></MainLayout>} />
            <Route path="/passwords" element={<MainLayout><Passwords /></MainLayout>} />
            <Route path="/links" element={<MainLayout><Links /></MainLayout>} />
            <Route path="/whatsapp-chats" element={<MainLayout><WhatsAppChats /></MainLayout>} />
            <Route path="/wasabi" element={<MainLayout><Wasabi /></MainLayout>} />
            <Route path="/monitoring" element={<MainLayout><Monitoring /></MainLayout>} />
            <Route path="/schedule" element={<MainLayout><Schedule /></MainLayout>} />
            <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
            
            {/* Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
