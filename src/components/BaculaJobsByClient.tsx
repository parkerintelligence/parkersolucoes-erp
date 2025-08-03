import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { useBaculaJobsRecent } from '@/hooks/useBaculaAPI';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from '@/hooks/use-toast';

interface BaculaJobsByClientProps {
  filteredJobs?: any[];
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  clientFilter?: string;
}

export const BaculaJobsByClient: React.FC<BaculaJobsByClientProps> = ({ 
  filteredJobs, 
  startDate, 
  endDate, 
  statusFilter, 
  clientFilter 
}) => {
  const { data: jobsData, isLoading, error, refetch } = useBaculaJobsRecent();
  const { createTicket } = useGLPIExpanded();

  console.log('Jobs raw data:', jobsData);
  console.log('Jobs loading:', isLoading);
  console.log('Jobs error:', error);

  // Extrair jobs da resposta, considerando diferentes estruturas do Baculum
  const extractJobs = (data: any) => {
    if (!data) return [];
    
    // Verificar diferentes estruturas de resposta do Baculum
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

  // Se temos jobs filtrados das abas, usar eles diretamente
  // Caso contrário, usar os jobs brutos e aplicar os filtros
  const jobs = filteredJobs || extractJobs(jobsData);

  console.log('Filtered jobs:', jobs);

  // Agrupar jobs por cliente
  const jobsByClient = jobs.reduce((acc: any, job: any) => {
    const client = job.client || job.clientname || job.clientid || 'Cliente Desconhecido';
    if (!acc[client]) {
      acc[client] = [];
    }
    acc[client].push(job);
    return acc;
  }, {});

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
        return <Badge className="bg-slate-900/20 text-gray-400 border-gray-600">Criado</Badge>;
      case 'c': // Waiting for client
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aguardando Cliente</Badge>;
      default:
        return <Badge className="bg-slate-900/20 text-gray-400 border-gray-600">{status}</Badge>;
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

  // Função para mapear o tipo de backup
  const getBackupTypeBadge = (job: any) => {
    const level = job.level || job.joblevel || job.backuplevel || '';
    const type = job.type || job.jobtype || '';
    
    // Mapear códigos de nível do Bacula
    switch (level) {
      case 'F':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Completo</Badge>;
      case 'I':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Incremental</Badge>;
      case 'D':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Diferencial</Badge>;
      case 'B':
        return <Badge className="bg-purple-900/20 text-purple-400 border-purple-600">Base</Badge>;
      case 'C':
        return <Badge className="bg-orange-900/20 text-orange-400 border-orange-600">Catalog</Badge>;
      case 'V':
        return <Badge className="bg-pink-900/20 text-pink-400 border-pink-600">Verify</Badge>;
      case 'O':
        return <Badge className="bg-indigo-900/20 text-indigo-400 border-indigo-600">VolumeToCatalog</Badge>;
      default:
        // Se não temos level, tentar usar o tipo
        if (type === 'B' || type === 'Backup') {
          return <Badge className="bg-slate-900/20 text-slate-400 border-slate-600">Backup</Badge>;
        } else if (type === 'R' || type === 'Restore') {
          return <Badge className="bg-cyan-900/20 text-cyan-400 border-cyan-600">Restore</Badge>;
        } else if (type === 'V' || type === 'Verify') {
          return <Badge className="bg-pink-900/20 text-pink-400 border-pink-600">Verify</Badge>;
        } else if (type === 'A' || type === 'Admin') {
          return <Badge className="bg-slate-900/20 text-gray-400 border-gray-600">Admin</Badge>;
        }
        return <Badge className="bg-slate-900/20 text-gray-400 border-gray-600">{level || type || 'N/A'}</Badge>;
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

  const handleCreateGLPITicket = async (job: any) => {
    try {
      const ticketData = {
        name: `Falha no Backup - ${job.client || job.clientname || 'Cliente'}`,
        content: `Detalhes do Job de Backup:
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

  if (error) {
    console.error('Jobs grid error:', error);
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

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 text-slate-400 animate-spin" />
            <p className="text-slate-400">Carregando jobs...</p>
          </CardContent>
        </Card>
      ) : Object.keys(jobsByClient).length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-400">Nenhum job encontrado para os filtros selecionados</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(jobsByClient).map(([client, clientJobs]: [string, any]) => (
          <Card key={client} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  <span className="text-sm">{client}</span>
                </span>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {clientJobs.length} jobs
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Job</TableHead>
                      <TableHead className="text-slate-300">Tipo Backup</TableHead>
                      <TableHead className="text-slate-300">Início</TableHead>
                      <TableHead className="text-slate-300">Fim</TableHead>
                      <TableHead className="text-slate-300">Duração</TableHead>
                      <TableHead className="text-slate-300">Bytes</TableHead>
                      <TableHead className="text-slate-300">Files</TableHead>
                      <TableHead className="text-slate-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientJobs.map((job: any, index: number) => (
                      <TableRow key={job.jobid || index} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getJobStatusIcon(job.jobstatus)}
                            {getJobStatusBadge(job.jobstatus)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">
                          {job.name || job.jobname || job.job || '-'}
                        </TableCell>
                        <TableCell>
                          {getBackupTypeBadge(job)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDateTime(job.starttime || job.schedtime || job.realendtime)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDateTime(job.endtime || job.realendtime)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {job.duration ? formatDuration(job.duration) : '-'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {job.jobbytes ? formatBytes(job.jobbytes) : '-'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {job.jobfiles || job.jobfilescount || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateGLPITicket(job)}
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
          </Card>
        ))
      )}
    </div>
  );
};
