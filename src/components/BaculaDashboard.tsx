import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useBaculaJobsAll } from '@/hooks/useBaculaAPI';
import { useBaculaJobsData, formatBytes, formatDateTime, getJobStatusBadge } from '@/hooks/useBaculaJobsData';
import { BaculaFilters } from '@/components/bacula/BaculaFilters';
import { BaculaStatusCards } from '@/components/bacula/BaculaStatusCards';
import { BaculaJobsTable } from '@/components/bacula/BaculaJobsTable';

export const BaculaDashboard = () => {
  // Filtros para o dashboard
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('7days');
  const [groupByDate, setGroupByDate] = React.useState(true); // Default agrupado por data

  const {
    data: jobsData,
    isLoading: jobsLoading
  } = useBaculaJobsAll();


  // Usar o hook customizado para processar dados dos jobs
  const {
    allJobs,
    filteredJobs: jobs,
    jobStats,
    pieData,
    clientStats,
    recentJobs
  } = useBaculaJobsData(jobsData, searchTerm, statusFilter, dateFilter);
  if (jobsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 text-slate-400 animate-spin" />
                <p className="text-slate-400">Carregando...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros e botão de análise */}
      <BaculaFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        groupByDate={groupByDate}
        setGroupByDate={setGroupByDate}
        jobsCount={jobs.length}
        allJobs={allJobs}
      />

      {/* Cards de Resumo */}
      <BaculaStatusCards
        jobStats={jobStats}
        pieData={pieData}
        clientStats={clientStats}
        formatBytes={formatBytes}
      />

      {/* Tabela Principal de Jobs - Tela Completa */}
      <BaculaJobsTable
        jobs={jobs}
        recentJobs={recentJobs}
        formatDateTime={formatDateTime}
        formatBytes={formatBytes}
        getJobStatusBadge={getJobStatusBadge}
        groupByDate={groupByDate}
      />
    </div>
  );
};
