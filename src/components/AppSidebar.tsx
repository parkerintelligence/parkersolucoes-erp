import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
} from '@/components/ui/sidebar'
import { 
  LayoutDashboard,
  Building2,
  Wrench,
  DollarSign,
  FileText,
  Calendar,
  Users,
  Database,
  Shield,
  MessageSquare,
  Link,
  StickyNote,
  Trello,
  Monitor,
  Server,
  Wifi,
  HardDrive,
  FolderOpen,
  Cloud,
  Settings,
  Lock
} from 'lucide-react'

const menuItems = [
  {
    title: 'Monitoramento',
    items: [
      { title: 'Alertas Zabbix', url: '/alertas', icon: Shield },
      { title: 'Dashboard Grafana', url: '/monitoring', icon: Monitor },
      { title: 'Backups Bacula', url: '/bacula', icon: HardDrive },
      { title: 'Rede UniFi', url: '/unifi', icon: Wifi },
    ]
  },
  {
    title: 'Gestão de TI',
    items: [
      { title: 'GLPI - Chamados', url: '/glpi', icon: Database },
      { title: 'Acesso Remoto', url: '/guacamole', icon: Server },
      { title: 'Configurações Zabbix', url: '/zabbix', icon: Settings },
    ]
  },
  {
    title: 'Comunicação',
    items: [
      { title: 'WhatsApp', url: '/whatsapp', icon: MessageSquare },
      { title: 'Conversas', url: '/whatsapp-chats', icon: Users },
      { title: 'Templates', url: '/whatsapp-templates', icon: FileText },
    ]
  },
  {
    title: 'Arquivos',
    items: [
      { title: 'Wasabi Storage', url: '/wasabi', icon: Cloud },
      { title: 'Documentos', url: '/documentos', icon: FolderOpen },
      { title: 'Links', url: '/links', icon: Link },
    ]
  },
  {
    title: 'Gestão de Negócios',
    items: [
      { title: 'Empresas', url: '/empresas', icon: Building2 },
      { title: 'Serviços', url: '/servicos', icon: Wrench },
      { title: 'Cofre de Senhas', url: '/senhas', icon: Lock },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      { title: 'Dashboard', url: '/financeiro', icon: DollarSign },
      { title: 'Orçamentos', url: '/orcamentos', icon: FileText },
      { title: 'Contratos', url: '/contratos', icon: FileText },
    ]
  },
  {
    title: 'Organização',
    items: [
      { title: 'Plano de Ação', url: '/acao', icon: Trello },
      { title: 'Agenda', url: '/agenda', icon: Calendar },
      { title: 'Anotações', url: '/anotacoes', icon: StickyNote },
    ]
  },
  {
    title: 'Automação',
    items: [
      { title: 'Relatórios', url: '/relatorios', icon: FileText },
      { title: 'Configurações', url: '/automacao', icon: Settings },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { title: 'Administração', url: '/admin', icon: Settings },
      { title: 'Dashboard Geral', url: '/dashboard', icon: LayoutDashboard },
    ]
  }
]

export function AppSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true
    if (path !== '/' && currentPath.startsWith(path)) return true
    return false
  }

  const getNavClasses = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
      : "hover:bg-sidebar-accent/50"
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {menuItems.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarGroupLabel className="text-sidebar-foreground/70">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClasses(item.url)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}