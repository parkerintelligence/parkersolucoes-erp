import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, RefreshCw, Database, CheckCircle, XCircle, Folder, Download, Trash2, Clock, ArrowUpDown, Calendar, FileText, Type } from 'lucide-react';
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
type SortOption = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

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
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Padrão: maior data primeiro
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

    return <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className={`text-xs px-2 py-1 rounded ${isOld ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
          {days} {days === 1 ? 'dia' : 'dias'}
        </span>
      </div>;
  };

  const getSortedFiles = () => {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;
      
      // Sempre mostrar pastas primeiro, independente da ordenação
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pt-BR', { 
            numeric: true, 
            sensitivity: 'base' 
          });
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'date':
          const dateA = new Date(a.lastModified);
          const dateB = new Date(b.lastModified);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'type':
          const getFileExtension = (name: string) => {
            if (a.isDirectory || b.isDirectory) return '';
            return name.split('.').pop()?.toLowerCase() || '';
          };
          const extA = getFileExtension(a.name);
          const extB = getFileExtension(b.name);
          comparison = extA.localeCompare(extB);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      // Se clicou na mesma coluna, inverte a ordem
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nova coluna, usa ordem padrão
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'date' ? 'desc' : 'asc'); // Data padrão desc, outros asc
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return <ArrowUpDown className="h-3 w-3 text-slate-500" />;
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-3 w-3 text-blue-400 rotate-180" /> : 
      <ArrowUpDown className="h-3 w-3 text-blue-400" />;
  };

  const sortedFiles = getSortedFiles();
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Arquivos de Backup
            </CardTitle>
            <CardDescription className="text-slate-400">
              Arquivos e pastas disponíveis no servidor FTP
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Ordenar por:</span>
              <Select value={sortBy} onValueChange={(value: SortOption) => handleSortChange(value)}>
                <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="date" className="text-white">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Modificação
                    </div>
                  </SelectItem>
                  <SelectItem value="name" className="text-white">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Nome
                    </div>
                  </SelectItem>
                  <SelectItem value="size" className="text-white">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Tamanho
                    </div>
                  </SelectItem>
                  <SelectItem value="type" className="text-white">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tipo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={onRefresh} 
              disabled={isLoadingFiles} 
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingFiles ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-slate-400">Carregando backups do FTP...</p>
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Database className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">Nenhum arquivo ou pasta encontrado</p>
            <p className="text-slate-500 text-sm mt-2">
              Diretório: {currentPath}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead 
                    className="text-slate-300 cursor-pointer hover:text-white transition-colors" 
                    onClick={() => handleSortChange('name')}
                  >
                    <div className="flex items-center gap-1">
                      Nome
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-slate-300 cursor-pointer hover:text-white transition-colors" 
                    onClick={() => handleSortChange('size')}
                  >
                    <div className="flex items-center gap-1">
                      Tamanho
                      {getSortIcon('size')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-slate-300 cursor-pointer hover:text-white transition-colors" 
                    onClick={() => handleSortChange('date')}
                  >
                    <div className="flex items-center gap-1">
                      Data de Modificação
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300">Tempo</TableHead>
                  <TableHead className="text-slate-300">Permissões</TableHead>
                  <TableHead className="text-right text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiles.map(file => (
                  <TableRow 
                    key={file.name} 
                    className={`border-slate-700 hover:bg-slate-800/30 ${file.isDirectory ? 'cursor-pointer' : ''}`} 
                    onClick={() => file.isDirectory && onFolderClick(file)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.name, file.isDirectory)}
                        {getStatusBadge(file.name, file.isDirectory)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">{file.name}</TableCell>
                    <TableCell className="text-slate-300">
                      {file.isDirectory ? '-' : formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(file.lastModified).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {getTimeLabel(file.lastModified, file.isDirectory)}
                    </TableCell>
                    <TableCell className="text-slate-300">
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
                            className="border-slate-600 text-slate-200 hover:bg-slate-700"
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
                          className="border-red-600 bg-red-900 hover:bg-red-800 text-slate-50"
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