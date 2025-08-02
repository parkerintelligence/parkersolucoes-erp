
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Settings,
  Calculator,
  FileText,
  Headphones,
  HardDrive,
  Lock,
  StickyNote,
  Link,
  MessageCircle,
  Calendar,
  Shield,
  ChevronDown,
  MessageSquare,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  SafeDropdownMenu,
  DropdownMenuItem,
} from '@/components/SafeDropdownMenu';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, role: 'user' },
  { title: 'GLPI', url: '/glpi', icon: Headphones, role: 'user' },
  { title: 'Backups FTP', url: '/backups', icon: HardDrive, role: 'user' },
  { title: 'Senhas', url: '/passwords', icon: Lock, role: 'user' },
  { title: 'Anotações', url: '/annotations', icon: StickyNote, role: 'user' },
  { title: 'Links', url: '/links', icon: Link, role: 'user' },
  { title: 'Conversas WhatsApp', url: '/whatsapp-chats', icon: MessageCircle, role: 'user' },
  { title: 'Modelos WhatsApp', url: '/whatsapp-templates', icon: MessageSquare, role: 'user' },
  { title: 'Wasabi', url: '/wasabi', icon: HardDrive, role: 'user' },
  { title: 'Agenda', url: '/schedule', icon: Calendar, role: 'user' },
  { title: 'Automação', url: '/automation', icon: Settings, role: 'user' },
  { title: 'Bacula', url: '/bacula', icon: HardDrive, role: 'user' },
  { title: 'Dashboard Relatórios', url: '/reports', icon: BarChart3, role: 'user' },
  { title: 'Grafana', url: '/monitoring', icon: Activity, role: 'user' },
];

const financialItems = [
  { title: 'Serviços', url: '/services', icon: Settings, role: 'master' },
  { title: 'Orçamentos', url: '/budgets', icon: Calculator, role: 'master' },
  { title: 'Contratos', url: '/contracts', icon: FileText, role: 'master' },
];

const adminItems = [
  { title: 'Administração', url: '/admin', icon: Shield, role: 'master' },
];

export const HorizontalNav = () => {
  const { isMaster, user, isLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  
  const filteredMainItems = menuItems.filter(item => 
    item.role === 'user' || (item.role === 'master' && isMaster)
  );
  
  const filteredFinancialItems = financialItems.filter(item => 
    item.role === 'user' || (item.role === 'master' && isMaster)
  );
  
  const filteredAdminItems = adminItems.filter(item => 
    item.role === 'user' || (item.role === 'master' && isMaster)
  );

  const getNavClass = (active: boolean) =>
    `nav-card ${active ? 'nav-card-active' : ''} flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200`;

  const getFinancialActive = () => {
    return filteredFinancialItems.some(item => isActive(item.url));
  };

  return (
    <nav className="bg-gradient-to-r from-background via-background to-background border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            {/* Menu Principal */}
            {filteredMainItems.map((item) => (
              <NavLink 
                key={item.title}
                to={item.url} 
                className={getNavClass(isActive(item.url))}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{item.title}</span>
              </NavLink>
            ))}

            {/* Menu Financeiro (Dropdown) - Only render when user is loaded */}
            {!isLoading && user && filteredFinancialItems.length > 0 && (
              <SafeDropdownMenu
                align="start"
                className="nav-dropdown w-48"
                trigger={
                  <Button 
                    variant="ghost" 
                    className={`nav-card ${getFinancialActive() ? 'nav-card-active' : ''} flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200`}
                  >
                    <Calculator className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">Financeiro</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                }
              >
                {filteredFinancialItems.map((item) => (
                  <DropdownMenuItem key={item.title} asChild>
                    <NavLink to={item.url} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-secondary/10 transition-colors">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </SafeDropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
