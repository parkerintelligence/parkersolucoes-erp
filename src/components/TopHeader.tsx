import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const TopHeader = () => {
  const { user, userProfile, logout, isMaster } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    const breadcrumbs: Record<string, string> = {
      '/atendimentos': 'Atendimentos',
      '/alertas': 'Alertas',
      '/vps': 'VPS',
      '/glpi': 'GLPI',
      '/backups': 'Backups FTP',
      '/passwords': 'Senhas',
      '/links': 'Links',
      '/whatsapp': 'WhatsApp',
      '/whatsapp-templates': 'Modelos WhatsApp',
      '/wasabi': 'Wasabi',
      '/schedule': 'Agenda',
      '/admin': 'Administração',
      '/annotations': 'Anotações',
      '/plano-de-acao': 'Plano de Ação',
      '/zabbix': 'Zabbix',
      '/winbox': 'Winbox',
      '/bacula': 'Bacula',
      '/security': 'Security',
      '/webhooks': 'Webhooks',
      '/automation': 'Automação',
      '/conexao-remota': 'Conexão Remota',
    };
    return breadcrumbs[path] || 'Sistema';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl safe-area-top">
      <div className="flex items-center justify-between w-full px-3 sm:px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg touch-target transition-colors" />
          <div className="h-5 w-px bg-border" />
          <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
            {getBreadcrumbTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
          >
            <span className="hidden sm:inline text-xs font-medium max-w-32 truncate">
              {userProfile?.email || user?.email}
            </span>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
