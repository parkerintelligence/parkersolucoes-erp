import React from 'react';
import { Badge } from '@/components/ui/badge';

// Hook para extrair e processar dados dos jobs
export const useBaculaJobsData = (jobsData: any, searchTerm: string, statusFilter: string, dateFilter: string) => {
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

  // Filtrar jobs
  const filteredJobs = React.useMemo(() => {
    let filtered = allJobs;

    console.log('=== DEBUG BACULA FILTERS ===');
    console.log('Total jobs before filtering:', filtered.length);
    console.log('Current filters:', { searchTerm, statusFilter, dateFilter });
    console.log('Sample jobs:', filtered.slice(0, 3).map(job => ({
      jobid: job.jobid,
      name: job.name,
      jobstatus: job.jobstatus,
      starttime: job.starttime,
      level: job.level
    })));

    // Filtro por data
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
      if (!job.starttime && !job.schedtime) return dateFilter === 'all';
      const jobDate = new Date(job.starttime || job.schedtime);
      return jobDate >= cutoffDate;
    });

    console.log(`Jobs after date filter (${dateFilter}):`, filtered.length);

    // Filtro por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        (job.name || job.jobname || '').toLowerCase().includes(searchLower) || 
        (job.client || job.clientname || '').toLowerCase().includes(searchLower)
      );
      console.log(`Jobs after search filter (${searchTerm}):`, filtered.length);
    }

    // Filtro por status
    console.log('Status filter value:', statusFilter);
    console.log('Unique job statuses found:', [...new Set(filtered.map(job => job.jobstatus))]);
    
    if (statusFilter !== 'all') {
      const beforeStatusFilter = filtered.length;
      
      // Handle error status filter (includes both 'E' and 'f')
      if (statusFilter === 'error') {
        filtered = filtered.filter(job => job.jobstatus === 'E' || job.jobstatus === 'f');
      } else {
        filtered = filtered.filter(job => job.jobstatus === statusFilter);
      }
      
      console.log(`Jobs after status filter (${statusFilter}): ${filtered.length} (was ${beforeStatusFilter})`);
    }
    
    // Ordenar por data mais recente primeiro
    filtered.sort((a, b) => {
      const dateA = new Date(a.starttime || a.schedtime || 0);
      const dateB = new Date(b.starttime || b.schedtime || 0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('Final filtered jobs count:', filtered.length);
    console.log('Status distribution:', filtered.reduce((acc: any, job: any) => {
      acc[job.jobstatus] = (acc[job.jobstatus] || 0) + 1;
      return acc;
    }, {}));
    console.log('=== END DEBUG ===');
    
    return filtered;
  }, [allJobs, searchTerm, statusFilter, dateFilter]);

  // Calcular estatísticas dos jobs
  const jobStats = React.useMemo(() => {
    const totalJobs = filteredJobs.length;
    const completedJobs = filteredJobs.filter(job => job.jobstatus === 'T').length;
    const errorJobs = filteredJobs.filter(job => job.jobstatus === 'E' || job.jobstatus === 'f').length;
    const runningJobs = filteredJobs.filter(job => job.jobstatus === 'R').length;
    const totalBytes = filteredJobs.reduce((sum, job) => sum + (parseInt(job.jobbytes) || 0), 0);
    const totalFiles = filteredJobs.reduce((sum, job) => sum + (parseInt(job.jobfiles) || 0), 0);
    
    return {
      totalJobs,
      completedJobs,
      errorJobs,
      runningJobs,
      totalBytes,
      totalFiles
    };
  }, [filteredJobs]);

  // Dados para o gráfico de pizza do status dos jobs
  const pieData = [{
    name: 'Completo - OK',
    value: jobStats.completedJobs,
    color: '#22c55e'
  }, {
    name: 'Incremental',
    value: filteredJobs.filter(job => job.jobstatus === 'W').length,
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
  const jobsByClient = filteredJobs.reduce((acc: any, job: any) => {
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
  
  const clientStats = Object.values(jobsByClient) as Array<{
    name: string;
    jobs: number;
    bytes: number;
    avgSize: number;
  }>;
  clientStats.sort((a, b) => b.bytes - a.bytes);

  // Todos os jobs filtrados (sem limite)
  const recentJobs = filteredJobs;

  return {
    allJobs,
    filteredJobs,
    jobStats,
    pieData,
    clientStats,
    recentJobs
  };
};

// Funções utilitárias
export const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDateTime = (dateTime: string) => {
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

export const getJobStatusBadge = (status: string) => {
  switch (status) {
    case 'T':
      return React.createElement(Badge, { className: "bg-green-900/20 text-green-400 border-green-600 text-xs" }, "Completo - OK");
    case 'W':
      return React.createElement(Badge, { className: "bg-yellow-900/20 text-yellow-400 border-yellow-600 text-xs" }, "Aviso");
    case 'E':
      return React.createElement(Badge, { className: "bg-red-900/20 text-red-400 border-red-600 text-xs" }, "Erro");
    case 'f':
      return React.createElement(Badge, { className: "bg-red-900/20 text-red-400 border-red-600 text-xs" }, "Fatal");
    case 'R':
      return React.createElement(Badge, { className: "bg-blue-900/20 text-blue-400 border-blue-600 text-xs" }, "Executando");
    case 'A':
      return React.createElement(Badge, { className: "bg-gray-900/20 text-gray-400 border-gray-600 text-xs" }, "Cancelado");
    default:
      return React.createElement(Badge, { className: "bg-gray-900/20 text-gray-400 border-gray-600 text-xs" }, status);
  }
};

export const getJobLevelBadge = (level: string) => {
  switch (level) {
    case 'F':
      return React.createElement(Badge, { className: "bg-blue-900/20 text-blue-400 border-blue-600 text-xs" }, "Completo");
    case 'I':
      return React.createElement(Badge, { className: "bg-orange-900/20 text-orange-400 border-orange-600 text-xs" }, "Incremental");
    case 'D':
      return React.createElement(Badge, { className: "bg-purple-900/20 text-purple-400 border-purple-600 text-xs" }, "Diferencial");
    default:
      return React.createElement(Badge, { className: "bg-gray-900/20 text-gray-400 border-gray-600 text-xs" }, level || "N/A");
  }
};