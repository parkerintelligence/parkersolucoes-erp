import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const TopHeader = () => {
  const { user, userProfile, logout, isMaster } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const companyName = 'Sistema de Gestão de TI';
  
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-slate-900 text-primary-foreground shadow-lg">
      <div className="flex items-center justify-between w-full px-6 py-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="bg-secondary p-2 rounded-xl">
            <Shield className="h-6 w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">
              {companyName}
            </h1>
            <p className="text-sm text-primary-foreground/80">Plataforma Integrada</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="flex items-center gap-2 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            {isMaster ? <Shield className="h-4 w-4 text-secondary" /> : <User className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {userProfile?.email || user?.email}
            </span>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};