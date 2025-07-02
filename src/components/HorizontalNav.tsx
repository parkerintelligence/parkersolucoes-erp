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
  Link,
  MessageCircle,
  Calendar,
  Shield,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, role: 'user' },
  { title: 'GLPI', url: '/glpi', icon: Headphones, role: 'user' },
  { title: 'Backups FTP', url: '/backups', icon: HardDrive, role: 'user' },
  { title: 'Senhas', url: '/passwords', icon: Lock, role: 'user' },
  { title: 'Links', url: '/links', icon: Link, role: 'user' },
  { title: 'Conversas WhatsApp', url: '/whatsapp-chats', icon: MessageCircle, role: 'user' },
  { title: 'Wasabi', url: '/wasabi', icon: HardDrive, role: 'user' },
  { title: 'Agenda', url: '/schedule', icon: Calendar, role: 'user' },
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
  const { isMaster } = useAuth();
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
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      active 
        ? 'bg-secondary text-secondary-foreground shadow-sm' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Menu Principal */}
            {filteredMainItems.map((item) => (
              <NavLink 
                key={item.title}
                to={item.url} 
                className={getNavClass(isActive(item.url))}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.title}</span>
              </NavLink>
            ))}

            {/* Menu Financeiro (Dropdown) */}
            {filteredFinancialItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Calculator className="h-4 w-4" />
                    <span className="hidden sm:inline">Financeiro</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {filteredFinancialItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <NavLink to={item.url} className="flex items-center gap-2 w-full">
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Menu Admin */}
            {filteredAdminItems.map((item) => (
              <NavLink 
                key={item.title}
                to={item.url} 
                className={getNavClass(isActive(item.url))}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.title}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};