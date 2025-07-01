import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HardDrive, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Download, Server } from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Backups = () => {
  const { files, isLoadingFiles, ftpIntegration, testConnection, downloadFile } = useFtp();

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileRowClass = (lastModified: Date) => {
    const today = isToday(lastModified);
    const daysDiff = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24));
    
    if (today) {
      return 'bg-green-50 hover:bg-green-100 border-green-200';
    } else if (daysDiff >= 2) {
      return 'bg-pink-50 hover:bg-pink-100 border-pink-200';
    }
    return 'hover:bg-blue-50';
  };

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
          <div className="flex gap-2">
            {ftpIntegration && (
              <Button 
                variant="outline" 
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending}
                className="flex items-center gap-2"
              >
                <Server className="h-4 w-4" />
                {testConnection.isPending ? 'Testando...' : 'Testar FTP'}
              </Button>
            )}
            <Button className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar Agora
            </Button>
          </div>
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
                  <p className="text-2xl font-bold text-blue-900">{files.length}</p>
                  <p className="text-sm text-blue-600">Arquivos FTP</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FTP Files Grid */}
        {ftpIntegration ? (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Server className="h-5 w-5" />
                Arquivos de Backup - Servidor FTP
              </CardTitle>
              <CardDescription>
                Arquivos encontrados no servidor FTP configurado
                <div className="flex gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 rounded"></div>
                    <span>Backup de hoje</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-pink-200 rounded"></div>
                    <span>Backup desatualizado (2+ dias)</span>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFiles ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Carregando arquivos do FTP...</p>
                </div>
              ) : files.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Arquivo</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Última Modificação</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file, index) => (
                      <TableRow 
                        key={index} 
                        className={getFileRowClass(file.lastModified)}
                      >
                        <TableCell className="font-medium flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-blue-500" />
                          {file.name}
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>
                          {format(file.lastModified, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-gray-600 font-mono text-sm">
                          {file.path}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile.mutate(file.name)}
                            disabled={downloadFile.isPending}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            {downloadFile.isPending ? 'Baixando...' : 'Download'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Nenhum arquivo encontrado no servidor FTP</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Verifique se a conexão FTP está configurada corretamente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Integração FTP não configurada
                </h3>
                <p className="text-yellow-700 mb-4">
                  Para visualizar os arquivos de backup, configure uma integração FTP no Painel de Administração.
                </p>
                <Button 
                  variant="outline" 
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-50"
                >
                  Configurar FTP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
