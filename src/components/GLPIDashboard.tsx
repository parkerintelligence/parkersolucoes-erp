
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
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
      <GLPITicketMetrics tickets={tickets.data || []} />
      
      <Separator className="my-8" />

      {/* Inventário de Ativos */}
      <GLPIAssetMetrics 
        computers={computers.data || []}
        monitors={monitors.data || []}
        printers={printers.data || []}
        networkEquipment={networkEquipment.data || []}
        software={software.data || []}
      />
      
      <Separator className="my-8" />

      {/* Gestão ITIL */}
      <GLPIITILMetrics 
        problems={problems.data || []}
        changes={changes.data || []}
        tickets={tickets.data || []}
      />
      
      <Separator className="my-8" />

      {/* Organização e Gestão */}
      <GLPIOrganizationMetrics 
        users={users.data || []}
        entities={entities.data || []}
        locations={locations.data || []}
        suppliers={suppliers.data || []}
        contracts={contracts.data || []}
      />
    </div>
  );
};
