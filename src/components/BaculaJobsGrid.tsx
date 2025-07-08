
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Play, Square, Calendar, Clock, Server, FileText, Loader2 } from 'lucide-react';
import { useBaculaAPI, BaculaJob } from '@/hooks/useBaculaAPI';
import { toast } from '@/hooks/use-toast';

export const BaculaJobsGrid = () => {
  const { useJobs, useCancelJob, useRunJob, isEnabled } = useBaculaAPI();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobLimit, setJobLimit] = useState(50);

  const { data: jobs = [], isLoading, error, refetch } = useJobs(jobLimit);
  const cancelJob = useCancelJob();
  const runJob = useRunJob();

  if (!isEnabled) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Server className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold mb-2 text-white">BaculaWeb não configurado</h3>
          <p className="text-slate-400">Configure a integração BaculaWeb no painel administrativo.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' } } = {
      'T': { label: 'Sucesso', variant: 'default' },
      'R': { label: 'Executando', variant: 'secondary' },
      'E': { label: 'Erro', variant: 'destructive' },
      'F': { label: 'Falha', variant: 'destructive' },
      'C': { label: 'Cancelado', variant: 'outline' },
      'A': { label: 'Cancelado pelo usuário', variant: 'outline' },
    };

    const statusInfo = statusMap[status.toUpperCase()] || { label: status, variant: 'outline' as const };
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const filteredJobs = jobs.filter((job: BaculaJob) => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.jobstatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCancelJob = (jobId: number) => {
    if (window.confirm('Tem certeza que deseja cancelar este job?')) {
      cancelJob.mutate(jobId);
    }
  };

  const handleRunJob = (jobName: string) => {
    if (window.confirm(`Tem certeza que deseja executar o job "${jobName}"?`)) {
      runJob.mutate(jobName);
    }
  };

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2 text-white">Erro ao carregar jobs</h3>
          <p className="text-slate-400 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Jobs de Backup
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome do job ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="t">Sucesso</SelectItem>
              <SelectItem value="r">Executando</SelectItem>
              <SelectItem value="e">Erro</SelectItem>
              <SelectItem value="f">Falha</SelectItem>
              <SelectItem value="c">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={jobLimit.toString()} onValueChange={(value) => setJobLimit(Number(value))}>
            <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="25">25 jobs</SelectItem>
              <SelectItem value="50">50 jobs</SelectItem>
              <SelectItem value="100">100 jobs</SelectItem>
              <SelectItem value="200">200 jobs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de Jobs */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2 text-slate-400">Carregando jobs...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p>Nenhum job encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">ID</TableHead>
                  <TableHead className="text-slate-300">Nome</TableHead>
                  <TableHead className="text-slate-300">Cliente</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Início</TableHead>
                  <TableHead className="text-slate-300">Fim</TableHead>
                  <TableHead className="text-slate-300">Arquivos</TableHead>
                  <TableHead className="text-slate-300">Tamanho</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job: BaculaJob) => (
                  <TableRow key={job.jobid} className="border-slate-700 hover:bg-slate-800/30">
                    <TableCell className="font-medium text-slate-200">{job.jobid}</TableCell>
                    <TableCell className="text-slate-200">{job.name}</TableCell>
                    <TableCell className="text-slate-300">{job.client}</TableCell>
                    <TableCell>{getStatusBadge(job.jobstatus)}</TableCell>
                    <TableCell className="text-slate-300">{formatDateTime(job.starttime || '')}</TableCell>
                    <TableCell className="text-slate-300">{formatDateTime(job.endtime || '')}</TableCell>
                    <TableCell className="text-slate-300">{job.jobfiles.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-300">{formatBytes(job.jobbytes)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {job.jobstatus.toLowerCase() === 'r' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelJob(job.jobid)}
                            className="border-red-600 text-red-400 hover:bg-red-900/20"
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        )}
                        {job.jobstatus.toLowerCase() !== 'r' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunJob(job.name)}
                            className="border-green-600 text-green-400 hover:bg-green-900/20"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
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
