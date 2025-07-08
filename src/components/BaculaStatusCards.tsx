
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Database, Server, HardDrive } from 'lucide-react';
import { useBaculaStatus, useBaculaJobsRunning, useBaculaJobsLast24h, useBaculaDirectorStatus, useBaculaConnectionTest } from '@/hooks/useBaculaAPI';

export const BaculaStatusCards = () => {
  const { data: connectionTest, isLoading: isConnectionLoading, error: connectionError } = useBaculaConnectionTest();
  const { data: directorStatus, isLoading: isDirectorLoading, error: directorError } = useBaculaDirectorStatus();
  const { data: runningJobs, isLoading: isRunningLoading, error: runningError } = useBaculaJobsRunning();
  const { data: last24hJobs, isLoading: isLast24hLoading, error: last24hError } = useBaculaJobsLast24h();

  const getConnectionStatus = () => {
    if (isConnectionLoading) return { status: 'loading', label: 'Verificando...', color: 'bg-yellow-900/20 text-yellow-400 border-yellow-600' };
    if (connectionError) {
      console.error('Connection error:', connectionError);
      return { status: 'error', label: 'Erro de Conexão', color: 'bg-red-900/20 text-red-400 border-red-600' };
    }
    // Verificar se a resposta indica sucesso da API
    if (connectionTest && (connectionTest.output || connectionTest.result || connectionTest.data)) {
      return { status: 'success', label: 'Conectado', color: 'bg-green-900/20 text-green-400 border-green-600' };
    }
    return { status: 'unknown', label: 'Desconhecido', color: 'bg-gray-900/20 text-gray-400 border-gray-600' };
  };

  const getRunningJobsCount = () => {
    if (isRunningLoading) return '...';
    if (runningError) {
      console.error('Running jobs error:', runningError);
      return 'Erro';
    }
    if (!runningJobs) return '0';
    
    // Verificar diferentes estruturas de resposta do Baculum
    if (runningJobs.output && Array.isArray(runningJobs.output)) {
      return runningJobs.output.length.toString();
    }
    if (runningJobs.result && Array.isArray(runningJobs.result)) {
      return runningJobs.result.length.toString();
    }
    if (runningJobs.data && Array.isArray(runningJobs.data)) {
      return runningJobs.data.length.toString();
    }
    if (Array.isArray(runningJobs)) {
      return runningJobs.length.toString();
    }
    
    return '0';
  };

  const getLast24hStats = () => {
    if (isLast24hLoading || !last24hJobs) return { total: '...', successful: '...', failed: '...' };
    if (last24hError) {
      console.error('Last 24h jobs error:', last24hError);
      return { total: 'Erro', successful: 'Erro', failed: 'Erro' };
    }
    
    // Extrair jobs de diferentes estruturas de resposta
    let jobs = [];
    if (last24hJobs.output && Array.isArray(last24hJobs.output)) {
      jobs = last24hJobs.output;
    } else if (last24hJobs.result && Array.isArray(last24hJobs.result)) {
      jobs = last24hJobs.result;
    } else if (last24hJobs.data && Array.isArray(last24hJobs.data)) {
      jobs = last24hJobs.data;
    } else if (Array.isArray(last24hJobs)) {
      jobs = last24hJobs;
    }
    
    if (jobs.length > 0) {
      const total = jobs.length;
      const successful = jobs.filter(job => job.jobstatus === 'T' || job.jobstatus === 'W').length;
      const failed = jobs.filter(job => job.jobstatus === 'E' || job.jobstatus === 'f').length;
      return { total: total.toString(), successful: successful.toString(), failed: failed.toString() };
    }
    
    return { total: '0', successful: '0', failed: '0' };
  };

  const getDirectorStatus = () => {
    if (isDirectorLoading) return { status: 'loading', label: 'Carregando...', color: 'bg-yellow-900/20 text-yellow-400 border-yellow-600' };
    if (directorError) {
      console.error('Director status error:', directorError);
      return { status: 'error', label: 'Erro', color: 'bg-red-900/20 text-red-400 border-red-600' };
    }
    if (!directorStatus) return { status: 'unknown', label: 'Desconhecido', color: 'bg-gray-900/20 text-gray-400 border-gray-600' };
    
    // Verificar diferentes estruturas de resposta do Baculum
    let status = null;
    if (directorStatus.output) {
      status = directorStatus.output;
    } else if (directorStatus.result) {
      status = directorStatus.result;
    } else if (directorStatus.data) {
      status = directorStatus.data;
    } else {
      status = directorStatus;
    }
    
    // Verificar se o director está online
    const isOnline = status && (
      status.status === 'running' || 
      status.online === true || 
      status.state === 'running' ||
      (typeof status === 'string' && status.includes('running'))
    );
    
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
          {connectionError && (
            <p className="text-xs text-red-400 mt-1">
              {connectionError.message}
            </p>
          )}
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
          {directorError && (
            <p className="text-xs text-red-400 mt-1">
              {directorError.message}
            </p>
          )}
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
          {runningError && (
            <p className="text-xs text-red-400 mt-1">
              {runningError.message}
            </p>
          )}
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
          {last24hError && (
            <p className="text-xs text-red-400 mt-1">
              {last24hError.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
