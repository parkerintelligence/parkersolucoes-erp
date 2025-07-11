import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database } from 'lucide-react';
import { getJobLevelBadge } from '@/hooks/useBaculaJobsData';

interface BaculaJobsTableProps {
  jobs: any[];
  recentJobs: any[];
  formatDateTime: (dateTime: string) => string;
  formatBytes: (bytes: number) => string;
  getJobStatusBadge: (status: string) => React.ReactNode;
}

export const BaculaJobsTable: React.FC<BaculaJobsTableProps> = ({
  jobs,
  recentJobs,
  formatDateTime,
  formatBytes,
  getJobStatusBadge
}) => {
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
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="border-slate-700 bg-slate-800/50">
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">jobid</TableHead>
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">name</TableHead>
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">jobstatus</TableHead>
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">starttime</TableHead>
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">endtime</TableHead>
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">level</TableHead>
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">jobfiles</TableHead>
                <TableHead className="text-slate-300 text-xs font-semibold px-3 py-2">jobbytes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: any, index: number) => (
                <TableRow key={job.jobid || index} className="border-slate-700 hover:bg-slate-800/30 text-xs">
                  <TableCell className="text-slate-300 font-mono px-3 py-2">{job.jobid || '-'}</TableCell>
                  <TableCell className="text-slate-300 max-w-64 truncate font-medium px-3 py-2">
                    {job.name || job.jobname || '-'}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {getJobStatusBadge(job.jobstatus)}
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono px-3 py-2 text-xs">
                    {job.starttime ? formatDateTime(job.starttime) : '-'}
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono px-3 py-2 text-xs">
                    {job.endtime ? formatDateTime(job.endtime) : '-'}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {getJobLevelBadge(job.level)}
                  </TableCell>
                  <TableCell className="text-slate-300 px-3 py-2">{job.jobfiles || '-'}</TableCell>
                  <TableCell className="text-slate-300 px-3 py-2">
                    {job.jobbytes ? formatBytes(parseInt(job.jobbytes)) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};