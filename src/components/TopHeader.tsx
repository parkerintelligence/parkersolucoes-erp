import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
// import { useSystemSettings } from '@/hooks/useSystemSettings'; // Temporarily disabled
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown, Shield, ChevronRight, Home, PanelLeft, DollarSign, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'; // Temporarily disabled
// import { PWAInstallButton } from '@/components/PWAInstallButton'; // Temporarily disabled
export const TopHeader = () => {
  const {
    user,
    userProfile,
    logout,
    isMaster
  } = useAuth();
  // Temporarily disable useSystemSettings to fix React context error
  const settings = null;
  /*
  const {
    data: settings
  } = useSystemSettings();
  */
  const location = useLocation();
  const navigate = useNavigate();
  const companyName = 'Sistema de Gestão de TI'; // Hardcoded temporarily
  const logoUrl = null; // Hardcoded temporarily
  const handleLogout = async () => {
    await logout();
  };
  const handleFinancialAccess = () => {
    navigate('/financial');
  };
  const handleAdminAccess = () => {
    navigate('/admin');
  };
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    const breadcrumbs: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/glpi': 'GLPI',
      '/backups': 'Backups FTP',
      '/passwords': 'Senhas',
      '/links': 'Links',
      '/whatsapp-chats': 'Conversas WhatsApp',
      '/wasabi': 'Wasabi',
      '/schedule': 'Agenda',
      '/services': 'Serviços',
      '/budgets': 'Orçamentos',
      '/contracts': 'Contratos',
      '/admin': 'Administração',
      '/companies': 'Empresas',
      '/documents': 'Documentos',
      '/financial': 'Financeiro',
      '/monitoring': 'Monitoramento',
      '/whatsapp': 'WhatsApp'
    };
    return breadcrumbs[path] || 'Sistema';
  };
  return <header className="sticky top-0 z-40 border-b border-border bg-slate-900 text-primary-foreground shadow-lg safe-area-top">
      <div className="flex items-center justify-between w-full px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4">
        {/* Menu Toggle e Título */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <SidebarTrigger className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground hover:bg-primary-foreground/10 touch-target" />
          {logoUrl ? <img src={logoUrl} alt="Logo da empresa" className="h-8 sm:h-10 w-auto object-contain flex-shrink-0" /> : <div className="bg-secondary p-1.5 sm:p-2 rounded-xl flex-shrink-0 shadow-sm">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-secondary-foreground" />
            </div>}
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-primary-foreground truncate">
              {companyName}
            </h1>
            <p className="text-xs sm:text-sm text-primary-foreground/80 hidden md:block">Plataforma Integrada</p>
          </div>
        </div>

        {/* Breadcrumb Central */}
        

        {/* Área do Usuário */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Botão de Instalação PWA - Temporarily disabled */}
          {/* <PWAInstallButton /> */}
          
          {/* Temporary simple logout button to debug React hooks issue */}
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="flex items-center gap-1 sm:gap-2 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg touch-target"
          >
            {isMaster ? <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" /> : <User className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline text-xs sm:text-sm font-medium max-w-20 sm:max-w-32 lg:max-w-none truncate">
              {userProfile?.email || user?.email}
            </span>
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          </Button>
        </div>
      </div>
    </header>;
};