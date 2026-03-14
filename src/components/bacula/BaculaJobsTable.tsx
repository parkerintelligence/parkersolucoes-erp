import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const groupedJobs = React.useMemo(() => {
    if (!groupByDate) return { 'Todos os Jobs': jobs };

    const groups: { [key: string]: any[] } = {};
    jobs.forEach(job => {
      const jobDate = job.starttime || job.schedtime;
      if (jobDate) {
        const date = new Date(jobDate);
        const dateKey = date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(job);
      } else {
        if (!groups['Data Desconhecida']) groups['Data Desconhecida'] = [];
        groups['Data Desconhecida'].push(job);
      }
    });

    const sortedGroups: { [key: string]: any[] } = {};
    Object.keys(groups).sort((a, b) => {
      if (a === 'Data Desconhecida') return 1;
      if (b === 'Data Desconhecida') return -1;
      const dateA = new Date(groups[a][0]?.starttime || groups[a][0]?.schedtime || 0);
      const dateB = new Date(groups[b][0]?.starttime || groups[b][0]?.schedtime || 0);
      return dateB.getTime() - dateA.getTime();
    }).forEach(key => { sortedGroups[key] = groups[key]; });

    return sortedGroups;
  }, [jobs, groupByDate]);

  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const allJobs = React.useMemo(() => Object.values(groupedJobs).flat(), [groupedJobs]);
  const totalPages = Math.ceil(allJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = allJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <TooltipProvider>
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Jobs Status Terminated
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border text-muted-foreground">
              {allJobs.length} jobs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs h-8 px-3">Job</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-8 px-3">Nível</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-8 px-3">Cliente</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-8 px-3">Data/Hora</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-8 px-3">Tamanho</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-8 px-3">Arquivos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobs.length > 0 ? (
                  paginatedJobs.map((job, index) => (
                    <Tooltip key={job.jobid || index}>
                      <TooltipTrigger asChild>
                        <TableRow className="border-border hover:bg-muted/30 cursor-default group">
                          <TableCell className="py-1.5 px-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
                                {job.name || job.jobname || 'N/A'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">#{job.jobid}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 px-3">{getJobStatusBadge(job.jobstatus)}</TableCell>
                          <TableCell className="py-1.5 px-3">{getJobLevelBadge(job.level)}</TableCell>
                          <TableCell className="py-1.5 px-3">
                            <span className="text-xs text-muted-foreground truncate max-w-[90px] block">
                              {job.client || job.clientname || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 px-3">
                            <span className="text-xs text-muted-foreground">{formatDateTime(job.starttime || job.schedtime)}</span>
                          </TableCell>
                          <TableCell className="py-1.5 px-3">
                            <span className="text-xs text-muted-foreground font-mono">{formatBytes(parseInt(job.jobbytes) || 0)}</span>
                          </TableCell>
                          <TableCell className="py-1.5 px-3">
                            <span className="text-xs text-muted-foreground">{job.jobfiles ? parseInt(job.jobfiles).toLocaleString() : '0'}</span>
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="max-w-sm">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{job.name || job.jobname || 'N/A'}</p>
                          <p><span className="text-muted-foreground">ID:</span> #{job.jobid}</p>
                          <p><span className="text-muted-foreground">Cliente:</span> {job.client || job.clientname || '-'}</p>
                          <p><span className="text-muted-foreground">Início:</span> {formatDateTime(job.starttime || job.schedtime)}</p>
                          <p><span className="text-muted-foreground">Tamanho:</span> {formatBytes(parseInt(job.jobbytes) || 0)}</p>
                          <p><span className="text-muted-foreground">Arquivos:</span> {job.jobfiles ? parseInt(job.jobfiles).toLocaleString() : '0'}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum job encontrado para este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
              <span className="text-[10px] text-muted-foreground">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, allJobs.length)} de {allJobs.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-6 w-6 p-0 text-xs"
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
