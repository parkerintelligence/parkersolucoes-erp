import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { RefreshCw, Database, HardDrive, Clock, CheckCircle, AlertCircle, XCircle, Search, Filter } from 'lucide-react';
import { useBaculaJobsRecent, useBaculaStatistics, useBaculaVolumes } from '@/hooks/useBaculaAPI';
import { BaculaAnalysisDialog } from '@/components/BaculaAnalysisDialog';

export const BaculaDashboard = () => {
  const {
    data: jobsData,
    isLoading: jobsLoading
  } = useBaculaJobsRecent();
  const {
    data: statsData,
    isLoading: statsLoading
  } = useBaculaStatistics();
  const {
    data: volumesData,
    isLoading: volumesLoading
  } = useBaculaVolumes();

  // Filtros para o dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');

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

  // Filtrar jobs (últimos 7 dias por padrão)
  const filteredJobs = React.useMemo(() => {
    let filtered = allJobs;

    // Filtro por data (últimos 7 dias por padrão)
    const now = new Date();
    let cutoffDate = new Date();
    switch (dateFilter) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        cutoffDate = new Date(0);
        break;
    }
    filtered = filtered.filter(job => {
      if (!job.starttime) return true;
      const jobDate = new Date(job.starttime);
      return jobDate >= cutoffDate;
    });

    // Filtro por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => (job.name || job.jobname || '').toLowerCase().includes(searchLower) || (job.client || job.clientname || '').toLowerCase().includes(searchLower));
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.jobstatus === statusFilter);
    }
    return filtered;
  }, [allJobs, searchTerm, statusFilter, dateFilter]);
  const jobs = filteredJobs;

  // Calcular estatísticas dos jobs
  const jobStats = React.useMemo(() => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.jobstatus === 'T').length;
    const errorJobs = jobs.filter(job => job.jobstatus === 'E' || job.jobstatus === 'f').length;
    const runningJobs = jobs.filter(job => job.jobstatus === 'R').length;
    const totalBytes = jobs.reduce((sum, job) => sum + (parseInt(job.jobbytes) || 0), 0);
    const totalFiles = jobs.reduce((sum, job) => sum + (parseInt(job.jobfiles) || 0), 0);
    return {
      totalJobs,
      completedJobs,
      errorJobs,
      runningJobs,
      totalBytes,
      totalFiles
    };
  }, [jobs]);

  // Dados para o gráfico de pizza do status dos jobs
  const pieData = [{
    name: 'Completo - OK',
    value: jobStats.completedJobs,
    color: '#22c55e'
  }, {
    name: 'Incremental',
    value: jobs.filter(job => job.jobstatus === 'W').length,
    color: '#f59e0b'
  }, {
    name: 'Erro',
    value: jobStats.errorJobs,
    color: '#ef4444'
  }, {
    name: 'Executando',
    value: jobStats.runningJobs,
    color: '#3b82f6'
  }].filter(item => item.value > 0);

  // Agrupar jobs por cliente para estatísticas
  const jobsByClient = jobs.reduce((acc: any, job: any) => {
    const client = job.client || job.clientname || 'Cliente Desconhecido';
    if (!acc[client]) {
      acc[client] = {
        name: client,
        jobs: 0,
        bytes: 0,
        avgSize: 0
      };
    }
    acc[client].jobs += 1;
    acc[client].bytes += parseInt(job.jobbytes) || 0;
    return acc;
  }, {});

  // Calcular média de tamanho por cliente
  Object.values(jobsByClient).forEach((client: any) => {
    client.avgSize = client.jobs > 0 ? client.bytes / client.jobs : 0;
  });
  const clientStats = Object.values(jobsByClient).sort((a: any, b: any) => b.bytes - a.bytes);
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'T':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Completo</Badge>;
      case 'W':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Incremental</Badge>;
      case 'E':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Erro</Badge>;
      case 'f':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Fatal</Badge>;
      case 'R':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Executando</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">{status}</Badge>;
    }
  };

  // Jobs recentes (primeiros 20 do filtro)
  const recentJobs = jobs.slice(0, 20);
  if (jobsLoading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 text-slate-400 animate-spin" />
                <p className="text-slate-400">Carregando...</p>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }

  return <div className="space-y-6">
      {/* Header com filtros e botão de análise */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Dashboard - Jobs Status Terminated</h2>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar jobs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-40 h-8 bg-slate-700 border-slate-600 text-white placeholder-slate-400" />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="T" className="text-white">Completo</SelectItem>
              <SelectItem value="E" className="text-white">Erro</SelectItem>
              <SelectItem value="R" className="text-white">Executando</SelectItem>
              <SelectItem value="W" className="text-white">Incremental</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7days" className="text-white">7 dias</SelectItem>
              <SelectItem value="30days" className="text-white">30 dias</SelectItem>
              <SelectItem value="all" className="text-white">Todos</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="h-4 w-4" />
            <span>{jobs.length} jobs</span>
          </div>
          
          <BaculaAnalysisDialog jobs={allJobs} />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {/* Jobs Ativos */}
        <Card className="bg-purple-900/20 border-purple-600/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">0</div>
            <div className="text-sm text-purple-300 font-medium">Jobs Ativos</div>
            <div className="text-xs text-purple-400 mt-1">Executando agora</div>
          </CardContent>
        </Card>

        {/* All Volumes Size */}
        <Card className="bg-purple-900/20 border-purple-600/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">247</div>
            <div className="text-sm text-purple-300 font-medium">GB Total</div>
            <div className="text-xs text-purple-400 mt-1">Armazenamento</div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Status dos Jobs */}
        <Card className="bg-slate-800 border-slate-700 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Status dos Jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-24 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={30} innerRadius={15}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {pieData.map((item, index) => <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{backgroundColor: item.color}} />
                    <span className="text-slate-300 truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-300">{item.value}</span>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Jobs por Cliente - Resumo */}
        <Card className="bg-slate-800 border-slate-700 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Top Clientes por Tamanho</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {clientStats.slice(0, 4).map((client: any, index) => <div key={index} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{backgroundColor: index % 2 === 0 ? '#22c55e' : '#3b82f6'}} />
                    <span className="text-slate-300 truncate max-w-16">{client.name.toUpperCase()}</span>
                  </div>
                  <div className="text-slate-300 font-mono">{formatBytes(client.bytes)}</div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal de Jobs - Tela Completa */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Jobs Status Terminated
            </span>
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {jobs.length} jobs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300 text-sm">JobID</TableHead>
                  <TableHead className="text-slate-300 text-sm">Name</TableHead>
                  <TableHead className="text-slate-300 text-sm">JobStatus</TableHead>
                  <TableHead className="text-slate-300 text-sm">StartTime</TableHead>
                  <TableHead className="text-slate-300 text-sm">EndTime</TableHead>
                  <TableHead className="text-slate-300 text-sm">Level</TableHead>
                  <TableHead className="text-slate-300 text-sm">JobFiles</TableHead>
                  <TableHead className="text-slate-300 text-sm">Client</TableHead>
                  <TableHead className="text-slate-300 text-sm">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job: any, index: number) => <TableRow key={job.jobid || index} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-slate-300 font-mono">{job.jobid || '-'}</TableCell>
                    <TableCell className="text-slate-300 max-w-48 truncate font-medium">{job.name || job.jobname || '-'}</TableCell>
                    <TableCell>
                      {getJobStatusBadge(job.jobstatus)}
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono">
                      {job.starttime ? formatDateTime(job.starttime).split(' ')[0] + ' ' + formatDateTime(job.starttime).split(' ')[1] : '-'}
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono">
                      {job.endtime ? formatDateTime(job.endtime).split(' ')[0] + ' ' + formatDateTime(job.endtime).split(' ')[1] : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-900/20 text-orange-400 border-orange-600">
                        {job.level === 'I' ? 'incremental' : job.level === 'F' ? 'completo' : job.level || 'incremental'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{job.jobfiles || '-'}</TableCell>
                    <TableCell className="text-slate-300 max-w-32 truncate">{job.client || job.clientname || '-'}</TableCell>
                    <TableCell className="text-slate-300">{job.jobbytes ? formatBytes(parseInt(job.jobbytes)) : '-'}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>;
};
