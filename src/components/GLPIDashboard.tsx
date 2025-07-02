
import { GLPICompactMetrics } from './glpi/GLPICompactMetrics';
import { GLPITicketMetrics } from './glpi/GLPITicketMetrics';
import { GLPIAssetMetrics } from './glpi/GLPIAssetMetrics';
import { GLPIOrganizationMetrics } from './glpi/GLPIOrganizationMetrics';
import { GLPIITILMetrics } from './glpi/GLPIITILMetrics';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Métricas Compactas */}
      <GLPICompactMetrics 
        tickets={tickets.data || []}
        problems={problems.data || []}
        changes={changes.data || []}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestão de Chamados */}
        <Card className="border-glpi-border bg-glpi-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-glpi-text flex items-center gap-2">
              <Activity className="h-5 w-5 text-glpi-secondary" />
              Gestão de Chamados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <GLPITicketMetrics tickets={tickets.data || []} />
          </CardContent>
        </Card>
        
        {/* Inventário de Ativos */}
        <Card className="border-glpi-border bg-glpi-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-glpi-text flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-glpi-success" />
              Inventário de Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <GLPIAssetMetrics 
              computers={computers.data || []}
              monitors={monitors.data || []}
              printers={printers.data || []}
              networkEquipment={networkEquipment.data || []}
              software={software.data || []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
