import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { useBaculaJobsRecent } from '@/hooks/useBaculaAPI';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPITicketConfirmDialog } from '@/components/GLPITicketConfirmDialog';
import { toast } from '@/hooks/use-toast';

interface BaculaJobsGridProps {
  filteredJobs?: any[];
}

export const BaculaJobsGrid: React.FC<BaculaJobsGridProps> = ({ 
  filteredJobs
}) => {
  const { data: jobsData, isLoading, error, refetch } = useBaculaJobsRecent();
  const { createTicket } = useGLPIExpanded();
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Extrair jobs da resposta
  const extractJobs = (data: any) => {
    if (!data) return [];
    
    if (data.output && Array.isArray(data.output)) {
      return data.output;
    }
    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  };

  const jobs = filteredJobs || extractJobs(jobsData);

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'T':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Completo - OK</Badge>;
      case 'W':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Incremental</Badge>;
      case 'E':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Erro</Badge>;
      case 'f':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Fatal</Badge>;
      case 'R':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Executando</Badge>;
      case 'C':
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">Criado</Badge>;
      case 'c':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aguardando</Badge>;
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

  const getBackupTypeBadge = (job: any) => {
    const level = job.level || job.joblevel || job.backuplevel || '';
    
    switch (level) {
      case 'F':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Completo</Badge>;
      case 'I':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Incremental</Badge>;
      case 'D':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Diferencial</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">{level || 'N/A'}</Badge>;
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

  const openConfirmDialog = (job: any) => {
    setSelectedJob(job);
    setConfirmDialogOpen(true);
  };

  const handleCreateGLPITicket = async (job: any) => {
    try {
      const ticketData = {
        name: `Falha no Backup - ${job.client || job.clientname || 'Cliente'}`,
        content: `Detalhes do Job de Backup:
- JobID: ${job.jobid || 'N/A'}
- Nome: ${job.name || job.jobname || job.job || 'N/A'}
- Cliente: ${job.client || job.clientname || job.clientid || 'N/A'}
- Status: ${job.jobstatus || 'N/A'}
- Tipo: ${job.type || job.jobtype || job.level || 'N/A'}
- Início: ${formatDateTime(job.starttime || job.schedtime)}
- Fim: ${formatDateTime(job.endtime || job.realendtime)}
- Duração: ${job.duration ? formatDuration(job.duration) : 'N/A'}
- Bytes: ${job.jobbytes ? formatBytes(job.jobbytes) : 'N/A'}
- Arquivos: ${job.jobfiles || job.jobfilescount || 'N/A'}

Necessário investigar o motivo da falha no backup.`,
        urgency: 3,
        impact: 3,
        priority: 3,
        status: 1,
        type: 1,
      };

      await createTicket.mutateAsync(ticketData);
      toast({
        title: "✅ Chamado GLPI criado!",
        description: "O chamado foi criado com sucesso no GLPI.",
      });
    } catch (error) {
      console.error('Erro ao criar chamado GLPI:', error);
      toast({
        title: "❌ Erro ao criar chamado",
        description: "Não foi possível criar o chamado no GLPI. Verifique a configuração.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmGLPITicket = () => {
    if (selectedJob) {
      handleCreateGLPITicket(selectedJob);
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
          <Button onClick={() => refetch()} className="bg-blue-800 hover:bg-blue-700 text-white">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 text-slate-400 animate-spin" />
          <p className="text-slate-400">Carregando jobs...</p>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-400">Nenhum job encontrado para os filtros selecionados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Jobs Status Terminated
          </span>
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            {jobs.length} jobs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300 w-16">JobID</TableHead>
                <TableHead className="text-slate-300">Name</TableHead>
                <TableHead className="text-slate-300">JobStatus</TableHead>
                <TableHead className="text-slate-300">StartTime</TableHead>
                <TableHead className="text-slate-300">EndTime</TableHead>
                <TableHead className="text-slate-300">Level</TableHead>
                <TableHead className="text-slate-300">JobFiles</TableHead>
                <TableHead className="text-slate-300">Name</TableHead>
                <TableHead className="text-slate-300">Size</TableHead>
                <TableHead className="text-slate-300 w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: any, index: number) => (
                <TableRow key={job.jobid || index} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell className="text-slate-300 font-mono text-sm">
                    {job.jobid || '-'}
                  </TableCell>
                  <TableCell className="font-medium text-slate-200">
                    {job.name || job.jobname || job.job || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getJobStatusIcon(job.jobstatus)}
                      {getJobStatusBadge(job.jobstatus)}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono text-sm">
                    {formatDateTime(job.starttime || job.schedtime)}
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono text-sm">
                    {formatDateTime(job.endtime || job.realendtime)}
                  </TableCell>
                  <TableCell>
                    {getBackupTypeBadge(job)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {job.jobfiles || job.jobfilescount || '-'}
                  </TableCell>
                  <TableCell className="text-slate-300 max-w-48 truncate">
                    {job.client || job.clientname || job.clientid || '-'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {job.jobbytes ? formatBytes(job.jobbytes) : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openConfirmDialog(job)}
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      disabled={createTicket.isPending}
                      title="Criar chamado no GLPI"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <GLPITicketConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmGLPITicket}
        description="Deseja abrir um chamado GLPI para este job do Bacula?"
      />
    </Card>
  );
};