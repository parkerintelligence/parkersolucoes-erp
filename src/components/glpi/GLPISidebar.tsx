import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  AlertTriangle, 
  HardDrive, 
  FileText, 
  Users, 
  Settings
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
  useSidebar,
} from '@/components/ui/sidebar';

const sidebarItems = [
  { title: 'Visão Geral', url: 'dashboard', icon: BarChart3 },
  { title: 'Chamados', url: 'tickets', icon: AlertTriangle },
  { title: 'Inventário', url: 'inventory', icon: HardDrive },
  { title: 'ITIL', url: 'itil', icon: FileText },
  { title: 'Organização', url: 'organization', icon: Users },
];

interface GLPISidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const GLPISidebar = ({ activeTab, onTabChange }: GLPISidebarProps) => {
  const sidebar = useSidebar();
  const collapsed = sidebar?.state === 'collapsed';

  const isActive = (tab: string) => activeTab === tab;

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-64'} border-r border-glpi-border bg-glpi-surface`}>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-glpi-text-muted text-xs font-semibold uppercase tracking-wide mb-2">
            GLPI
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={`
                      w-full justify-start px-3 py-2 rounded-md transition-colors text-sm
                      ${isActive(item.url) 
                        ? 'bg-glpi-secondary text-white' 
                        : 'text-glpi-text hover:bg-glpi-surface-2'
                      }
                    `}
                  >
                    <button onClick={() => onTabChange(item.url)}>
                      <item.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};