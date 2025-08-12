import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Settings, Calculator, FileText, Headphones, Activity, HardDrive, Lock, Link, MessageCircle, Calendar, Shield, Cloud, Notebook, Database, Monitor, Kanban, AlertTriangle } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from '@/components/ui/sidebar';

const menuItems = [{
  title: 'Alertas',
  url: '/alertas',
  icon: AlertTriangle,
  role: 'user'
}, {
  title: 'Links',
  url: '/links',
  icon: Link,
  role: 'user'
}, {
  title: 'VPS',
  url: '/vps',
  icon: Monitor,
  role: 'user'
}, {
  title: 'GLPI',
  url: '/glpi',
  icon: Headphones,
  role: 'user'
}, {
  title: 'Conexão Remota',
  url: '/conexao-remota',
  icon: Monitor,
  role: 'user'
}, {
  title: 'Backups',
  url: '/backups',
  icon: HardDrive,
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
  title: 'WhatsApp',
  url: '/whatsapp',
  icon: MessageCircle,
  role: 'user'
}, {
  title: 'Templates WhatsApp',
  url: '/whatsapp-templates',
  icon: FileText,
  role: 'user'
}, {
  title: 'Wasabi',
  url: '/wasabi',
  icon: Cloud,
  role: 'user'
}, {
  title: 'Agenda',
  url: '/schedule',
  icon: Calendar,
  role: 'user'
}, {
  title: 'Automação',
  url: '/automation',
  icon: Activity,
  role: 'user'
}, {
  title: 'Zabbix',
  url: '/zabbix',
  icon: Activity,
  role: 'user'
}, {
  title: 'Serviços',
  url: '/services',
  icon: Settings,
  role: 'user'
}, {
  title: 'Orçamentos',
  url: '/budgets',
  icon: Calculator,
  role: 'user'
}, {
  title: 'Contratos',
  url: '/contracts',
  icon: FileText,
  role: 'user'
}, {
  title: 'Financeiro',
  url: '/financial',
  icon: Calculator,
  role: 'user'
}, {
  title: 'Empresas',
  url: '/companies',
  icon: LayoutDashboard,
  role: 'user'
}, {
  title: 'Bacula',
  url: '/bacula',
  icon: Database,
  role: 'user'
}, {
  title: 'Relatórios',
  url: '/reports',
  icon: FileText,
  role: 'user'
}, {
  title: 'Plano de Ação',
  url: '/plano-de-acao',
  icon: Kanban,
  role: 'user'
}, {
  title: 'Segurança',
  url: '/security',
  icon: Shield,
  role: 'user'
}, {
  title: 'UniFi',
  url: '/unifi',
  icon: Monitor,
  role: 'user'
}, {
  title: 'Admin',
  url: '/admin',
  icon: Settings,
  role: 'master'
}];

export function AppSidebar() {
  const { userProfile, isMaster } = useAuth();
  const location = useLocation();
  const { collapsed } = useSidebar();
  
  const visibleMenuItems = menuItems.filter(item => {
    if (item.role === 'master' && !isMaster) {
      return false;
    }
    return true;
  });

  const getNavClass = (url: string) => {
    const isActive = location.pathname === url;
    return isActive;
  };

  return (
    <Sidebar className="border-r bg-slate-900 border-slate-700" collapsible="icon">
      <SidebarHeader className="border-b border-slate-700 p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Sistema</h2>
              <p className="text-xs text-slate-400">Gestão de TI</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs uppercase tracking-wider">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={getNavClass(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-slate-800 data-[active=true]:bg-blue-600 data-[active=true]:text-white"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
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