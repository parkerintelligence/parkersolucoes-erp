
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
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
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/services" element={<Services />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/glpi" element={<GLPI />} />
              <Route path="/zabbix" element={<Zabbix />} />
              <Route path="/backups" element={<Backups />} />
              <Route path="/passwords" element={<Passwords />} />
              <Route path="/links" element={<Links />} />
              <Route path="/whatsapp-chats" element={<WhatsAppChats />} />
              <Route path="/wasabi" element={<Wasabi />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
