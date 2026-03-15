import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, RefreshCw, Database, CheckCircle, XCircle, Folder, Download, Trash2, Clock, ArrowUpDown, Calendar, FileText, Type, Calculator } from 'lucide-react';
import { formatFileSize, getDaysFromLastModification } from '@/utils/ftpUtils';
import { toast } from '@/hooks/use-toast';

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
  onCalculateSizes?: () => Promise<void>;
}
type SortOption = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

const BackupsFileTable: React.FC<BackupsFileTableProps> = ({
  files, isLoadingFiles, currentPath, onFolderClick, onDownload, onDelete, onRefresh, downloadFile, deleteFile, onCalculateSizes
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isCalculatingSizes, setIsCalculatingSizes] = useState(false);

  const getStatusBadge = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">Pasta</Badge>;
    const today = new Date().toISOString().split('T')[0];
    if (fileName.includes(today)) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-400">Atual</Badge>;
    if (fileName.includes('error') || fileName.includes('failed')) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">Erro</Badge>;
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">Completo</Badge>;
  };

  const getStatusIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder className="h-3.5 w-3.5 text-primary" />;
    const today = new Date().toISOString().split('T')[0];
    if (fileName.includes(today)) return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    if (fileName.includes('error') || fileName.includes('failed')) return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <CheckCircle className="h-3.5 w-3.5 text-primary" />;
  };

  const getTimeLabel = (lastModified: string | Date, isDirectory: boolean) => {
    if (!isDirectory) return null;
    const days = getDaysFromLastModification(lastModified);
    const isOld = days > 2;
    return (
      <div className="flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" />
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isOld ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-400'}`}>
          {days} {days === 1 ? 'dia' : 'dias'}
        </span>
      </div>
    );
  };

  const getSortedFiles = () => {
    return [...files].sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      let comparison = 0;
      switch (sortBy) {
        case 'name': comparison = a.name.localeCompare(b.name, 'pt-BR', { numeric: true, sensitivity: 'base' }); break;
        case 'size': comparison = (a.size || 0) - (b.size || 0); break;
        case 'date': comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime(); break;
        case 'type': comparison = (a.name.split('.').pop() || '').localeCompare(b.name.split('.').pop() || ''); break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortBy(newSortBy); setSortOrder('asc'); }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/50" />;
    return <ArrowUpDown className={`h-2.5 w-2.5 text-primary ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />;
  };

  const sortedFiles = getSortedFiles();

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary" />
              Arquivos de Backup
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Arquivos e pastas disponíveis no servidor FTP
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Ordenar:</span>
            <Select value={sortBy} onValueChange={(value: SortOption) => handleSortChange(value)}>
              <SelectTrigger className="w-[150px] h-7 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date" className="text-xs"><div className="flex items-center gap-2"><Calendar className="h-3 w-3" />Data</div></SelectItem>
                <SelectItem value="name" className="text-xs"><div className="flex items-center gap-2"><Type className="h-3 w-3" />Nome</div></SelectItem>
                <SelectItem value="size" className="text-xs"><div className="flex items-center gap-2"><HardDrive className="h-3 w-3" />Tamanho</div></SelectItem>
                <SelectItem value="type" className="text-xs"><div className="flex items-center gap-2"><FileText className="h-3 w-3" />Tipo</div></SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingFiles} className="h-7 text-xs">
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoadingFiles ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground text-xs">Carregando backups do FTP...</p>
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="text-center py-10">
            <Database className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground text-xs">Nenhum arquivo ou pasta encontrado</p>
            <p className="text-muted-foreground/50 text-[11px] mt-1">Diretório: {currentPath}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs cursor-pointer" onClick={() => handleSortChange('name')}>
                    <div className="flex items-center gap-1">Nome {getSortIcon('name')}</div>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs cursor-pointer" onClick={() => handleSortChange('size')}>
                    <div className="flex items-center gap-1">Tamanho {getSortIcon('size')}</div>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs cursor-pointer" onClick={() => handleSortChange('date')}>
                    <div className="flex items-center gap-1">Modificação {getSortIcon('date')}</div>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">Tempo</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Permissões</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiles.map(file => (
                  <TableRow 
                    key={file.name} 
                    className={`border-border/50 hover:bg-muted/20 ${file.isDirectory ? 'cursor-pointer' : ''}`}
                    onClick={() => file.isDirectory && onFolderClick(file)}
                  >
                    <TableCell className="py-1">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(file.name, file.isDirectory)}
                        {getStatusBadge(file.name, file.isDirectory)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground py-1">{file.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1">
                      {file.size > 0 ? formatFileSize(file.size) : (file.isDirectory ? 'Calculando...' : '0 Bytes')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1">
                      {new Date(file.lastModified).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="py-1">
                      {getTimeLabel(file.lastModified, file.isDirectory)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1">
                      {file.permissions || '-'}
                    </TableCell>
                    <TableCell className="py-1 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {!file.isDirectory && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); onDownload(file.name); }}
                            disabled={downloadFile.isPending} 
                            className="h-6 w-6 p-0"
                          >
                            <Download className="h-2.5 w-2.5" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); onDelete(file.name); }}
                          disabled={deleteFile.isPending} 
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
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
