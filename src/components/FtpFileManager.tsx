
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Folder, File, Download, Trash2, Upload, RefreshCw, Home, ArrowLeft, Eye } from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { FtpUploadDialog } from './FtpUploadDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FtpFileManagerProps {
  className?: string;
}

export const FtpFileManager = ({ className }: FtpFileManagerProps) => {
  const { files, isLoadingFiles, ftpIntegration, downloadFile, deleteFile, refetchFiles } = useFtp();
  const [currentPath, setCurrentPath] = React.useState('/');
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'sql':
        return <File className="h-4 w-4 text-green-600" />;
      case 'txt':
        return <File className="h-4 w-4 text-gray-600" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <File className="h-4 w-4 text-orange-600" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleSelectFile = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
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

  const handleDownloadSelected = async () => {
    for (const fileName of selectedFiles) {
      try {
        await downloadFile.mutateAsync(fileName);
      } catch (error) {
        console.error('Erro ao baixar arquivo:', fileName, error);
      }
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
    refetchFiles();
  };

  const getPathBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let currentPathBuild = '';
    parts.forEach(part => {
      currentPathBuild += `/${part}`;
      breadcrumbs.push({ name: part, path: currentPathBuild });
    });
    
    return breadcrumbs;
  };

  if (!ftpIntegration) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conexão FTP configurada</h3>
          <p className="text-gray-600">Configure uma integração FTP no painel de administração para gerenciar arquivos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-600" />
            Gerenciador de Arquivos FTP
          </CardTitle>
          <div className="flex gap-2">
            <FtpUploadDialog />
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
        
        {/* Conexão Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Conectado a: {ftpIntegration.base_url}</span>
            </div>
            <span className="text-blue-600">Usuário: {ftpIntegration.username}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Navegação */}
        <div className="border-b bg-gray-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToPath('/')}
              className="flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Início
            </Button>
            {currentPath !== '/' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const parts = currentPath.split('/').filter(Boolean);
                  parts.pop();
                  navigateToPath(parts.length ? `/${parts.join('/')}` : '/');
                }}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            {getPathBreadcrumbs().map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <span>/</span>}
                <button
                  onClick={() => navigateToPath(crumb.path)}
                  className="hover:text-blue-600 underline"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        {selectedFiles.length > 0 && (
          <div className="border-b bg-yellow-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {selectedFiles.length} arquivo(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSelected}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir {selectedFiles.length} arquivo(s) selecionado(s)?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                        Excluir Arquivos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Arquivos */}
        <div className="p-3">
          {isLoadingFiles ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Carregando arquivos...</p>
            </div>
          ) : files.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(files.map(f => f.name));
                        } else {
                          setSelectedFiles([]);
                        }
                      }}
                      checked={selectedFiles.length === files.length && files.length > 0}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Modificado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.name)}
                        onChange={() => handleSelectFile(file.name)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name, file.isDirectory)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.isDirectory ? '-' : formatFileSize(file.size)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(file.lastModified, 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div className="text-gray-500">{format(file.lastModified, 'HH:mm', { locale: ptBR })}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {file.isDirectory ? 'Pasta' : 'Arquivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {!file.isDirectory && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile.mutate(file.name)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir <strong>{file.name}</strong>?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteFile.mutate(file.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pasta vazia</h3>
              <p className="text-gray-600 mb-4">Nenhum arquivo encontrado neste diretório.</p>
              <FtpUploadDialog />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
