
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Activity, Database, Clock } from 'lucide-react';

interface BaculaAdvancedStatsProps {
  jobs: any[];
}

export const BaculaAdvancedStats: React.FC<BaculaAdvancedStatsProps> = ({ jobs }) => {
  const calculateStats = () => {
    const totalJobs = jobs.length;
    const successfulJobs = jobs.filter(job => job.jobstatus === 'T' || job.jobstatus === 'W').length;
    const failedJobs = jobs.filter(job => job.jobstatus === 'E' || job.jobstatus === 'f').length;
    const runningJobs = jobs.filter(job => job.jobstatus === 'R').length;
    
    const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;
    
    const totalBytes = jobs.reduce((sum, job) => sum + (job.jobbytes || 0), 0);
    const avgDuration = jobs.filter(job => job.duration).reduce((sum, job) => sum + job.duration, 0) / jobs.filter(job => job.duration).length || 0;
    
    return {
      totalJobs,
      successfulJobs,
      failedJobs,
      runningJobs,
      successRate,
      totalBytes,
      avgDuration
    };
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
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Taxa de Sucesso</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</div>
          <Progress value={stats.successRate} className="mt-2" />
          <p className="text-xs text-slate-400 mt-1">
            {stats.successfulJobs} de {stats.totalJobs} jobs
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Volume Total</CardTitle>
          <Database className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-400">{formatBytes(stats.totalBytes)}</div>
          <p className="text-xs text-slate-400 mt-1">
            dados processados
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-400">{formatDuration(stats.avgDuration)}</div>
          <p className="text-xs text-slate-400 mt-1">
            duração média
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Jobs Ativos</CardTitle>
          <Activity className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">{stats.runningJobs}</div>
          <p className="text-xs text-slate-400 mt-1">
            em execução
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Jobs com Falha</CardTitle>
          <BarChart3 className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-400">{stats.failedJobs}</div>
          <p className="text-xs text-slate-400 mt-1">
            necessitam atenção
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
