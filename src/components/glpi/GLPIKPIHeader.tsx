
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Activity,
  Shield
} from 'lucide-react';

interface KPIData {
  tickets: any[];
  problems: any[];
  changes: any[];
}

export const GLPIKPIHeader = ({ tickets, problems, changes }: KPIData) => {
  const totalActive = tickets.filter(t => t.status !== 6).length;
  const critical = tickets.filter(t => t.priority >= 5).length;
  const resolved = tickets.filter(t => t.status === 5).length;
  const resolutionRate = totalActive > 0 ? ((resolved / totalActive) * 100) : 0;

  const getHealthStatus = () => {
    if (critical > 5) return { status: 'critical', color: 'bg-red-500', text: 'Crítico' };
    if (critical > 2) return { status: 'warning', color: 'bg-yellow-500', text: 'Atenção' };
    return { status: 'healthy', color: 'bg-green-500', text: 'Saudável' };
  };

  const health = getHealthStatus();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${health.color} animate-pulse`}></div>
          <Badge variant={health.status === 'critical' ? 'destructive' : 
                          health.status === 'warning' ? 'secondary' : 'default'}
                 className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            Sistema {health.text}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chamados Resolvidos */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-1">Chamados Resolvidos</p>
              <p className="text-2xl font-bold text-green-900">{resolved}</p>
              <p className="text-green-600 text-xs mt-1">Finalizados</p>
            </div>
            <div className="bg-green-100 rounded-lg p-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total de Chamados */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total de Chamados</p>
              <p className="text-2xl font-bold text-blue-900">{tickets.length}</p>
              <p className="text-blue-600 text-xs mt-1">No sistema</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-2">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
