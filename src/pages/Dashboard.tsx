
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HardDrive, 
  Headphones, 
  Shield, 
  Users,
  Server,
  Database
} from 'lucide-react';

const Dashboard = () => {
  const systemStatus = {
    glpi: { status: 'online', tickets: 15, critical: 3 },
    zabbix: { status: 'online', alerts: 2, hosts: 45 },
    backups: { status: 'warning', failed: 1, total: 12 },
    services: { status: 'online', active: 28, total: 30 }
  };

  const recentAlerts = [
    { id: 1, type: 'critical', message: 'Servidor web01 com alta utilização de CPU', time: '5 min' },
    { id: 2, type: 'warning', message: 'Backup do cliente XYZ não foi encontrado', time: '15 min' },
    { id: 3, type: 'info', message: 'Chamado #1234 foi resolvido', time: '1 hora' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Atenção</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Dashboard</h1>
          <p className="text-blue-600">Visão geral do status dos sistemas</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">GLPI</CardTitle>
              <Headphones className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-900">{systemStatus.glpi.tickets}</div>
                  <p className="text-xs text-blue-600">Chamados abertos</p>
                </div>
                {getStatusBadge(systemStatus.glpi.status)}
              </div>
              {systemStatus.glpi.critical > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  {systemStatus.glpi.critical} críticos
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Zabbix</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-900">{systemStatus.zabbix.hosts}</div>
                  <p className="text-xs text-blue-600">Hosts monitorados</p>
                </div>
                {getStatusBadge(systemStatus.zabbix.status)}
              </div>
              {systemStatus.zabbix.alerts > 0 && (
                <div className="mt-2 text-xs text-yellow-600">
                  {systemStatus.zabbix.alerts} alertas ativos
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Backups</CardTitle>
              <HardDrive className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-900">{systemStatus.backups.total}</div>
                  <p className="text-xs text-blue-600">Clientes</p>
                </div>
                {getStatusBadge(systemStatus.backups.status)}
              </div>
              {systemStatus.backups.failed > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  {systemStatus.backups.failed} falhou
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Serviços</CardTitle>
              <Server className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {systemStatus.services.active}/{systemStatus.services.total}
                  </div>
                  <p className="text-xs text-blue-600">Ativos</p>
                </div>
                {getStatusBadge(systemStatus.services.status)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Recentes
              </CardTitle>
              <CardDescription>Últimas notificações do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time} atrás</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estatísticas Rápidas
              </CardTitle>
              <CardDescription>Resumo das atividades hoje</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-900">Chamados Resolvidos</span>
                  </div>
                  <span className="font-bold text-green-900">8</span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-900">Backups Verificados</span>
                  </div>
                  <span className="font-bold text-blue-900">11</span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-900">Usuários Ativos</span>
                  </div>
                  <span className="font-bold text-yellow-900">127</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
