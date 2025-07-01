
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
  Settings,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useRealFtp } from '@/hooks/useRealFtp';
import { FtpUploadDialog } from '@/components/FtpUploadDialog';
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
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  
  // Corrigir o cálculo de arquivos recentes - garantir que lastModified é Date
  const recentFiles = files.filter(file => {
    try {
      const fileDate = file.lastModified instanceof Date ? file.lastModified : new Date(file.lastModified);
      const daysDiff = Math.floor((Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 1;
    } catch (error) {
      console.error('Error calculating file age:', error);
      return false;
    }
  }).length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    try {
      const validDate = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(validDate);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data inválida';
    }
  };

  const handleSelectFile = (fileName: string) => {
    const newSelection = selectedFiles.includes(fileName) 
      ? selectedFiles.filter(f => f !== fileName)
      : [...selectedFiles, fileName];
    setSelectedFiles(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.name));
    }
  };

  const handleDownloadSelected = async () => {
    for (const fileName of selectedFiles) {
      try {
        await downloadFile.mutateAsync(fileName);
      } catch (error) {
        console.error('Erro ao baixar arquivo:', fileName, error);
      }
    }
  };

  const handleDeleteSelected = async () => {
    for (const fileName of selectedFiles) {
      try {
        await deleteFile.mutateAsync(fileName);
      } catch (error) {
        console.error('Erro ao excluir arquivo:', fileName, error);
      }
    }
    setSelectedFiles([]);
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="h-5 w-5 text-blue-500" />;
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'sql':
        return <File className="h-5 w-5 text-green-600" />;
      case 'txt':
      case 'log':
        return <File className="h-5 w-5 text-gray-600" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <File className="h-5 w-5 text-orange-600" />;
      case 'json':
      case 'xml':
        return <File className="h-5 w-5 text-purple-600" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
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
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <HardDrive className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Explorador de Arquivos FTP Real
            </h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Server className="h-4 w-4" />
              {ftpIntegration.base_url.replace(/^(ftp:\/\/|ftps:\/\/)/, '')}
              {ftpIntegration.port && ftpIntegration.port !== 21 && `:${ftpIntegration.port}`}
              <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado ao Servidor Real
              </Badge>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <File className="h-4 w-4" />
                {files.length} arquivos
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {recentFiles} recentes
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="h-4 w-4" />
                {formatFileSize(totalSize)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchFiles()}
            disabled={isLoadingFiles}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            Atualizar Servidor
          </Button>
        </div>
      </div>

      {/* Card principal do explorador FTP */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Server className="h-5 w-5 text-slate-600" />
            Explorador Real - Servidor FTP
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              {ftpIntegration.name}
            </Badge>
          </CardTitle>
        </CardHeader>

        {/* Navegação de Diretórios */}
        <FtpDirectoryNavigator
          currentPath={currentPath}
          directories={directories.map(dir => ({ name: dir.name, path: dir.path }))}
          onNavigate={navigateToDirectory}
          onGoBack={goToParentDirectory}
        />

        {/* Barra de Ferramentas */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar arquivos e pastas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <FtpUploadDialog />
              
              {selectedFiles.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSelected}
                    disabled={downloadFile.isPending}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar ({selectedFiles.length})
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir ${selectedFiles.length} arquivo(s)?`)) {
                        handleDeleteSelected();
                      }
                    }}
                    disabled={deleteFile.isPending}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir ({selectedFiles.length})
                  </Button>
                </>
              )}
              
              <div className="text-sm text-slate-600 bg-white px-3 py-2 rounded border">
                {filteredFiles.length} item(s) em {currentPath}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Conectando ao Servidor FTP Real...
                </h3>
                <p className="text-gray-600 text-sm">
                  Acessando {ftpIntegration.base_url}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Caminho atual: {currentPath}
                </p>
                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">
                    🔗 Conectando ao servidor real configurado no painel administrativo
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Host: {ftpIntegration.base_url} | Usuário: {ftpIntegration.username}
                  </p>
                </div>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum arquivo encontrado' : 'Pasta vazia no servidor'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? `Nenhum resultado para "${searchTerm}" em ${currentPath}` 
                  : `O diretório ${currentPath} está vazio no servidor FTP real`
                }
              </p>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                <p className="text-sm text-green-800">
                  ✅ Conectado com sucesso ao servidor FTP configurado
                </p>
              </div>
              {!searchTerm && <FtpUploadDialog />}
            </div>
          ) : (
            <div>
              <div className="bg-green-50 p-3 border-b border-green-200">
                <p className="text-sm text-green-800 font-medium text-center">
                  ✅ Exibindo {filteredFiles.length} itens do servidor FTP real: {ftpIntegration.base_url}
                </p>
              </div>
              
              {/* Cabeçalho da tabela */}
              <div className="flex items-center p-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
                <div className="w-12 flex items-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedFiles.length === files.length && files.length > 0}
                    className="rounded border-gray-300"
                  />
                </div>
                <div className="flex-1">Nome</div>
                <div className="w-24 text-center">Tamanho</div>
                <div className="w-40 text-center">Modificado</div>
                <div className="w-32 text-center">Permissões</div>
                <div className="w-24 text-center">Ações</div>
              </div>

              {/* Lista de arquivos */}
              <div className="divide-y">
                {filteredFiles.map((file, index) => (
                  <div key={index} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                    <div className="w-12 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.name)}
                        onChange={() => handleSelectFile(file.name)}
                        className="rounded border-gray-300"
                      />
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        {file.isDirectory ? (
                          <button
                            onClick={() => navigateToDirectory(file.path)}
                            className="p-1 hover:bg-blue-50 rounded transition-colors"
                            title="Abrir pasta"
                          >
                            <Folder className="h-5 w-5 text-blue-500" />
                          </button>
                        ) : (
                          getFileIcon(file.name, file.isDirectory)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.isDirectory ? (
                              <button
                                onClick={() => navigateToDirectory(file.path)}
                                className="hover:text-blue-600 hover:underline text-left"
                                title="Abrir pasta"
                              >
                                {file.name}
                              </button>
                            ) : (
                              file.name
                            )}
                          </p>
                          {file.isDirectory && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Pasta
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          Proprietário: {file.owner}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-24 text-center text-sm text-gray-600">
                      {file.isDirectory ? '-' : formatFileSize(file.size)}
                    </div>
                    
                    <div className="w-40 text-center text-sm text-gray-600">
                      <div>{formatDate(file.lastModified)}</div>
                    </div>
                    
                    <div className="w-32 text-center">
                      <Badge variant="outline" className="text-xs font-mono">
                        {file.permissions}
                      </Badge>
                    </div>
                    
                    <div className="w-24 flex items-center justify-center gap-1">
                      {!file.isDirectory && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Backups;
