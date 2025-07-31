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
  Settings
} from 'lucide-react'

const menuItems = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
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