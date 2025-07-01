
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Operacional</h2>
          <p className="text-gray-600">Visão geral em tempo real do GLPI</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${health.color} animate-pulse`}></div>
          <Badge variant={health.status === 'critical' ? 'destructive' : 
                          health.status === 'warning' ? 'secondary' : 'default'}>
            <Shield className="w-3 h-3 mr-1" />
            Sistema {health.text}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Chamados Ativos</p>
                <p className="text-2xl font-bold">{totalActive}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Críticos</p>
                <p className="text-2xl font-bold">{critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Taxa Resolução</p>
                <p className="text-2xl font-bold">{resolutionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Incidentes ITIL</p>
                <p className="text-2xl font-bold">{problems.length + changes.length}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
