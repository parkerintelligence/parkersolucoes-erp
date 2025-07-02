import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Headphones, 
  RefreshCw, 
  Plus, 
  Menu,
  Home,
  ChevronRight
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface GLPIHeaderProps {
  activeTab: string;
  onRefresh: () => void;
  onCreateTicket: () => void;
  isLoading: boolean;
}

const getTabTitle = (tab: string) => {
  const titles: Record<string, string> = {
    dashboard: 'Visão Geral',
    tickets: 'Chamados',
    inventory: 'Inventário',
    itil: 'ITIL',
    organization: 'Organização'
  };
  return titles[tab] || 'GLPI';
};

export const GLPIHeader = ({ activeTab, onRefresh, onCreateTicket, isLoading }: GLPIHeaderProps) => {
  return (
    <div className="sticky top-0 z-50 bg-glpi-surface border-b border-glpi-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-glpi-text hover:bg-glpi-surface-2" />
          
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-glpi-secondary" />
            <h1 className="text-lg font-semibold text-glpi-text">GLPI</h1>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-glpi-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className="h-3 w-3" />
            <span className="text-glpi-text font-medium">{getTabTitle(activeTab)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-glpi-success/10 text-glpi-success border-glpi-success/20">
            Sistema Online
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-glpi-border hover:bg-glpi-surface-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button 
            size="sm"
            onClick={onCreateTicket}
            className="bg-glpi-secondary hover:bg-glpi-secondary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Chamado
          </Button>
        </div>
      </div>
    </div>
  );
};