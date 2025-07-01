
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HardDrive, 
  Server, 
  RefreshCw,
  AlertTriangle,
  WifiOff
} from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { FtpFileExplorer } from '@/components/FtpFileExplorer';
import { FtpToolbar } from '@/components/FtpToolbar';
import { FtpStatsPopover } from '@/components/FtpStatsPopover';

const Backups = () => {
  const { files, isLoadingFiles, ftpIntegration, refetchFiles } = useFtp();
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
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-3">
                Nenhuma Conexão FTP Configurada
              </h2>
              <p className="text-yellow-700 mb-6 max-w-md mx-auto">
                Para gerenciar arquivos de backup, configure uma integração FTP no Painel de Administração.
              </p>
              <Button 
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={() => window.location.href = '/admin'}
              >
                Configurar Integração FTP
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gerenciador de Backups FTP
              </h1>
              <p className="text-sm text-gray-600">
                Conectado a: {ftpIntegration.base_url.replace(/^(ftp:\/\/|ftps:\/\/)/, '')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <FtpStatsPopover 
              totalFiles={files.length}
              recentFiles={recentFiles}
              totalSize={formatFileSize(totalSize)}
            />
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Server className="h-3 w-3 mr-1" />
              Online
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

        {/* Explorador de Arquivos Principal */}
        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Server className="h-5 w-5 text-slate-600" />
                Explorador de Arquivos
              </CardTitle>
              <div className="text-sm text-slate-600">
                {filteredFiles.length} arquivo(s)
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Toolbar de Navegação */}
            <FtpToolbar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              currentPath={currentPath}
              setCurrentPath={setCurrentPath}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />

            {/* Lista de Arquivos */}
            <div className="border-t">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Backups;
