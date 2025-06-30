
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HardDrive, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

const Backups = () => {
  const backupStatus = [
    { client: 'Cliente A', lastBackup: '2024-06-30 02:00', status: 'Success', size: '2.3 GB', location: '/backups/clienteA/' },
    { client: 'Cliente B', lastBackup: '2024-06-30 02:15', status: 'Success', size: '1.8 GB', location: '/backups/clienteB/' },
    { client: 'Cliente C', lastBackup: '2024-06-29 02:00', status: 'Failed', size: '-', location: '/backups/clienteC/' },
    { client: 'Cliente D', lastBackup: '2024-06-30 02:30', status: 'Success', size: '4.1 GB', location: '/backups/clienteD/' },
    { client: 'Cliente E', lastBackup: '2024-06-30 01:45', status: 'Warning', size: '950 MB', location: '/backups/clienteE/' },
  ];

  const ftpServers = [
    { name: 'FTP Principal', host: 'backup.empresa.com', status: 'Online', lastCheck: '2024-06-30 08:00' },
    { name: 'FTP Secundário', host: 'backup2.empresa.com', status: 'Online', lastCheck: '2024-06-30 08:00' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Sucesso</Badge>;
      case 'Failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Falhou</Badge>;
      case 'Warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Atenção</Badge>;
      case 'Online':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const successCount = backupStatus.filter(backup => backup.status === 'Success').length;
  const failedCount = backupStatus.filter(backup => backup.status === 'Failed').length;
  const warningCount = backupStatus.filter(backup => backup.status === 'Warning').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <HardDrive className="h-8 w-8" />
              Verificação de Backups
            </h1>
            <p className="text-blue-600">Monitoramento automático de backups via FTP</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Verificar Agora
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{successCount}</p>
                  <p className="text-sm text-blue-600">Sucessos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{failedCount}</p>
                  <p className="text-sm text-blue-600">Falhas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{warningCount}</p>
                  <p className="text-sm text-blue-600">Atenção</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{backupStatus.length}</p>
                  <p className="text-sm text-blue-600">Total Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup Status Table */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Status dos Backups por Cliente</CardTitle>
            <CardDescription>Verificação diária dos arquivos de backup no servidor FTP</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Último Backup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Localização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupStatus.map((backup, index) => (
                  <TableRow key={index} className="hover:bg-blue-50">
                    <TableCell className="font-medium flex items-center gap-2">
                      {getStatusIcon(backup.status)}
                      {backup.client}
                    </TableCell>
                    <TableCell>{backup.lastBackup}</TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell className="text-gray-600 font-mono text-sm">{backup.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* FTP Servers Status */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Status dos Servidores FTP</CardTitle>
            <CardDescription>Conectividade com os servidores de backup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ftpServers.map((server, index) => (
                <Card key={index} className="border-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">{server.name}</h4>
                      {getStatusBadge(server.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Host: {server.host}</p>
                    <p className="text-sm text-gray-600">Última verificação: {server.lastCheck}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Backup History Chart Placeholder */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Histórico de Backups (Últimos 7 dias)</CardTitle>
            <CardDescription>Evolução do status dos backups ao longo da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Gráfico de histórico será exibido aqui</p>
                <p className="text-sm text-gray-500">Integração com dados históricos em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Backups;
