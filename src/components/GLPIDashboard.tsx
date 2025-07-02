
import { GLPIKPIHeader } from './glpi/GLPIKPIHeader';
import { GLPITicketMetrics } from './glpi/GLPITicketMetrics';
import { GLPIAssetMetrics } from './glpi/GLPIAssetMetrics';
import { GLPIOrganizationMetrics } from './glpi/GLPIOrganizationMetrics';
import { GLPIITILMetrics } from './glpi/GLPIITILMetrics';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const GLPIDashboard = () => {
  const { 
    tickets, 
    problems, 
    changes, 
    computers, 
    monitors, 
    printers, 
    networkEquipment, 
    software, 
    suppliers, 
    contracts, 
    users, 
    entities, 
    locations 
  } = useGLPIExpanded();

  const handleRefresh = () => {
    // Trigger refresh of all queries
    tickets.refetch();
    problems.refetch();
    changes.refetch();
    computers.refetch();
    monitors.refetch();
    printers.refetch();
    networkEquipment.refetch();
    software.refetch();
    suppliers.refetch();
    contracts.refetch();
    users.refetch();
    entities.refetch();
    locations.refetch();
  };

  const isLoading = tickets.isLoading || problems.isLoading || changes.isLoading;

  return (
    <div className="space-y-6 w-full">
      {/* Header com KPIs Principais */}
      <GLPIKPIHeader 
        tickets={tickets.data || []}
        problems={problems.data || []}
        changes={changes.data || []}
      />

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Gestão de Chamados */}
      <div className="bg-card rounded-lg p-6 border">
        <GLPITicketMetrics tickets={tickets.data || []} />
      </div>
      
      {/* Inventário de Ativos */}
      <div className="bg-card rounded-lg p-6 border">
        <GLPIAssetMetrics 
          computers={computers.data || []}
          monitors={monitors.data || []}
          printers={printers.data || []}
          networkEquipment={networkEquipment.data || []}
          software={software.data || []}
        />
      </div>
    </div>
  );
};
