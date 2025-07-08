
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Database, Server, HardDrive } from 'lucide-react';
import { useBaculaStatus, useBaculaJobsRunning, useBaculaJobsLast24h, useBaculaDirectorStatus, useBaculaConnectionTest } from '@/hooks/useBaculaAPI';

export const BaculaStatusCards = () => {
  const { data: connectionTest, isLoading: isConnectionLoading, error: connectionError } = useBaculaConnectionTest();
  const { data: directorStatus, isLoading: isDirectorLoading } = useBaculaDirectorStatus();
  const { data: runningJobs, isLoading: isRunningLoading } = useBaculaJobsRunning();
  const { data: last24hJobs, isLoading: isLast24hLoading } = useBaculaJobsLast24h();

  const getConnectionStatus = () => {
    if (isConnectionLoading) return { status: 'loading', label: 'Verificando...', color: 'bg-yellow-900/20 text-yellow-400 border-yellow-600' };
    if (connectionError) return { status: 'error', label: 'Erro de Conexão', color: 'bg-red-900/20 text-red-400 border-red-600' };
    if (connectionTest) return { status: 'success', label: 'Conectado', color: 'bg-green-900/20 text-green-400 border-green-600' };
    return { status: 'unknown', label: 'Desconhecido', color: 'bg-gray-900/20 text-gray-400 border-gray-600' };
  };

  const getRunningJobsCount = () => {
    if (isRunningLoading) return '...';
    if (!runningJobs) return '0';
    return Array.isArray(runningJobs) ? runningJobs.length.toString() : '0';
  };

  const getLast24hStats = () => {
    if (isLast24hLoading || !last24hJobs) return { total: '...', successful: '...', failed: '...' };
    
    if (Array.isArray(last24hJobs)) {
      const total = last24hJobs.length;
      const successful = last24hJobs.filter(job => job.jobstatus === 'T' || job.jobstatus === 'W').length;
      const failed = last24hJobs.filter(job => job.jobstatus === 'E' || job.jobstatus === 'f').length;
      return { total: total.toString(), successful: successful.toString(), failed: failed.toString() };
    }
    
    return { total: '0', successful: '0', failed: '0' };
  };

  const getDirectorStatus = () => {
    if (isDirectorLoading) return { status: 'loading', label: 'Carregando...', color: 'bg-yellow-900/20 text-yellow-400 border-yellow-600' };
    if (!directorStatus) return { status: 'unknown', label: 'Desconhecido', color: 'bg-gray-900/20 text-gray-400 border-gray-600' };
    
    // Assuming director status returns an object with status information
    const isOnline = directorStatus.status === 'running' || directorStatus.online === true;
    return isOnline 
      ? { status: 'online', label: 'Online', color: 'bg-green-900/20 text-green-400 border-green-600' }
      : { status: 'offline', label: 'Offline', color: 'bg-red-900/20 text-red-400 border-red-600' };
  };

  const connectionStatus = getConnectionStatus();
  const runningJobsCount = getRunningJobsCount();
  const last24hStats = getLast24hStats();
  const directorStatusInfo = getDirectorStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Connection Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Conexão</CardTitle>
          <Database className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className={connectionStatus.color}>
              {connectionStatus.label}
            </Badge>
            {connectionStatus.status === 'success' && <CheckCircle className="h-4 w-4 text-green-400" />}
            {connectionStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
            {connectionStatus.status === 'loading' && <Clock className="h-4 w-4 text-yellow-400" />}
          </div>
        </CardContent>
      </Card>

      {/* Director Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Director</CardTitle>
          <Server className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className={directorStatusInfo.color}>
              {directorStatusInfo.label}
            </Badge>
            {directorStatusInfo.status === 'online' && <CheckCircle className="h-4 w-4 text-green-400" />}
            {directorStatusInfo.status === 'offline' && <AlertCircle className="h-4 w-4 text-red-400" />}
          </div>
        </CardContent>
      </Card>

      {/* Running Jobs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Jobs Executando</CardTitle>
          <Clock className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{runningJobsCount}</div>
          <p className="text-xs text-slate-400">jobs ativos</p>
        </CardContent>
      </Card>

      {/* Last 24h Jobs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Últimas 24h</CardTitle>
          <HardDrive className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Total:</span>
              <span className="text-white font-medium">{last24hStats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Sucesso:</span>
              <span className="text-green-400 font-medium">{last24hStats.successful}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-400">Falhas:</span>
              <span className="text-red-400 font-medium">{last24hStats.failed}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
