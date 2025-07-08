
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HardDrive, RefreshCw, Database, CheckCircle, XCircle, Folder, Download, Trash2, Clock } from 'lucide-react';
import { formatFileSize, getDaysFromLastModification } from '@/utils/ftpUtils';

interface BackupsFileTableProps {
  files: any[];
  isLoadingFiles: boolean;
  currentPath: string;
  onFolderClick: (folder: any) => void;
  onDownload: (fileName: string) => void;
  onDelete: (fileName: string) => void;
  onRefresh: () => void;
  downloadFile: any;
  deleteFile: any;
}

const BackupsFileTable: React.FC<BackupsFileTableProps> = ({
  files,
  isLoadingFiles,
  currentPath,
  onFolderClick,
  onDownload,
  onDelete,
  onRefresh,
  downloadFile,
  deleteFile
}) => {
  const getStatusBadge = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Pasta</Badge>;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (fileName.includes(today)) {
      return <Badge className="bg-green-900/20 text-green-400 border-green-600">Atual</Badge>;
    } else if (fileName.includes('error') || fileName.includes('failed')) {
      return <Badge className="bg-red-900/20 text-red-400 border-red-600">Erro</Badge>;
    } else {
      return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Completo</Badge>;
    }
  };

  const getStatusIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="h-4 w-4 text-blue-400" />;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (fileName.includes(today)) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    } else if (fileName.includes('error') || fileName.includes('failed')) {
      return <XCircle className="h-4 w-4 text-red-400" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-blue-400" />;
    }
  };

  const getTimeLabel = (lastModified: string | Date, isDirectory: boolean) => {
    if (!isDirectory) return null;
    
    const days = getDaysFromLastModification(lastModified);
    const isOld = days > 2; // Mais de 48 horas (2 dias)
    
    return (
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className={`text-xs px-2 py-1 rounded ${isOld ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
          {days} {days === 1 ? 'dia' : 'dias'}
        </span>
      </div>
    );
  };

  // Ordenar arquivos por data de modificação (decrescente)
  const sortedFiles = [...files].sort((a, b) => {
    const dateA = new Date(a.lastModified);
    const dateB = new Date(b.lastModified);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Arquivos de Backup
            </CardTitle>
            <CardDescription className="text-gray-400">
              Arquivos e pastas disponíveis no servidor FTP (ordenados por data de modificação)
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            disabled={isLoadingFiles} 
            className="border-gray-600 text-gray-200 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingFiles ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-gray-400">Carregando backups do FTP...</p>
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Nenhum arquivo ou pasta encontrado</p>
            <p className="text-gray-500 text-sm mt-2">
              Diretório: {currentPath}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Tamanho</TableHead>
                  <TableHead className="text-gray-300">Data de Modificação</TableHead>
                  <TableHead className="text-gray-300">Tempo</TableHead>
                  <TableHead className="text-gray-300">Permissões</TableHead>
                  <TableHead className="text-right text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiles.map(file => (
                  <TableRow 
                    key={file.name} 
                    className={`border-gray-700 hover:bg-gray-800/30 ${file.isDirectory ? 'cursor-pointer' : ''}`}
                    onClick={() => file.isDirectory && onFolderClick(file)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.name, file.isDirectory)}
                        {getStatusBadge(file.name, file.isDirectory)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-200">{file.name}</TableCell>
                    <TableCell className="text-gray-300">
                      {file.isDirectory ? '-' : formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(file.lastModified).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {getTimeLabel(file.lastModified, file.isDirectory)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {file.permissions || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {!file.isDirectory && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(file.name);
                            }}
                            disabled={downloadFile.isPending} 
                            className="border-gray-600 text-gray-200 hover:bg-gray-700"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file.name);
                          }}
                          disabled={deleteFile.isPending} 
                          className="border-red-600 text-red-400 hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupsFileTable;
