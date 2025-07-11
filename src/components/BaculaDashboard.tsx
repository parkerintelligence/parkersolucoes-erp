import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { RefreshCw, Database, HardDrive, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useBaculaJobsRecent, useBaculaStatistics, useBaculaVolumes } from '@/hooks/useBaculaAPI';
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
  const jobs = extractJobs(jobsData);

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

  // Jobs recentes (últimos 10)
  const recentJobs = jobs.slice(0, 10);
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
      {/* Cards de estatísticas no topo */}
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Jobs Status Terminated */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Jobs Status Terminated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 text-xs">jobid</TableHead>
                      <TableHead className="text-slate-300 text-xs">name</TableHead>
                      <TableHead className="text-slate-300 text-xs">jobstatus</TableHead>
                      <TableHead className="text-slate-300 text-xs">starttime</TableHead>
                      <TableHead className="text-slate-300 text-xs">endtime</TableHead>
                      <TableHead className="text-slate-300 text-xs">level</TableHead>
                      <TableHead className="text-slate-300 text-xs">jobfiles</TableHead>
                      <TableHead className="text-slate-300 text-xs">jobbytes</TableHead>
                      <TableHead className="text-slate-300 text-xs">name</TableHead>
                      <TableHead className="text-slate-300 text-xs">size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentJobs.map((job: any, index: number) => <TableRow key={job.jobid || index} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-slate-300 text-xs font-mono">{job.jobid || '-'}</TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-32 truncate">{job.name || job.jobname || '-'}</TableCell>
                        <TableCell className="text-xs">
                          {getJobStatusBadge(job.jobstatus)}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs font-mono">
                          {job.starttime ? formatDateTime(job.starttime).split(' ')[0] + ' ' + formatDateTime(job.starttime).split(' ')[1] : '-'}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs font-mono">
                          {job.endtime ? formatDateTime(job.endtime).split(' ')[0] + ' ' + formatDateTime(job.endtime).split(' ')[1] : '-'}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">
                          <Badge className="bg-orange-900/20 text-orange-400 border-orange-600 text-xs">
                            {job.level === 'I' ? 'incremental' : job.level === 'F' ? 'completo' : job.level || 'incremental'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">{job.jobfiles || '-'}</TableCell>
                        <TableCell className="text-slate-300 text-xs">{job.jobbytes ? formatBytes(parseInt(job.jobbytes)) : '-'}</TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-32 truncate">{job.client || job.clientname || '-'}</TableCell>
                        <TableCell className="text-slate-300 text-xs">{job.jobbytes ? formatBytes(parseInt(job.jobbytes)) : '-'}</TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral com estatísticas */}
        <div className="space-y-6">
          {/* Gráfico de Pizza */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Jobs Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={60} innerRadius={20}>
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
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Value</span>
                  <span className="text-slate-400">Percent</span>
                </div>
                {pieData.map((item, index) => <div key={index} className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{
                    backgroundColor: item.color
                  }} />
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <div className="text-slate-300">
                      <span>{item.value}</span>
                      <span className="ml-2">
                        {jobStats.totalJobs > 0 ? Math.round(item.value / jobStats.totalJobs * 100) : 0}%
                      </span>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Ativos */}
          <Card className="bg-purple-900/20 border-purple-600/30">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">0</div>
              <div className="text-sm text-purple-300">Jobs Ativos</div>
              <div className="text-xs text-purple-400 mt-1">Last bacula ProGra User</div>
            </CardContent>
          </Card>

          {/* All Volumes Size */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-purple-900/20 border-purple-600/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">247</div>
                <div className="text-xs text-purple-300">GB</div>
                <div className="text-xs text-purple-400 mt-1">Tamanho Total - Armaze...</div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-900/20 border-orange-600/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-1">886</div>
                <div className="text-xs text-orange-300">GB</div>
                <div className="text-xs text-orange-400 mt-1">All Volumes Size</div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs Status Terminated - Tamanho em GB */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Jobs Status Terminated - Tamanho em GB</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {clientStats.slice(0, 8).map((client: any, index) => <div key={index} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{
                    backgroundColor: index % 2 === 0 ? '#22c55e' : '#3b82f6'
                  }} />
                      <span className="text-slate-300 truncate max-w-24">
                        {client.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-300 font-mono">
                      {formatBytes(client.bytes)}
                    </div>
                    <div className="text-slate-400">
                      avg
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Status Terminated */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Jobs Status Terminated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientStats.slice(0, 4).map((client: any, index) => <div key={index} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">{client.name}</span>
                    <span className="text-slate-300">{formatBytes(client.avgSize)}</span>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};