
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
            Dashboard Operacional
          </h2>
          <p className="text-blue-700">Visão geral em tempo real do GLPI</p>
        </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Chamados Ativos</p>
              <p className="text-3xl font-bold">{totalActive}</p>
              <p className="text-blue-200 text-xs mt-1">Em atendimento</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Activity className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium mb-1">Críticos</p>
              <p className="text-3xl font-bold">{critical}</p>
              <p className="text-red-200 text-xs mt-1">Urgente</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Taxa Resolução</p>
              <p className="text-3xl font-bold">{resolutionRate.toFixed(1)}%</p>
              <p className="text-emerald-200 text-xs mt-1">Meta: 95%</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Incidentes ITIL</p>
              <p className="text-3xl font-bold">{problems.length + changes.length}</p>
              <p className="text-purple-200 text-xs mt-1">Problemas e mudanças</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
