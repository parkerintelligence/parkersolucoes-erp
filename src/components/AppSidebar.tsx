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
    title: 'Principal',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Empresas', url: '/empresas', icon: Building2 },
      { title: 'Serviços', url: '/servicos', icon: Wrench },
      { title: 'Cofre de Senhas', url: '/senhas', icon: Lock },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      { title: 'Orçamentos', url: '/orcamentos', icon: DollarSign },
      { title: 'Contratos', url: '/contratos', icon: FileText },
    ]
  },
  {
    title: 'Organização',
    items: [
      { title: 'Agenda', url: '/agenda', icon: Calendar },
      { title: 'Anotações', url: '/anotacoes', icon: StickyNote },
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