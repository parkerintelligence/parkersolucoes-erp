import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useBaculaJobsRecent } from '@/hooks/useBaculaAPI';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPITicketConfirmDialog } from '@/components/GLPITicketConfirmDialog';
import { toast } from '@/hooks/use-toast';

interface BaculaJobsGridProps {
  filteredJobs?: any[];
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  clientFilter?: string;
}

export const BaculaJobsGrid: React.FC<BaculaJobsGridProps> = ({ 
  filteredJobs,
  startDate,
  endDate,
  statusFilter,
  clientFilter
}) => {
  const { data: jobsData, isLoading, error, refetch } = useBaculaJobsRecent();
  const { createTicket } = useGLPIExpanded();
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const allJobs = extractJobs(jobsData);

  // Filtrar jobs pelos últimos 7 dias e outros filtros
  const getFilteredJobs = () => {
    if (filteredJobs) return filteredJobs;

    let filtered = allJobs;

    // Filtro por data (últimos 7 dias por padrão)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Final do dia

      filtered = filtered.filter(job => {
        if (!job.starttime) return true;
        const jobDate = new Date(job.starttime);
        return jobDate >= start && jobDate <= end;
      });
    }

    // Filtro por status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(job => job.jobstatus === statusFilter);
    }

    // Filtro por cliente
    if (clientFilter) {
      const searchLower = clientFilter.toLowerCase();
      filtered = filtered.filter(job => 
        (job.client || job.clientname || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const jobs = getFilteredJobs();

  // Função de ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Aplicar ordenação
  const sortedJobs = [...jobs].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'name':
        aValue = (a.name || a.jobname || '').toLowerCase();
        bValue = (b.name || b.jobname || '').toLowerCase();
        break;
      case 'starttime':
        aValue = new Date(a.starttime || 0).getTime();
        bValue = new Date(b.starttime || 0).getTime();
        break;
      case 'status':
        aValue = a.jobstatus || '';
        bValue = b.jobstatus || '';
        break;
      case 'client':
        aValue = (a.client || a.clientname || '').toLowerCase();
        bValue = (b.client || b.clientname || '').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'T':
        return <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-600">Completo - OK</Badge>;
      case 'W':
        return <Badge className="bg-amber-900/30 text-amber-400 border-amber-600">Incremental</Badge>;
      case 'E':
        return <Badge className="bg-red-900/30 text-red-400 border-red-600">Erro</Badge>;
      case 'f':
        return <Badge className="bg-red-900/30 text-red-400 border-red-600">Fatal</Badge>;
      case 'R':
        return <Badge className="bg-blue-900/30 text-blue-400 border-blue-600">Executando</Badge>;
      case 'C':
        return <Badge className="bg-gray-900/30 text-gray-400 border-gray-600">Criado</Badge>;
      case 'c':
        return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-600">Aguardando</Badge>;
      default:
        return <Badge className="bg-gray-900/30 text-gray-400 border-gray-600">{status}</Badge>;
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'T':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'W':
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
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
        return <Badge className="bg-indigo-900/30 text-indigo-400 border-indigo-600">Completo</Badge>;
      case 'I':
        return <Badge className="bg-teal-900/30 text-teal-400 border-teal-600">Incremental</Badge>;
      case 'D':
        return <Badge className="bg-orange-900/30 text-orange-400 border-orange-600">Diferencial</Badge>;
      default:
        return <Badge className="bg-gray-900/30 text-gray-400 border-gray-600">{level || 'N/A'}</Badge>;
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

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
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

  if (sortedJobs.length === 0) {
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
            {sortedJobs.length} jobs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300 w-16">JobID</TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    JobStatus
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('starttime')}
                >
                  <div className="flex items-center">
                    StartTime
                    {getSortIcon('starttime')}
                  </div>
                </TableHead>
                <TableHead className="text-slate-300">EndTime</TableHead>
                <TableHead className="text-slate-300">Level</TableHead>
                <TableHead className="text-slate-300">JobFiles</TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center">
                    Name
                    {getSortIcon('client')}
                  </div>
                </TableHead>
                <TableHead className="text-slate-300">Size</TableHead>
                <TableHead className="text-slate-300 w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs.map((job: any, index: number) => (
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