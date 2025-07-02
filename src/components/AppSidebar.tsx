import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Settings,
  Calculator,
  FileText,
  Headphones,
  Activity,
  HardDrive,
  Lock,
  Link,
  MessageCircle,
  Calendar,
  Shield,
  Wifi,
  DollarSign,
  Cloud,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

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

export function AppSidebar() {
  const { state } = useSidebar();
  const { isMaster } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === 'collapsed';
  
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
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-900/50 ${
      active 
        ? 'bg-blue-800 text-white font-medium' 
        : 'text-blue-100 hover:text-white'
    }`;

  return (
    <Sidebar 
      className="border-r border-blue-900 bg-blue-950 z-30" 
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-blue-900 bg-blue-950">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-white">Gestão TI</h2>
              <p className="text-xs text-blue-200">Sistema Integrado</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-blue-950">
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-200 font-medium">
            {!isCollapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredFinancialItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-200 font-medium">
              {!isCollapsed && "Financeiro"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredFinancialItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClass(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-200 font-medium">
              {!isCollapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClass(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
