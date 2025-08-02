
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  File, 
  Download, 
  Trash2, 
  RefreshCw,
  Calendar,
  HardDrive,
  FileText,
  Archive,
  Database
} from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { FtpUploadDialog } from './FtpUploadDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FtpFile {
  name: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
  path: string;
}

interface FtpFileExplorerProps {
  files: FtpFile[];
  isLoading: boolean;
  viewMode: 'list' | 'grid';
  selectedFiles: string[];
  onSelectFile: (files: string[]) => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  formatFileSize: (bytes: number) => string;
}

export const FtpFileExplorer = ({ 
  files, 
  isLoading, 
  viewMode, 
  selectedFiles, 
  onSelectFile, 
  currentPath, 
  onNavigate, 
  formatFileSize 
}: FtpFileExplorerProps) => {
  const { downloadFile, deleteFile } = useFtp();

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="h-5 w-5 text-blue-500" />;
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'sql':
        return <Database className="h-5 w-5 text-green-600" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-600" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Archive className="h-5 w-5 text-orange-600" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFileTypeColor = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return 'bg-blue-100 text-blue-800';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'sql':
        return 'bg-green-100 text-green-800';
      case 'txt':
        return 'bg-gray-100 text-gray-800';
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileAge = (lastModified: Date) => {
    const daysDiff = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return 'bg-green-100 text-green-800';
    if (daysDiff === 1) return 'bg-yellow-100 text-yellow-800';
    if (daysDiff <= 7) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Nova função para determinar a cor de fundo da linha baseada na data
  const getRowBackgroundColor = (lastModified: Date) => {
    const daysDiff = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 2) {
      return 'bg-pink-50 hover:bg-pink-100'; // Rosa para arquivos antigos (mais de 2 dias)
    }
    return 'bg-green-50 hover:bg-green-100'; // Verde claro para arquivos recentes
  };

  const handleSelectFile = (fileName: string) => {
    const newSelection = selectedFiles.includes(fileName) 
      ? selectedFiles.filter(f => f !== fileName)
      : [...selectedFiles, fileName];
    onSelectFile(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      onSelectFile([]);
    } else {
      onSelectFile(files.map(f => f.name));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Carregando arquivos...</h3>
        <p className="text-gray-600">Conectando ao servidor FTP</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Folder className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Pasta vazia</h3>
        <p className="text-gray-600 mb-4">Nenhum arquivo encontrado neste diretório.</p>
        <FtpUploadDialog />
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedFiles.includes(file.name) 
                  ? 'border-blue-500 bg-blue-50' 
                  : `border-gray-200 hover:border-gray-300 ${getRowBackgroundColor(file.lastModified)}`
              }`}
              onClick={() => handleSelectFile(file.name)}
            >
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  {getFileIcon(file.name, file.isDirectory)}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate mb-1">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {file.isDirectory ? 'Pasta' : formatFileSize(file.size)}
                </p>
                <Badge className={`text-xs mt-1 ${getFileAge(file.lastModified)}`}>
                  {format(file.lastModified, 'dd/MM', { locale: ptBR })}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedFiles.length === files.length && files.length > 0}
                className="rounded border-gray-300"
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
            <TableRow 
              key={index} 
              className={`transition-colors ${
                selectedFiles.includes(file.name) 
                  ? 'bg-blue-50' 
                  : getRowBackgroundColor(file.lastModified)
              }`}
            >
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.name)}
                  onChange={() => handleSelectFile(file.name)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name, file.isDirectory)}
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.path}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {file.isDirectory ? '-' : formatFileSize(file.size)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <div className="text-gray-900">
                      {format(file.lastModified, 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <div className="text-gray-500">
                      {format(file.lastModified, 'HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${getFileTypeColor(file.name, file.isDirectory)}`}>
                  {file.isDirectory ? 'Pasta' : file.name.split('.').pop()?.toUpperCase() || 'Arquivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {!file.isDirectory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile.mutate(file.name)}
                      className="h-8 w-8 p-0"
                      title="Baixar arquivo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir arquivo"
                      >
                        <Trash2 className="h-4 w-4" />
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
    </div>
  );
};
