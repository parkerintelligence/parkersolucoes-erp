
import { GLPIMetricsCard } from './GLPIMetricsCard';
import { 
  Monitor, 
  Printer, 
  Server, 
  HardDrive,
  Wifi,
  Shield,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface AssetMetricsProps {
  computers: any[];
  monitors: any[];
  printers: any[];
  networkEquipment: any[];
  software: any[];
}

export const GLPIAssetMetrics = ({ 
  computers, 
  monitors, 
  printers, 
  networkEquipment, 
  software 
}: AssetMetricsProps) => {
  const totalAssets = computers.length + monitors.length + printers.length + networkEquipment.length + software.length;
  
  // Mock data para demonstrar funcionalidades avançadas
  const criticalAssets = Math.floor(totalAssets * 0.05); // 5% críticos
  const needMaintenance = Math.floor(totalAssets * 0.12); // 12% precisam manutenção
  const endOfLife = Math.floor(totalAssets * 0.08); // 8% fim de vida útil
  const utilizationRate = 78; // Taxa de utilização

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">💻 Inventário de Ativos</h3>
        <div className="text-sm text-gray-500">Total: {totalAssets} ativos</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <GLPIMetricsCard
          title="Computadores"
          value={computers.length}
          subtitle="Estações de trabalho"
          variant="info"
          icon={<Monitor className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Monitores"
          value={monitors.length}
          subtitle="Displays ativos"
          variant="success"
          icon={<Monitor className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Impressoras"
          value={printers.length}
          subtitle="Equipamentos impressão"
          variant="default"
          icon={<Printer className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Equipamentos Rede"
          value={networkEquipment.length}
          subtitle="Switches, roteadores"
          variant="warning"
          icon={<Wifi className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Software"
          value={software.length}
          subtitle="Licenças ativas"
          variant="info"
          icon={<HardDrive className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GLPIMetricsCard
          title="Ativos Críticos"
          value={criticalAssets}
          subtitle="Requer atenção imediata"
          variant="danger"
          trend="up"
          trendValue={`+${Math.floor(criticalAssets * 0.1)}`}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Manutenção Pendente"
          value={needMaintenance}
          subtitle="Ativos para manutenção"
          variant="warning"
          icon={<Server className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Fim Vida Útil"
          value={endOfLife}
          subtitle="Próximos à renovação"
          variant="warning"
          progress={(endOfLife / totalAssets) * 100}
          icon={<Shield className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Taxa Utilização"
          value={`${utilizationRate}%`}
          subtitle="Otimização dos recursos"
          variant="success"
          progress={utilizationRate}
          trend="up"
          trendValue="+3%"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>
    </div>
  );
};
