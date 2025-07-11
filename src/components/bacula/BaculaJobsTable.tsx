import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Filter, Tag, User, Calendar, HardDrive, FileText } from 'lucide-react';
import { getJobLevelBadge } from '@/hooks/useBaculaJobsData';

interface BaculaJobsTableProps {
  jobs: any[];
  recentJobs: any[];
  formatDateTime: (dateTime: string) => string;
  formatBytes: (bytes: number) => string;
  getJobStatusBadge: (status: string) => React.ReactNode;
  groupByDate?: boolean;
}

export const BaculaJobsTable: React.FC<BaculaJobsTableProps> = ({
  jobs,
  recentJobs,
  formatDateTime,
  formatBytes,
  getJobStatusBadge,
  groupByDate = false
}) => {
  // Agrupar jobs por data se solicitado
  const groupedJobs = React.useMemo(() => {
    if (!groupByDate) {
      return { 'Todos os Jobs': jobs };
    }

    const groups: { [key: string]: any[] } = {};
    
    jobs.forEach(job => {
      const jobDate = job.starttime || job.schedtime;
      if (jobDate) {
        const date = new Date(jobDate);
        const dateKey = date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(job);
      } else {
        if (!groups['Data Desconhecida']) {
          groups['Data Desconhecida'] = [];
        }
        groups['Data Desconhecida'].push(job);
      }
    });

    // Ordenar grupos por data (mais recente primeiro)
    const sortedGroups: { [key: string]: any[] } = {};
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Data Desconhecida') return 1;
      if (b === 'Data Desconhecida') return -1;
      
      // Pegar o primeiro job de cada grupo para comparar datas
      const dateA = new Date(groups[a][0]?.starttime || groups[a][0]?.schedtime || 0);
      const dateB = new Date(groups[b][0]?.starttime || groups[b][0]?.schedtime || 0);
      return dateB.getTime() - dateA.getTime();
    });

    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [jobs, groupByDate]);

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Jobs Status Terminated
          </span>
          <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
            {jobs.length} jobs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {Object.entries(groupedJobs).map(([groupName, groupJobs]) => (
            <div key={groupName}>
              {groupByDate && (
                <div className="bg-slate-700/50 px-6 py-3 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-200">{groupName}</h3>
                    <span className="text-xs text-slate-400">{groupJobs.length} jobs</span>
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300 font-medium w-[200px]">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Job
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium w-[100px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium w-[100px]">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Nível
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium w-[120px]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Cliente
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium w-[140px]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data/Hora
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium w-[100px]">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Tamanho
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium w-[80px]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Arquivos
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupJobs.length > 0 ? (
                    groupJobs.map((job, index) => (
                      <TableRow 
                        key={job.jobid || index} 
                        className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <TableCell className="font-medium text-white py-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[180px]" title={job.name || job.jobname}>
                              {job.name || job.jobname || 'N/A'}
                            </span>
                            <span className="text-xs text-slate-400">#{job.jobid}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {getJobStatusBadge(job.jobstatus)}
                        </TableCell>
                        <TableCell className="py-2">
                          {getJobLevelBadge(job.level)}
                        </TableCell>
                        <TableCell className="text-slate-300 py-2 text-sm">
                          <span className="truncate max-w-[100px] block" title={job.client || job.clientname}>
                            {job.client || job.clientname || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-sm">
                          <div className="text-slate-300">
                            {formatDateTime(job.starttime || job.schedtime)}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300 py-2 text-sm">
                          {formatBytes(parseInt(job.jobbytes) || 0)}
                        </TableCell>
                        <TableCell className="text-slate-300 py-2 text-sm">
                          {job.jobfiles ? parseInt(job.jobfiles).toLocaleString() : '0'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        Nenhum job encontrado para este período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};