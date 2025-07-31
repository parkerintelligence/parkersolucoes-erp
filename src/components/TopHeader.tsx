import React from 'react'
import { useAuth } from '@/contexts/StaticAuth'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Shield, LogOut, User } from 'lucide-react'

export const TopHeader = () => {
  const { user, userProfile, logout } = useAuth()

  const getUserInitials = () => {
    if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-responsive h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-secondary" />
            <span className="font-bold text-lg gradient-text">
              Sistema Parker
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.email || user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.role === 'master' ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}