
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HardDrive, 
  Server, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  Database,
  Clock
} from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { FtpFileExplorer } from '@/components/FtpFileExplorer';
import { FtpStatusPanel } from '@/components/FtpStatusPanel';
import { FtpToolbar } from '@/components/FtpToolbar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Backups = () => {
  const { files, isLoadingFiles, ftpIntegration, refetchFiles, ftpIntegrations, testConnection } = useFtp();
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const recentFiles = files.filter(file => {
    const daysDiff = Math.floor((Date.now() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 1;
  }).length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!ftpIntegration) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Card className="border-yellow-200 bg-yellow-50 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <WifiOff className="h-10 w-10 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-bold text-yellow-800 mb-4">
                  Nenhuma Conexão FTP Configurada
                </h2>
                <p className="text-yellow-700 mb-8 text-lg max-w-2xl mx-auto">
                  Para gerenciar arquivos de backup, você precisa configurar uma integração FTP no Painel de Administração.
                </p>
                <Button 
                  size="lg"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3"
                  onClick={() => window.location.href = '/admin'}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Configurar Integração FTP
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HardDrive className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gerenciador de Backups FTP
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Gerencie e monitore arquivos de backup no servidor FTP
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Conectado
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {ftpIntegration.base_url.replace(/^(ftp:\/\/|ftps:\/\/)/, '')}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${testConnection.isPending ? 'animate-spin' : ''}`} />
                  {testConnection.isPending ? 'Testando...' : 'Testar Conexão'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchFiles()}
                  disabled={isLoadingFiles}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Status Panel - Sidebar */}
            <div className="xl:col-span-1">
              <div className="space-y-6">
                {/* Connection Status */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wifi className="h-5 w-5" />
                      Status da Conexão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Server className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Servidor</span>
                        </div>
                        <p className="text-xs bg-gray-50 px-3 py-2 rounded font-mono break-all">
                          {ftpIntegration.base_url}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm font-medium">Usuário</span>
                        </div>
                        <p className="text-xs bg-gray-50 px-3 py-2 rounded">
                          {ftpIntegration.username || 'anonymous'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HardDrive className="h-5 w-5" />
                      Estatísticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <HardDrive className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Total de Arquivos</p>
                            <p className="text-xs text-gray-600">no servidor</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{files.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Clock className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Arquivos Recentes</p>
                            <p className="text-xs text-gray-600">hoje</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-green-600">{recentFiles}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Database className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Tamanho Total</p>
                            <p className="text-xs text-gray-600">todos os arquivos</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-purple-600">
                          {formatFileSize(totalSize)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main File Explorer */}
            <div className="xl:col-span-3">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Server className="h-6 w-6" />
                      Explorador de Arquivos
                    </CardTitle>
                    <div className="text-sm opacity-90">
                      {filteredFiles.length} arquivo(s) encontrado(s)
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Toolbar */}
                  <FtpToolbar 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    currentPath={currentPath}
                    setCurrentPath={setCurrentPath}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                  />

                  <Separator />

                  {/* File Explorer */}
                  <FtpFileExplorer 
                    files={filteredFiles}
                    isLoading={isLoadingFiles}
                    viewMode={viewMode}
                    selectedFiles={selectedFiles}
                    onSelectFile={setSelectedFiles}
                    currentPath={currentPath}
                    onNavigate={setCurrentPath}
                    formatFileSize={formatFileSize}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Backups;
