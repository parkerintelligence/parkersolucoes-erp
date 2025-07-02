import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const TopHeader = () => {
  const { user, userProfile, logout, isMaster } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between w-full px-3 md:px-4 py-3">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-secondary p-1.5 rounded-lg flex-shrink-0">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-secondary-foreground" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-sm md:text-lg font-semibold text-primary-foreground truncate">
                Sistema de Gestão de TI
              </h1>
              <p className="text-xs text-primary-foreground/80 hidden md:block">Plataforma Integrada</p>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 md:gap-2 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0">
              {isMaster ? (
                <Crown className="h-4 w-4 text-secondary" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="hidden md:inline text-sm truncate max-w-32 lg:max-w-none">
                {userProfile?.email || user?.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 md:w-64 bg-card border border-border z-50">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-card-foreground">
                  {userProfile?.email || user?.email}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isMaster ? (
                    <>
                      <Crown className="h-3 w-3 text-secondary" />
                      Administrador Master
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" />
                      Usuário
                    </>
                  )}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};