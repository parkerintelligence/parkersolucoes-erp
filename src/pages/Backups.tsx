
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HardDrive, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Download, Server, Wifi, WifiOff } from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Backups = () => {
  const { files, isLoadingFiles, ftpIntegration, testConnection, downloadFile, ftpIntegrations } = useFtp();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'Failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      case 'Warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />Atenção</Badge>;
      case 'Online':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><Wifi className="h-3 w-3 mr-1" />Online</Badge>;
      case 'Offline':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><WifiOff className="h-3 w-3 mr-1" />Offline</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
      return 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500';
    } else if (daysDiff >= 2) {
      return 'bg-pink-50 hover:bg-pink-100 border-l-4 border-l-pink-500';
    }
    return 'hover:bg-blue-50 border-l-4 border-l-transparent';
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.includes('.sql')) {
      return <HardDrive className="h-4 w-4 text-blue-600" />;
    }
    return <HardDrive className="h-4 w-4 text-gray-500" />;
  };

  const successCount = files.filter(file => isToday(file.lastModified)).length;
  const outdatedCount = files.filter(file => {
    const daysDiff = Math.floor((Date.now() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 2;
  }).length;

  return (
    <Layout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <HardDrive className="h-8 w-8 text-blue-600" />
              </div>
              Verificação de Backups
            </h1>
            <p className="text-gray-600 mt-2">Monitoramento automático de backups via servidor FTP</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {ftpIntegration && (
              <Button 
                variant="outline" 
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending}
                className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
              >
                <Server className="h-4 w-4" />
                {testConnection.isPending ? 'Testando...' : 'Testar Conexão'}
              </Button>
            )}
            <Button 
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* FTP Server Info Card */}
        {ftpIntegration ? (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <Server className="h-5 w-5" />
                Servidor FTP Configurado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Nome da Integração</p>
                  <p className="text-gray-900 font-semibold">{ftpIntegration.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Servidor</p>
                  <p className="text-gray-900 font-mono text-sm">{ftpIntegration.base_url}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Usuário</p>
                  <p className="text-gray-900">{ftpIntegration.username || 'Não especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Nenhuma integração FTP configurada
                </h3>
                <p className="text-yellow-700 mb-4">
                  Para visualizar os backups, configure uma integração FTP no Painel de Administração.
                </p>
                <Button 
                  variant="outline" 
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                  onClick={() => window.location.href = '/admin'}
                >
                  Configurar FTP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{files.length}</p>
                  <p className="text-sm text-gray-600">Total de Arquivos</p>
                </div>
                <HardDrive className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{successCount}</p>
                  <p className="text-sm text-gray-600">Backups de Hoje</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-pink-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{outdatedCount}</p>
                  <p className="text-sm text-gray-600">Backups Antigos</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{ftpIntegrations.length}</p>
                  <p className="text-sm text-gray-600">Servidores FTP</p>
                </div>
                <Server className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files Table */}
        {ftpIntegration && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                    Arquivos de Backup
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Arquivos encontrados no servidor FTP configurado
                  </CardDescription>
                </div>
                
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-green-100 border-l-4 border-l-green-500 rounded-sm"></div>
                    <span className="text-gray-600">Backup de hoje</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-pink-100 border-l-4 border-l-pink-500 rounded-sm"></div>
                    <span className="text-gray-600">Backup desatualizado (2+ dias)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {isLoadingFiles ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600 font-medium">Carregando arquivos do servidor FTP...</p>
                  <p className="text-sm text-gray-500 mt-2">Conectando em {ftpIntegration.base_url}</p>
                </div>
              ) : files.length > 0 ? (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Arquivo</TableHead>
                        <TableHead className="font-semibold text-gray-700">Tamanho</TableHead>
                        <TableHead className="font-semibold text-gray-700">Última Modificação</TableHead>
                        <TableHead className="font-semibold text-gray-700">Localização</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file, index) => (
                        <TableRow 
                          key={index} 
                          className={getFileRowClass(file.lastModified)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.name)}
                              <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(file.lastModified, { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-gray-700">
                              {formatFileSize(file.size)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900">
                                {format(file.lastModified, 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(file.lastModified, 'HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                              {file.path}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile.mutate(file.name)}
                              disabled={downloadFile.isPending}
                              className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Download className="h-3 w-3" />
                              {downloadFile.isPending ? 'Baixando...' : 'Download'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Server className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arquivo encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    Não foram encontrados arquivos de backup no servidor FTP configurado
                  </p>
                  <p className="text-sm text-gray-500">
                    Servidor: <code className="bg-gray-100 px-2 py-1 rounded">{ftpIntegration.base_url}</code>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Backups;
