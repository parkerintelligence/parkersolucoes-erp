import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MasterPasswordDialog } from '@/components/MasterPasswordDialog';
import { useHostingerIntegrations, useHostingerVPS, useHostingerVPSMetrics, useHostingerActions } from '@/hooks/useHostingerAPI';
import { Server, Cpu, HardDrive, Wifi, Camera, RotateCcw, MapPin, Calendar, Activity, Zap, RefreshCw, AlertCircle, Clock, Gauge, Network, BarChart3 } from 'lucide-react';
export const HostingerDashboard = () => {
  const {
    toast
  } = useToast();
  const {
    isMaster
  } = useAuth();
  const {
    data: integrations,
    isLoading: integrationsLoading
  } = useHostingerIntegrations();
  const {
    restartVPS,
    createSnapshot
  } = useHostingerActions();
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [showMasterPasswordDialog, setShowMasterPasswordDialog] = useState(false);
  const [pendingRestartVpsId, setPendingRestartVpsId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const {
    data: vpsList,
    isLoading: vpsLoading,
    refetch: refetchVPS
  } = useHostingerVPS(selectedIntegration || integrations?.[0]?.id);
  useEffect(() => {
    if (integrations && integrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(integrations[0].id);
    }
  }, [integrations, selectedIntegration]);
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'active':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'stopped':
      case 'inactive':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'restarting':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'active':
        return <Activity className="h-3 w-3" />;
      case 'stopped':
      case 'inactive':
        return <AlertCircle className="h-3 w-3" />;
      case 'restarting':
        return <RefreshCw className="h-3 w-3 animate-spin" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };
  const handleRestart = (vpsId: string) => {
    if (!isMaster) {
      toast({
        title: "Acesso Negado",
        description: "Apenas usuários master podem reiniciar VPS",
        variant: "destructive"
      });
      return;
    }
    setPendingRestartVpsId(vpsId);
    setShowMasterPasswordDialog(true);
  };
  const handleMasterPasswordSuccess = async () => {
    if (!pendingRestartVpsId) return;
    try {
      await restartVPS.mutateAsync({
        integrationId: selectedIntegration,
        vpsId: pendingRestartVpsId
      });
      setTimeout(() => refetchVPS(), 2000);
    } finally {
      setPendingRestartVpsId(null);
    }
  };
  const handleRefresh = () => {
    refetchVPS();
    setLastRefresh(new Date());
    toast({
      title: "Dados Atualizados",
      description: "Dashboard atualizado com sucesso"
    });
  };
  const handleSnapshot = async (vpsId: string, vpsName: any) => {
    const safeName = typeof vpsName === 'object' ? vpsName?.hostname || vpsName?.name || vpsName?.id || vpsId : vpsName || vpsId;
    const snapshotName = `${safeName}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;
    await createSnapshot.mutateAsync({
      integrationId: selectedIntegration,
      vpsId,
      name: snapshotName
    });
    setTimeout(() => refetchVPS(), 2000);
  };
  if (integrationsLoading) {
    return <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400">Carregando integrações...</span>
      </div>;
  }
  if (!integrations || integrations.length === 0) {
    return <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Server className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma Integração Hostinger</h3>
          <p className="text-slate-400 mb-4">
            Configure uma integração Hostinger no painel administrativo para visualizar seus VPS.
          </p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Header com Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Server className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total VPS</p>
                  <p className="text-2xl font-bold text-white">{vpsList?.length || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ativos</p>
                  <p className="text-2xl font-bold text-white">
                    {vpsList?.filter((vps: any) => vps.state === 'running' || vps.status === 'active').length || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Gauge className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Monitoramento</p>
                  <p className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    Tempo Real
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button onClick={handleRefresh} variant="outline" size="sm" className="bg-slate-700 border-slate-600 hover:bg-slate-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              <span className="text-xs text-slate-400">
                {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de VPS */}
      {vpsLoading ? <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400">Carregando VPS...</span>
          </div> : !vpsList || vpsList.length === 0 ? <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum VPS Encontrado</h3>
              <p className="text-slate-400">
                Não foi possível encontrar VPS nesta integração ou houve um erro na conexão.
              </p>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
             {vpsList.map((vps: any, index: number) => <VPSCard key={vps.id} vps={vps} index={index} integrationId={selectedIntegration} onRestart={() => handleRestart(vps.id)} onSnapshot={() => handleSnapshot(vps.id, vps.hostname || vps.name)} restarting={restartVPS.isPending} snapshotting={createSnapshot.isPending} />)}
          </div>}

      {/* Dialog de Senha Master */}
      <MasterPasswordDialog open={showMasterPasswordDialog} onOpenChange={setShowMasterPasswordDialog} onSuccess={handleMasterPasswordSuccess} title="Autorização para Reiniciar VPS" description="Esta ação irá reiniciar o servidor virtual. Para continuar, confirme sua senha master:" />
    </div>;
};
interface VPSCardProps {
  vps: any;
  index: number;
  integrationId: string;
  onRestart: () => void;
  onSnapshot: () => void;
  restarting: boolean;
  snapshotting: boolean;
}
const VPSCard = ({
  vps,
  index,
  integrationId,
  onRestart,
  onSnapshot,
  restarting,
  snapshotting
}: VPSCardProps) => {
  const safeValue = (value: any, fallback: any = 'N/A') => {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem.address) return firstItem.address;
        return firstItem;
      }
      if (value.address) return value.address;
      if (value.name) return value.name;
      if (value.id) return value.id;
      return fallback;
    }
    return value !== undefined && value !== null ? value : fallback;
  };

  const getVpsStatus = (vps: any) => vps.state || vps.status || 'unknown';

  const { data: metrics } = useHostingerVPSMetrics(integrationId, vps.id, safeValue(vps.ipv4));

  const formatMemory = (mb: number) => {
    if (!mb) return '0 MB';
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  };

  const formatDisk = (gb: number) => {
    if (!gb) return '0 GB';
    return gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${gb} GB`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running': case 'active': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'stopped': case 'inactive': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'restarting': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running': case 'active': return 'Online';
      case 'stopped': case 'inactive': return 'Offline';
      case 'restarting': return 'Reiniciando';
      default: return status;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 85) return 'text-red-400';
    if (usage >= 70) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getProgressColor = (usage: number) => {
    if (usage >= 85) return '[&>div]:bg-red-500';
    if (usage >= 70) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-emerald-500';
  };

  const status = getVpsStatus(vps);
  const isOnline = status?.toLowerCase() === 'running' || status?.toLowerCase() === 'active';

  return (
    <Card className="bg-slate-800/90 border-slate-700/80 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
      {/* Status bar top */}
      <div className={`h-1 w-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
      
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-9 h-9 bg-slate-700/80 rounded-lg flex items-center justify-center border border-slate-600/50">
                <Server className="h-4 w-4 text-blue-400" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate leading-tight">
                {safeValue(vps.hostname) || safeValue(vps.name) || `VPS-${index + 1}`}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {safeValue(vps.ipv4)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`${getStatusColor(status)} text-[10px] px-2 py-0.5 font-medium`}>
            {getStatusLabel(status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 pt-1">
        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-slate-700/40 rounded-md p-2 text-center border border-slate-600/30">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Cpu className="h-3 w-3 text-blue-400" />
              <span className="text-[9px] text-slate-500 uppercase font-medium">CPU</span>
            </div>
            <p className="text-white font-bold text-sm">{safeValue(vps.cpus || vps.cpu, '0')} <span className="text-[10px] text-slate-400 font-normal">cores</span></p>
          </div>
          <div className="bg-slate-700/40 rounded-md p-2 text-center border border-slate-600/30">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Zap className="h-3 w-3 text-purple-400" />
              <span className="text-[9px] text-slate-500 uppercase font-medium">RAM</span>
            </div>
            <p className="text-white font-bold text-sm">{formatMemory(safeValue(vps.memory, 0))}</p>
          </div>
          <div className="bg-slate-700/40 rounded-md p-2 text-center border border-slate-600/30">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <HardDrive className="h-3 w-3 text-cyan-400" />
              <span className="text-[9px] text-slate-500 uppercase font-medium">Disco</span>
            </div>
            <p className="text-white font-bold text-sm">{formatDisk(safeValue(vps.disk, 0))}</p>
          </div>
        </div>

        {/* Location & OS */}
        <div className="flex items-center justify-between text-[11px] px-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="h-3 w-3 text-slate-500" />
            <span>{safeValue(vps.region)}</span>
          </div>
          {vps.os && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Network className="h-3 w-3 text-slate-500" />
              <span className="truncate max-w-[120px]">{safeValue(vps.os)}</span>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        {metrics && (
          <div className="space-y-2 pt-2 border-t border-slate-700/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Performance
              </span>
              <Badge variant="outline" className={`${metrics.isReal ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"} text-[9px] px-1.5 py-0`}>
                {metrics.isReal ? '● Real' : '○ Simulado'}
              </Badge>
            </div>

            {[
              { label: 'CPU', value: metrics.cpu_usage },
              { label: 'RAM', value: metrics.memory_usage },
              { label: 'Disco', value: metrics.disk_usage },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-mono font-medium ${getUsageColor(value)}`}>{Math.round(value)}%</span>
                </div>
                <Progress value={value} className={`h-1.5 bg-slate-700/50 ${getProgressColor(value)}`} />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button onClick={onRestart} variant="outline" size="sm" disabled={restarting} className="flex-1 h-8 text-xs border-slate-600/80 hover:border-red-500/60 hover:text-red-300 hover:bg-red-500/10 bg-slate-700/30 transition-colors">
            {restarting ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
            Reiniciar
          </Button>
          <Button
            onClick={() => window.open('https://hpanel.hostinger.com.br/hosting/vps-list', '_blank')}
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-slate-600/80 hover:border-blue-500/60 hover:text-blue-300 hover:bg-blue-500/10 bg-slate-700/30 transition-colors"
          >
            <Camera className="h-3.5 w-3.5 mr-1.5" />
            Snapshot
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};