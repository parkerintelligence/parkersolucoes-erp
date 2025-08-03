import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.minimal';
import { LayoutDashboard, Settings, Calculator, FileText, Headphones, Activity, HardDrive, Lock, Link, MessageCircle, Calendar, Shield, Cloud, Notebook, Database, Monitor, Kanban, AlertTriangle, ShieldCheck, Wifi } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
const menuItems = [{
  title: 'Alertas',
  url: '/alertas',
  icon: AlertTriangle,
  role: 'user'
}, {
  title: 'Links de acesso',
  url: '/links',
  icon: Link,
  role: 'user'
}, {
  title: 'Conexão Remota',
  url: '/conexao-remota',
  icon: Monitor,
  role: 'user'
}, {
  title: 'GLPI',
  url: '/glpi',
  icon: Headphones,
  role: 'user'
}, {
  title: 'Plano de Ação',
  url: '/plano-de-acao',
  icon: Kanban,
  role: 'user'
}, {
  title: 'Senhas',
  url: '/passwords',
  icon: Lock,
  role: 'user'
}, {
  title: 'Anotações',
  url: '/annotations',
  icon: Notebook,
  role: 'user'
}, {
  title: 'Agenda',
  url: '/schedule',
  icon: Calendar,
  role: 'user'
}, {
  title: 'Modelos WhatsApp',
  url: '/whatsapp-templates',
  icon: MessageCircle,
  role: 'user'
}, {
  title: 'Backups FTP',
  url: '/backups',
  icon: HardDrive,
  role: 'user'
}, {
  title: 'Wasabi',
  url: '/wasabi',
  icon: Cloud,
  role: 'user'
}, {
  title: 'Automação',
  url: '/automation',
  icon: Settings,
  role: 'user'
}, {
  title: 'Zabbix',
  url: '/zabbix',
  icon: Activity,
  role: 'user'
}, {
  title: 'Bacula',
  url: '/bacula',
  icon: Database,
  role: 'user'
}, {
  title: 'Wazuh',
  url: '/security',
  icon: ShieldCheck,
  role: 'user'
}, {
  title: 'Controladora UniFi',
  url: '/unifi',
  icon: Wifi,
  role: 'user'
}, {
  title: 'VPS',
  url: '/dashboard',
  icon: LayoutDashboard,
  role: 'user'
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const {
    isMaster
  } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === 'collapsed';
  const filteredMainItems = menuItems.filter(item => item.role === 'user' || item.role === 'master' && isMaster);
  return <Sidebar className="border-r border-primary-foreground/20 bg-slate-900" collapsible="icon">
      <SidebarHeader className="p-2 sm:p-4 border-b border-primary-foreground/20 bg-slate-900">
        <div className="flex items-center justify-center">
          
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white font-medium text-xs sm:text-sm px-2 sm:px-0">
            {!isCollapsed && <span className="hidden sm:inline">Menu Principal</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-1 sm:px-0">
              {filteredMainItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className={({
                  isActive
                }) => `flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm transition-all text-white hover:text-white ${isActive ? 'bg-secondary text-secondary-foreground font-medium' : 'hover:bg-primary-foreground/10'}`}>
                      <item.icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="hidden sm:inline truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}