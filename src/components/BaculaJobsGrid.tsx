
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useBaculaJobsRecent } from '@/hooks/useBaculaAPI';
import { Button } from '@/components/ui/button';

export const BaculaJobsGrid = () => {
  const { data: jobs, isLoading, error, refetch } = useBaculaJobsRecent();

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'T': // Terminated normally
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Sucesso</Badge>;
      case 'W': // Terminated normally with warnings
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aviso</Badge>;
      case 'E': // Terminated in error
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Erro</Badge>;
      case 'f': // Fatal error
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Fatal</Badge>;
      case 'R': // Running
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Executando</Badge>;
      case 'C': // Created but not yet running
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">Criado</Badge>;
      case 'c': // Waiting for client
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aguardando Cliente</Badge>;
      case 'd': // Waiting for maximum jobs
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aguardando Recursos</Badge>;
      case 't': // Waiting for start time
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aguardando Horário</Badge>;
      case 'p': // Waiting for higher priority jobs
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aguardando Prioridade</Badge>;
      case 'i': // Doing batch insert file records
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Inserindo Registros</Badge>;
      case 'a': // SD despooling attributes
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Processando Atributos</Badge>;
      case 'l': // Doing data despooling
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Processando Dados</Badge>;
      case 'L': // Committing data
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Commitando Dados</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">{status}</Badge>;
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'T':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'W':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'E':
      case 'f':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'R':
        return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '-';
    try {
      return new Date(dateTime).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateTime;
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2 text-white">Erro ao carregar jobs</h3>
          <p className="text-slate-400 mb-4">
            {error.message || 'Não foi possível conectar ao BaculaWeb'}
          </p>
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
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            Jobs Recentes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-slate-600 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 text-slate-400 animate-spin" />
            <p className="text-slate-400">Carregando jobs...</p>
          </div>
        ) : !jobs || (Array.isArray(jobs) && jobs.length === 0) ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-400">Nenhum job encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Job</TableHead>
                  <TableHead className="text-slate-300">Cliente</TableHead>
                  <TableHead className="text-slate-300">Tipo</TableHead>
                  <TableHead className="text-slate-300">Início</TableHead>
                  <TableHead className="text-slate-300">Fim</TableHead>
                  <TableHead className="text-slate-300">Duração</TableHead>
                  <TableHead className="text-slate-300">Bytes</TableHead>
                  <TableHead className="text-slate-300">Files</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(jobs) && jobs.map((job: any, index: number) => (
                  <TableRow key={job.jobid || index} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getJobStatusIcon(job.jobstatus)}
                        {getJobStatusBadge(job.jobstatus)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">
                      {job.name || job.jobname || '-'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {job.client || job.clientname || '-'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {job.type || job.jobtype || '-'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDateTime(job.starttime || job.schedtime)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDateTime(job.endtime)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {job.duration ? formatDuration(job.duration) : '-'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {job.jobbytes ? formatBytes(job.jobbytes) : '-'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {job.jobfiles || '-'}
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
