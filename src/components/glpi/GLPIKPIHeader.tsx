
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chamados Resolvidos */}
        <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Chamados Resolvidos</p>
              <p className="text-3xl font-bold">{resolved}</p>
              <p className="text-emerald-200 text-xs mt-1">Finalizados</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Total de Chamados */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total de Chamados</p>
              <p className="text-3xl font-bold">{tickets.length}</p>
              <p className="text-blue-200 text-xs mt-1">No sistema</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Activity className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
