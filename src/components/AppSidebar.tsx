
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Headphones,
  Activity,
  HardDrive,
  Lock,
  Link,
  FileText,
  Settings,
  Shield
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
  { title: 'Zabbix', url: '/zabbix', icon: Activity, role: 'user' },
  { title: 'Backups', url: '/backups', icon: HardDrive, role: 'user' },
  { title: 'Senhas', url: '/passwords', icon: Lock, role: 'user' },
  { title: 'Links', url: '/links', icon: Link, role: 'user' },
  { title: 'Documentos', url: '/documents', icon: FileText, role: 'user' },
  { title: 'Administração', url: '/admin', icon: Settings, role: 'master' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isMaster } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === 'collapsed';
  
  const filteredItems = menuItems.filter(item => 
    item.role === 'user' || (item.role === 'master' && isMaster)
  );

  const getNavClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-900/50 ${
      active 
        ? 'bg-blue-800 text-white font-medium' 
        : 'text-blue-100 hover:text-white'
    }`;

  return (
    <Sidebar className="border-r border-blue-900 bg-blue-950">
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
              {filteredItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}
