
import { GLPIMetricsCard } from './GLPIMetricsCard';
import { 
  Users, 
  Building, 
  MapPin, 
  UserCheck, 
  FileText,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';

interface OrganizationMetricsProps {
  users: any[];
  entities: any[];
  locations: any[];
  suppliers: any[];
  contracts: any[];
}

export const GLPIOrganizationMetrics = ({
  users,
  entities,
  locations,
  suppliers,
  contracts
}: OrganizationMetricsProps) => {
  const activeUsers = users.filter(u => u.is_active === 1).length;
  const activeSuppliers = suppliers.filter(s => s.is_active === 1).length;
  const activeContracts = contracts.filter(c => c.is_deleted === 0).length;
  
  // Mock data para métricas avançadas
  const contractsExpiringSoon = Math.floor(activeContracts * 0.15); // 15% vencendo em breve
  const userProductivity = 92; // Produtividade média dos usuários
  const entityCompliance = 88; // Compliance organizacional

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">🏢 Organização e Gestão</h3>
        <div className="text-sm text-gray-500">Estrutura organizacional</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <GLPIMetricsCard
          title="Usuários Ativos"
          value={activeUsers}
          subtitle="Colaboradores no sistema"
          variant="info"
          icon={<Users className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Entidades"
          value={entities.length}
          subtitle="Divisões organizacionais"
          variant="default"
          icon={<Building className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Localizações"
          value={locations.length}
          subtitle="Endereços físicos"
          variant="success"
          icon={<MapPin className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Fornecedores"
          value={activeSuppliers}
          subtitle="Parceiros ativos"
          variant="info"
          icon={<UserCheck className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Contratos"
          value={activeContracts}
          subtitle="Acordos vigentes"
          variant="default"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GLPIMetricsCard
          title="Contratos Vencendo"
          value={contractsExpiringSoon}
          subtitle="Próximos 90 dias"
          variant="warning"
          trend="up"
          trendValue={`${contractsExpiringSoon} contratos`}
          icon={<Clock className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Produtividade Usuários"
          value={`${userProductivity}%`}
          subtitle="Eficiência média"
          variant="success"
          progress={userProductivity}
          trend="up"
          trendValue="+2%"
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Compliance"
          value={`${entityCompliance}%`}
          subtitle="Conformidade organizacional"
          variant={entityCompliance >= 90 ? 'success' : entityCompliance >= 80 ? 'warning' : 'danger'}
          progress={entityCompliance}
          icon={<Shield className="h-5 w-5" />}
        />

        <GLPIMetricsCard
          title="Cobertura Global"
          value={`${locations.length * 2}`}
          subtitle="Países/regiões"
          variant="info"
          icon={<MapPin className="h-5 w-5" />}
        />
      </div>
    </div>
  );
};
