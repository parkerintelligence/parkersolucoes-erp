
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
import { useBackups, useCreateBackup, useDeleteBackup } from '@/hooks/useBackups';
import { toast } from '@/hooks/use-toast';

const Backups = () => {
  const { data: backups = [], isLoading, refetch } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'database',
    frequency: 'daily',
    company_id: '',
    retention_days: 30
  });

  const handleCreateBackup = () => {
    if (!formData.name || !formData.type) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e tipo do backup.",
        variant: "destructive"
      });
      return;
    }

    createBackup.mutate(formData);
    setFormData({ name: '', type: 'database', frequency: 'daily', company_id: '', retention_days: 30 });
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Concluído</Badge>;
      case 'failed':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Falhou</Badge>;
      case 'running':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Executando</Badge>;
      default:
        return <Badge className="bg-gray-700 text-gray-400 border-gray-600">Pendente</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalBackups = backups.length;
  const completedBackups = backups.filter(b => b.status === 'completed').length;
  const failedBackups = backups.filter(b => b.status === 'failed').length;
  const runningBackups = backups.filter(b => b.status === 'running').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Backup
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Configurar Novo Backup</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure um novo backup automático para seus dados.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-gray-200">Nome do Backup *</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Backup Diário Sistema"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-gray-200">Tipo de Backup *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="database" className="text-white hover:bg-gray-600">Banco de Dados</SelectItem>
                      <SelectItem value="files" className="text-white hover:bg-gray-600">Arquivos</SelectItem>
                      <SelectItem value="full" className="text-white hover:bg-gray-600">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="frequency" className="text-gray-200">Frequência</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="hourly" className="text-white hover:bg-gray-600">A cada hora</SelectItem>
                      <SelectItem value="daily" className="text-white hover:bg-gray-600">Diário</SelectItem>
                      <SelectItem value="weekly" className="text-white hover:bg-gray-600">Semanal</SelectItem>
                      <SelectItem value="monthly" className="text-white hover:bg-gray-600">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="retention" className="text-gray-200">Retenção (dias)</Label>
                  <Input 
                    id="retention" 
                    type="number"
                    value={formData.retention_days}
                    onChange={(e) => setFormData({...formData, retention_days: parseInt(e.target.value)})}
                    placeholder="30"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateBackup} className="bg-blue-600 hover:bg-blue-700">
                  Criar Backup
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                  <p className="text-xl md:text-2xl font-bold text-white">{completedBackups}</p>
                  <p className="text-xs md:text-sm text-gray-400">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{failedBackups}</p>
                  <p className="text-xs md:text-sm text-gray-400">Falharam</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{runningBackups}</p>
                  <p className="text-xs md:text-sm text-gray-400">Em Execução</p>
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
                  Histórico de Backups
                </CardTitle>
                <CardDescription className="text-gray-400">Lista de todos os backups realizados</CardDescription>
              </div>
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400">Carregando backups...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum backup configurado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Nome</TableHead>
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="text-gray-300">Tamanho</TableHead>
                      <TableHead className="text-gray-300">Data</TableHead>
                      <TableHead className="text-gray-300">Progresso</TableHead>
                      <TableHead className="text-right text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(backup.status)}
                            {getStatusBadge(backup.status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-200">{backup.name}</TableCell>
                        <TableCell className="text-gray-300 capitalize">{backup.type}</TableCell>
                        <TableCell className="text-gray-300">
                          {backup.file_size ? formatFileSize(backup.file_size) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {backup.created_at ? new Date(backup.created_at).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          {backup.status === 'running' && backup.progress ? (
                            <div className="space-y-1">
                              <Progress value={backup.progress} className="h-2" />
                              <p className="text-xs text-gray-400">{backup.progress}%</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {backup.status === 'completed' && (
                              <Button variant="outline" size="sm" className="border-gray-600 text-gray-200 hover:bg-gray-700">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-600 text-red-400 hover:bg-red-900/30"
                              onClick={() => deleteBackup.mutate(backup.id)}
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
