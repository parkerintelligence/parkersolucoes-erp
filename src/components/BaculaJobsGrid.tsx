
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, XCircle, Play, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useBaculaAPI, BaculaJob } from '@/hooks/useBaculaAPI';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const BaculaJobsGrid = () => {
  const { useJobs, useCancelJob, useRunJob, isEnabled } = useBaculaAPI();
  const { data: jobs, isLoading, error, refetch } = useJobs();
  const cancelJobMutation = useCancelJob();
  const runJobMutation = useRunJob();

  const getJobStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 't': // Terminated normally
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'r': // Running
        return <Clock className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'e': // Error
      case 'f': // Fatal error
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'a': // Canceled by user
        return <XCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getJobStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 't': return 'Concluído';
      case 'r': return 'Executando';
      case 'e': return 'Erro';
      case 'f': return 'Erro Fatal';
      case 'a': return 'Cancelado';
      case 'w': return 'Aguardando';
      case 'c': return 'Criado';
      default: return status;
    }
  };

  const getJobStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 't': return 'default';
      case 'r': return 'secondary';
      case 'e':
      case 'f': return 'destructive';
      case 'a': return 'outline';
      default: return 'secondary';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return '-';
    if (!endTime) return 'Em execução';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (!isEnabled) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold mb-2 text-white">BaculaWeb não configurado</h3>
          <p className="text-slate-400">
            Configure a integração com BaculaWeb no painel administrativo para visualizar os jobs de backup.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2 text-white">Erro ao carregar jobs</h3>
          <p className="text-slate-400 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold text-white">Jobs de Backup</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="border-slate-600 text-slate-200 hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2 text-slate-400">Carregando jobs...</span>
          </div>
        ) : (
          <div className="rounded-md border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-750">
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Job</TableHead>
                  <TableHead className="text-slate-300">Cliente</TableHead>
                  <TableHead className="text-slate-300">Tipo</TableHead>
                  <TableHead className="text-slate-300">Nível</TableHead>
                  <TableHead className="text-slate-300">Arquivos</TableHead>
                  <TableHead className="text-slate-300">Bytes</TableHead>
                  <TableHead className="text-slate-300">Duração</TableHead>
                  <TableHead className="text-slate-300">Início</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs?.map((job: BaculaJob) => (
                  <TableRow key={job.jobid} className="border-slate-700 hover:bg-slate-750">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getJobStatusIcon(job.jobstatus)}
                        <Badge variant={getJobStatusVariant(job.jobstatus)}>
                          {getJobStatusText(job.jobstatus)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{job.name}</span>
                        <span className="text-sm text-slate-400">ID: {job.jobid}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-200">{job.client}</TableCell>
                    <TableCell className="text-slate-200">{job.type}</TableCell>
                    <TableCell className="text-slate-200">{job.level}</TableCell>
                    <TableCell className="text-slate-200">{job.jobfiles.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-200">{formatBytes(job.jobbytes)}</TableCell>
                    <TableCell className="text-slate-200">
                      {formatDuration(job.starttime, job.endtime)}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {job.starttime ? 
                        formatDistanceToNow(new Date(job.starttime), { 
                          addSuffix: true, 
                          locale: ptBR 
                        }) : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {job.jobstatus.toLowerCase() === 'r' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelJobMutation.mutate(job.jobid)}
                            disabled={cancelJobMutation.isPending}
                            className="border-red-600 text-red-400 hover:bg-red-900/20"
                          >
                            <XCircle className="h-3 w-3" />
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
