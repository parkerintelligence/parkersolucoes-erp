
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  MessageCircle,
  Bot,
  Activity,
  Globe,
  Wifi,
  Shield,
  Monitor,
  HardDrive,
  Database,
  Cloud,
  StickyNote,
  Lock,
  Boxes,
  DollarSign,
  ClipboardList,
  ExternalLink
} from 'lucide-react';

const mainItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Agenda', url: '/schedule', icon: Calendar },
  { title: 'Anotações', url: '/annotations', icon: StickyNote },
  { title: 'Senhas', url: '/passwords', icon: Lock },
  { title: 'Documentos', url: '/documents', icon: Boxes },
  { title: 'Links', url: '/links', icon: ExternalLink },
];

const financialItems = [
  { title: 'Empresas', url: '/companies', icon: Building2 },
  { title: 'Serviços', url: '/services', icon: Users },
  { title: 'Orçamentos', url: '/budgets', icon: DollarSign },
  { title: 'Contratos', url: '/contracts', icon: FileText },
];

const integrationItems = [
  { title: 'WhatsApp', url: '/whatsapp', icon: MessageSquare },
  { title: 'Chats', url: '/whatsapp-chats', icon: MessageCircle },
  { title: 'Templates', url: '/whatsapp-templates', icon: ClipboardList },
  { title: 'Automação', url: '/automation', icon: Bot },
  { title: 'Monitoramento', url: '/monitoring', icon: Activity },
  { title: 'Zabbix', url: '/zabbix', icon: Globe },
  { title: 'UniFi', url: '/unifi', icon: Wifi },
  { title: 'GLPI', url: '/glpi', icon: Shield },
  { title: 'Guacamole', url: '/guacamole', icon: Monitor },
  { title: 'Bacula', url: '/bacula', icon: HardDrive },
  { title: 'Backups', url: '/backups', icon: Database },
  { title: 'Cloud Server', url: '/wasabi', icon: Cloud },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    return isActive(path) 
      ? "bg-blue-600 text-white font-medium" 
      : "text-gray-200 hover:bg-blue-700 hover:text-white";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-slate-900 text-white">
        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                      end={item.url === '/'}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Financeiro */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Financeiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Integrações - sem título de grupo */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {integrationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
