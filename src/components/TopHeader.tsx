import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown, Shield, ChevronRight, Home, PanelLeft, DollarSign, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
export const TopHeader = () => {
  const {
    user,
    userProfile,
    logout,
    isMaster
  } = useAuth();
  const {
    data: settings
  } = useSystemSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const companyName = settings?.find(s => s.setting_key === 'company_name')?.setting_value || 'Sistema de Gestão de TI';
  const logoUrl = settings?.find(s => s.setting_key === 'company_logo_url')?.setting_value;
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
  return <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-lg">
      <div className="flex items-center justify-between w-full px-3 md:px-6 py-4">
        {/* Menu Toggle e Título */}
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10" />
          {logoUrl ? <img src={logoUrl} alt="Logo da empresa" className="h-10 w-auto object-contain flex-shrink-0" /> : <div className="bg-secondary p-2 rounded-xl flex-shrink-0 shadow-sm">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-secondary-foreground" />
            </div>}
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-lg md:text-xl font-bold text-primary-foreground truncate">
              {companyName}
            </h1>
            <p className="text-sm text-primary-foreground/80">Plataforma Integrada</p>
          </div>
        </div>

        {/* Breadcrumb Central */}
        

        {/* Área do Usuário */}
        <div className="flex items-center gap-2">
          {/* Dropdown do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 px-3 py-2 rounded-lg">
                {isMaster ? <Shield className="h-4 w-4 text-secondary" /> : <User className="h-4 w-4" />}
                <span className="hidden md:inline text-sm font-medium max-w-32 lg:max-w-none truncate">
                  {userProfile?.email || user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border border-border shadow-xl rounded-xl z-50">
              <DropdownMenuLabel className="px-4 py-3">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-semibold text-card-foreground">
                    {userProfile?.email || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    {isMaster ? <>
                        <Shield className="h-3 w-3 text-secondary" />
                        Administrador Master
                      </> : <>
                        <User className="h-3 w-3" />
                        Usuário
                      </>}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Acesso Financeiro (apenas para master) */}
              {isMaster && <>
                  <DropdownMenuItem onClick={handleFinancialAccess} className="cursor-pointer px-4 py-2 hover:bg-accent">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Acesso Financeiro</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>}

              {/* Painel de Administração (apenas para master) */}
              {isMaster && <>
                  <DropdownMenuItem onClick={handleAdminAccess} className="cursor-pointer px-4 py-2 hover:bg-accent">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Painel de Administração</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>}
              
              <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer px-4 py-2">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
};