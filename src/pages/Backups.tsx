
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
  Upload,
  Trash2,
  Folder,
  File,
  Search
} from 'lucide-react';
import { useRealFtp } from '@/hooks/useRealFtp';
import { FtpStatsPopover } from '@/components/FtpStatsPopover';

const Backups = () => {
  const { files, isLoadingFiles, ftpIntegration, refetchFiles, downloadFile, deleteFile } = useRealFtp();
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
              Gerenciador de Backups FTP
            </h1>
            <p className="text-sm text-gray-600">
              Servidor: {ftpIntegration.base_url.replace(/^(ftp:\/\/|ftps:\/\/)/, '')}
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

      {/* Explorador de Arquivos */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Server className="h-5 w-5 text-slate-600" />
              Explorador de Arquivos FTP
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="text-sm text-slate-600">
                {filteredFiles.length} arquivo(s)
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Carregando arquivos do servidor FTP...</span>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <HardDrive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum arquivo encontrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {file.isDirectory ? (
                        <Folder className="h-5 w-5 text-blue-500" />
                      ) : (
                        <File className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        {!file.isDirectory && (
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(file.size)}
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
