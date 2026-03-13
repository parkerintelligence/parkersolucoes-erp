import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Settings, FileText, Headphones, Activity, HardDrive, Lock, Link, MessageCircle, Smartphone, Calendar, Shield, Cloud, Notebook, Database, Monitor, Kanban, AlertTriangle, MessagesSquare, Router, Zap } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, role: 'user' },
  { title: 'Atendimentos', url: '/atendimentos', icon: MessagesSquare, role: 'user' },
  { title: 'Alertas', url: '/alertas', icon: AlertTriangle, role: 'user' },
  { title: 'Links de acesso', url: '/links', icon: Link, role: 'user' },
  { title: 'Conexão Remota', url: '/conexao-remota', icon: Monitor, role: 'user' },
  { title: 'GLPI', url: '/glpi', icon: Headphones, role: 'user' },
  { title: 'Projetos', url: '/projetos', icon: Kanban, role: 'user' },
  { title: 'Senhas', url: '/passwords', icon: Lock, role: 'user' },
  { title: 'Anotações', url: '/annotations', icon: Notebook, role: 'user' },
  { title: 'Agenda', url: '/schedule', icon: Calendar, role: 'user' },
  { title: 'WhatsApp', url: '/whatsapp', icon: Smartphone, role: 'user' },
  { title: 'Modelos WhatsApp', url: '/whatsapp-templates', icon: MessageCircle, role: 'user' },
  { title: 'Backups FTP', url: '/backups', icon: HardDrive, role: 'user' },
  { title: 'Wasabi', url: '/wasabi', icon: Cloud, role: 'user' },
  { title: 'Automação', url: '/automation', icon: Settings, role: 'user' },
  { title: 'Zabbix', url: '/zabbix', icon: Activity, role: 'user' },
  { title: 'Winbox', url: '/winbox', icon: Router, role: 'user' },
  { title: 'Bacula', url: '/bacula', icon: Database, role: 'user' },
  { title: 'VPS', url: '/vps', icon: LayoutDashboard, role: 'user' },
  { title: 'Security', url: '/security', icon: Shield, role: 'user' },
  { title: 'Webhooks', url: '/webhooks', icon: Zap, role: 'user' },
  { title: 'Admin', url: '/admin', icon: Settings, role: 'master' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isMaster, user, userProfile } = useAuth();
  const location = useLocation();
  const { data: settings } = useSystemSettings('branding');
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';
  const filteredMainItems = menuItems.filter(item => item.role === 'user' || (item.role === 'master' && isMaster));

  const companyName = settings?.find(s => s.setting_key === 'company_name')?.setting_value || 'Parker Soluções';
  const companySubtitle = settings?.find(s => s.setting_key === 'company_subtitle')?.setting_value || 'ERP System';
  const logoUrl = settings?.find(s => s.setting_key === 'company_logo_url')?.setting_value || '';
  const filteredMainItems = menuItems.filter(item => item.role === 'user' || (item.role === 'master' && isMaster));

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      {/* Header with gradient accent */}
      <SidebarHeader className="p-3 sm:p-4 border-b border-sidebar-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg glow-primary flex-shrink-0">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-foreground font-bold text-sm truncate">Parker Soluções</h2>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">ERP System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-semibold text-[10px] uppercase tracking-widest px-3 mb-1">
            {!isCollapsed && <span>Menu Principal</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {filteredMainItems.map(item => {
                const active = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        className={`
                          group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200
                          ${active
                            ? 'bg-primary/15 text-primary font-semibold sidebar-active-indicator'
                            : 'text-sidebar-foreground hover:bg-secondary hover:text-foreground'
                          }
                        `}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user info */}
      {!isCollapsed && (
        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-accent-foreground text-xs font-bold flex-shrink-0">
              {(userProfile?.email || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userProfile?.email || user?.email}</p>
              <p className="text-[10px] text-muted-foreground">{isMaster ? '⭐ Master' : 'Usuário'}</p>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
