import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBaculaJobsAll } from '@/hooks/useBaculaAPI';
import { useBaculaJobsData, formatBytes, formatDateTime, getJobStatusBadge } from '@/hooks/useBaculaJobsData';
import { BaculaFilters } from '@/components/bacula/BaculaFilters';
import { BaculaStatusCards } from '@/components/bacula/BaculaStatusCards';
import { BaculaJobsTable } from '@/components/bacula/BaculaJobsTable';

export const BaculaDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');
  const [groupByDate, setGroupByDate] = useState(true);

  const { data: jobsData, isLoading: jobsLoading } = useBaculaJobsAll();
  const { allJobs, filteredJobs: jobs, jobStats, pieData, clientStats, recentJobs } = useBaculaJobsData(jobsData, searchTerm, statusFilter, dateFilter);

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">Carregando jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <BaculaStatusCards
        jobStats={jobStats}
        pieData={pieData}
        clientStats={clientStats}
        formatBytes={formatBytes}
      />

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
