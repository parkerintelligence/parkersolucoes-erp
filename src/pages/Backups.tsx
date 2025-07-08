
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Plus, Download, Trash2, RefreshCw, Calendar, Database, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRealFtp } from '@/hooks/useRealFtp';
import { toast } from '@/hooks/use-toast';

const Backups = () => {
  const { 
    files: ftpFiles = [], 
    isLoadingFiles, 
    ftpIntegration, 
    downloadFile, 
    uploadFile, 
    deleteFile, 
    refetchFiles,
    currentPath,
    navigateToDirectory,
    goToParentDirectory,
    directories
  } = useRealFtp();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  // Filtrar apenas arquivos de backup (não diretórios)
  const backupFiles = ftpFiles.filter(file => 
    !file.isDirectory && 
    (file.name.includes('backup') || 
     file.name.includes('.sql') || 
     file.name.includes('.tar') || 
     file.name.includes('.zip') ||
     file.name.includes('.gz'))
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(file);
    try {
      await uploadFile.mutateAsync(file);
      toast({
        title: "✅ Upload Concluído",
        description: `${file.name} foi enviado para o servidor FTP.`,
      });
    } catch (error) {
      toast({
        title: "❌ Falha no Upload",
        description: "Erro ao enviar arquivo para o servidor FTP.",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(null);
      setIsDialogOpen(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      await downloadFile.mutateAsync(fileName);
    } catch (error) {
      toast({
        title: "❌ Falha no Download",
        description: "Erro ao baixar arquivo do servidor FTP.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${fileName}?`)) return;
    
    try {
      await deleteFile.mutateAsync(fileName);
    } catch (error) {
      toast({
        title: "❌ Falha na Exclusão",
        description: "Erro ao excluir arquivo do servidor FTP.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (fileName: string) => {
    // Simular status baseado no nome do arquivo
    const today = new Date().toISOString().split('T')[0];
    if (fileName.includes(today)) {
      return <Badge className="bg-green-900/20 text-green-400 border-green-600">Atual</Badge>;
    } else if (fileName.includes('error') || fileName.includes('failed')) {
      return <Badge className="bg-red-900/20 text-red-400 border-red-600">Erro</Badge>;
    } else {
      return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Completo</Badge>;
    }
  };

  const getStatusIcon = (fileName: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (fileName.includes(today)) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    } else if (fileName.includes('error') || fileName.includes('failed')) {
      return <XCircle className="h-4 w-4 text-red-400" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-blue-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalBackups = backupFiles.length;
  const recentBackups = backupFiles.filter(file => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(file.lastModified) > weekAgo;
  }).length;

  // Se não há integração FTP configurada
  if (!ftpIntegration) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="space-y-6 p-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma Integração FTP Configurada
                </h3>
                <p className="text-gray-400 mb-4">
                  Configure uma integração FTP na seção de Administração para visualizar os backups.
                </p>
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Configurar FTP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Backups - {ftpIntegration.name}</h1>
            <p className="text-gray-400">Servidor: {ftpIntegration.base_url}</p>
            <p className="text-gray-400">Diretório: {currentPath}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Upload de Backup</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Selecione um arquivo de backup para enviar ao servidor FTP.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="backup-file" className="text-gray-200">Arquivo de Backup</Label>
                    <Input 
                      id="backup-file" 
                      type="file"
                      accept=".sql,.zip,.tar,.gz,.tar.gz"
                      onChange={handleFileUpload}
                      disabled={uploadFile.isPending}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  {uploadingFile && (
                    <div className="text-sm text-gray-400">
                      Enviando: {uploadingFile.name}...
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            {currentPath !== '/' && (
              <Button 
                variant="outline" 
                onClick={goToParentDirectory}
                className="border-gray-600 text-gray-200 hover:bg-gray-700"
              >
                ← Voltar
              </Button>
            )}
          </div>
        </div>

        {/* Navegação de Diretórios */}
        {directories.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Diretórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {directories.map((dir) => (
                  <Button
                    key={dir.name}
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToDirectory(dir.path)}
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    📁 {dir.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Database className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{totalBackups}</p>
                  <p className="text-xs md:text-sm text-gray-400">Total de Backups</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{recentBackups}</p>
                  <p className="text-xs md:text-sm text-gray-400">Recentes (7 dias)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <HardDrive className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {formatFileSize(backupFiles.reduce((total, file) => total + file.size, 0))}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">Tamanho Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {ftpFiles.length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">Total de Arquivos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backups Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Arquivos de Backup
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Arquivos de backup disponíveis no servidor FTP
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetchFiles()} 
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
            ) : backupFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum arquivo de backup encontrado</p>
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
                      <TableHead className="text-gray-300">Permissões</TableHead>
                      <TableHead className="text-right text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupFiles.map((file) => (
                      <TableRow key={file.name} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(file.name)}
                            {getStatusBadge(file.name)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-200">{file.name}</TableCell>
                        <TableCell className="text-gray-300">
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(file.lastModified).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {file.permissions || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownload(file.name)}
                              disabled={downloadFile.isPending}
                              className="border-gray-600 text-gray-200 hover:bg-gray-700"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(file.name)}
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
      </div>
    </div>
  );
};

export default Backups;
