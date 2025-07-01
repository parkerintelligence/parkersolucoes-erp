
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  HardDrive, 
  Server, 
  RefreshCw,
  WifiOff,
  Download,
  Trash2,
  Folder,
  File,
  Search,
  Settings
} from 'lucide-react';
import { useRealFtp } from '@/hooks/useRealFtp';
import { FtpStatsPopover } from '@/components/FtpStatsPopover';
import { FtpDirectoryNavigator } from '@/components/FtpDirectoryNavigator';

const Backups = () => {
  const { 
    files, 
    isLoadingFiles, 
    ftpIntegration, 
    currentPath,
    directories,
    navigateToDirectory,
    goToParentDirectory,
    refetchFiles, 
    downloadFile, 
    deleteFile 
  } = useRealFtp();
  
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!ftpIntegration) {
    return (
      <Layout>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-3">
              Nenhuma Conexão FTP Configurada
            </h2>
            <p className="text-yellow-700 mb-6 max-w-md mx-auto">
              Para gerenciar arquivos de backup FTP, configure uma integração FTP no Painel de Administração.
            </p>
            <Button 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => window.location.href = '/admin'}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Integração FTP
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header da Página */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <HardDrive className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Backups FTP
            </h1>
            <p className="text-sm text-gray-600">
              Servidor: {ftpIntegration.base_url.replace(/^(ftp:\/\/|ftps:\/\/)/, '')}
              {ftpIntegration.port && ftpIntegration.port !== 21 && `:${ftpIntegration.port}`}
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
            Conectado {ftpIntegration.port && `(Porta ${ftpIntegration.port})`}
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

      {/* Explorador de Arquivos FTP */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b p-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Server className="h-5 w-5 text-slate-600" />
            Explorador de Arquivos FTP
          </CardTitle>
        </CardHeader>

        {/* Navegação de Diretórios */}
        <FtpDirectoryNavigator
          currentPath={currentPath}
          directories={directories.map(dir => ({ name: dir.name, path: dir.path }))}
          onNavigate={navigateToDirectory}
          onGoBack={goToParentDirectory}
        />

        {/* Barra de Pesquisa */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-slate-600 ml-4">
              {filteredFiles.length} arquivo(s) em {currentPath}
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <div className="text-center">
                  <span className="text-gray-600">Carregando arquivos do servidor FTP...</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {ftpIntegration.base_url} {currentPath}
                  </p>
                </div>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum arquivo encontrado para a busca' : 'Pasta vazia'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Caminho atual: {currentPath}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {file.isDirectory ? (
                        <button
                          onClick={() => navigateToDirectory(file.path)}
                          className="p-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Folder className="h-5 w-5 text-blue-500" />
                        </button>
                      ) : (
                        <File className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.isDirectory ? (
                            <button
                              onClick={() => navigateToDirectory(file.path)}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {file.name}
                            </button>
                          ) : (
                            file.name
                          )}
                        </p>
                        {!file.isDirectory && (
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(file.size)}
                          </Badge>
                        )}
                        {file.isDirectory && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Pasta
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatDate(file.lastModified)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.permissions}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.owner}
                        </p>
                        <p className="text-xs text-gray-400">
                          {file.path}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!file.isDirectory && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile.mutate(file.name)}
                        disabled={downloadFile.isPending}
                        className="h-8 w-8 p-0"
                        title="Baixar arquivo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir ${file.name}?`)) {
                            deleteFile.mutate(file.name);
                          }
                        }}
                        disabled={deleteFile.isPending}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir arquivo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Backups;
