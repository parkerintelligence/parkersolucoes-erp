
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
  Cloud,
  Notebook,
  Monitor,
  Database,
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
  { title: 'Anotações', url: '/annotations', icon: Notebook, role: 'user' },
  { title: 'Links', url: '/links', icon: Link, role: 'user' },
  { title: 'Modelos WhatsApp', url: '/whatsapp-templates', icon: MessageCircle, role: 'user' },
  { title: 'Wasabi', url: '/wasabi', icon: Cloud, role: 'user' },
  { title: 'Agenda', url: '/schedule', icon: Calendar, role: 'user' },
  { title: 'Automação', url: '/automation', icon: Settings, role: 'user' },
  { title: 'Zabbix', url: '/zabbix', icon: Activity, role: 'user' },
  { title: 'Guacamole', url: '/guacamole', icon: Monitor, role: 'user' },
  { title: 'Bacula', url: '/bacula', icon: Database, role: 'user' },
];

const financialItems = [
  { title: 'Financeiro', url: '/financial', icon: Calculator, role: 'master' },
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

  return (
    <Sidebar 
      className="border-r border-primary bg-primary z-30" 
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-primary-foreground/20 bg-primary">
        <div className="flex items-center justify-center">
          <div className="bg-secondary p-2 rounded-lg shadow-sm">
            <Shield className="h-6 w-6 text-secondary-foreground" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-primary">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white font-medium">
            {!isCollapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-white hover:text-white"
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
            <SidebarGroupLabel className="text-white font-medium">
              {!isCollapsed && "Financeiro"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredFinancialItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-white hover:text-white"
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
