import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database } from 'lucide-react';

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
              {recentJobs.map((job: any, index: number) => (
                <TableRow key={job.jobid || index} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell className="text-slate-300 font-mono">{job.jobid || '-'}</TableCell>
                  <TableCell className="text-slate-300 max-w-48 truncate font-medium">
                    {job.name || job.jobname || '-'}
                  </TableCell>
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
                  <TableCell className="text-slate-300 max-w-32 truncate">
                    {job.client || job.clientname || '-'}
                  </TableCell>
                  <TableCell className="text-slate-300">
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