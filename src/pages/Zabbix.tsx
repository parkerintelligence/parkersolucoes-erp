
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, AlertTriangle, Server, Wifi, Database, RefreshCw } from 'lucide-react';

const Zabbix = () => {
  const hosts = [
    { id: 1, name: 'srv-web01', ip: '192.168.1.10', status: 'Online', alerts: 0, uptime: '30d 15h' },
    { id: 2, name: 'srv-db01', ip: '192.168.1.11', status: 'Online', alerts: 1, uptime: '25d 8h' },
    { id: 3, name: 'srv-backup01', ip: '192.168.1.12', status: 'Warning', alerts: 2, uptime: '12d 3h' },
    { id: 4, name: 'switch-core', ip: '192.168.1.1', status: 'Online', alerts: 0, uptime: '45d 12h' },
  ];

  const alerts = [
    { id: 1, host: 'srv-db01', severity: 'Warning', message: 'High CPU utilization (85%)', time: '5 min ago' },
    { id: 2, host: 'srv-backup01', severity: 'High', message: 'Disk space low on /var', time: '10 min ago' },
    { id: 3, host: 'srv-backup01', severity: 'Average', message: 'High memory usage (78%)', time: '15 min ago' },
  ];

  const services = [
    { name: 'HTTP Service', status: 'Up', response: '120ms' },
    { name: 'Database Service', status: 'Up', response: '45ms' },
    { name: 'SMTP Service', status: 'Up', response: '230ms' },
    { name: 'FTP Service', status: 'Down', response: 'Timeout' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Online':
      case 'Up':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'Warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Atenção</Badge>;
      case 'Down':
      case 'Offline':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'High':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alta</Badge>;
      case 'Warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Atenção</Badge>;
      case 'Average':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Média</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Zabbix - Monitoramento
            </h1>
            <p className="text-blue-600">Monitoramento em tempo real da infraestrutura</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">45</p>
                  <p className="text-sm text-blue-600">Hosts Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">3</p>
                  <p className="text-sm text-blue-600">Alertas Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">98.5%</p>
                  <p className="text-sm text-blue-600">Disponibilidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">2</p>
                  <p className="text-sm text-blue-600">Em Manutenção</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Ativos
            </CardTitle>
            <CardDescription>Alertas que requerem atenção imediata</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{alert.host}</TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell className="text-gray-600">{alert.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hosts Status */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Status dos Hosts</CardTitle>
              <CardDescription>Principais servidores monitorados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alertas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hosts.map((host) => (
                    <TableRow key={host.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{host.name}</TableCell>
                      <TableCell>{host.ip}</TableCell>
                      <TableCell>{getStatusBadge(host.status)}</TableCell>
                      <TableCell>
                        {host.alerts > 0 ? (
                          <span className="text-red-600 font-medium">{host.alerts}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Services Status */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Status dos Serviços</CardTitle>
              <CardDescription>Serviços críticos monitorados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Server className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{service.response}</span>
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Zabbix;
