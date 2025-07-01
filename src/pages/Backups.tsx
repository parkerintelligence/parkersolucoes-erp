
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HardDrive, 
  Server, 
  Wifi, 
  WifiOff, 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  RefreshCw,
  Home,
  ArrowLeft,
  Search,
  Grid,
  List,
  Settings,
  Info,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { FtpFileExplorer } from '@/components/FtpFileExplorer';
import { FtpStatusPanel } from '@/components/FtpStatusPanel';
import { FtpToolbar } from '@/components/FtpToolbar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Backups = () => {
  const { files, isLoadingFiles, ftpIntegration, refetchFiles, ftpIntegrations } = useFtp();
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WifiOff className="h-8 w-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-2">
                  Nenhuma Conexão FTP Configurada
                </h2>
                <p className="text-yellow-700 mb-6 text-lg">
                  Para gerenciar arquivos de backup, configure uma integração FTP no Painel de Administração.
                </p>
                <Button 
                  size="lg"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
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
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <HardDrive className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Gerenciador FTP
                  </h1>
                  <p className="text-gray-600">
                    Gerencie arquivos de backup no servidor FTP
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
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

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Status Panel */}
            <div className="lg:col-span-1">
              <FtpStatusPanel 
                ftpIntegration={ftpIntegration}
                totalFiles={files.length}
                totalSize={totalSize}
                recentFiles={recentFiles}
                formatFileSize={formatFileSize}
              />
            </div>

            {/* Main File Explorer */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Explorador de Arquivos
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
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
