import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MasterPasswordDialog } from '@/components/MasterPasswordDialog';
import { useHostingerIntegrations, useHostingerVPS, useHostingerVPSMetrics, useHostingerActions } from '@/hooks/useHostingerAPI';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Camera, 
  RotateCcw, 
  MapPin, 
  Calendar, 
  Activity, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  Clock,
  Gauge,
  Network,
  BarChart3
} from 'lucide-react';

export const HostingerDashboard = () => {
  const { toast } = useToast();
  const { isMaster } = useAuth();
  const { data: integrations, isLoading: integrationsLoading } = useHostingerIntegrations();
  const { restartVPS, createSnapshot } = useHostingerActions();
  
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [showMasterPasswordDialog, setShowMasterPasswordDialog] = useState(false);
  const [pendingRestartVpsId, setPendingRestartVpsId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const { data: vpsList, isLoading: vpsLoading, refetch: refetchVPS } = useHostingerVPS(
    selectedIntegration || integrations?.[0]?.id
  );

  React.useEffect(() => {
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
    const safeName = typeof vpsName === 'object' 
      ? vpsName?.hostname || vpsName?.name || vpsName?.id || vpsId 
      : vpsName || vpsId;
    const snapshotName = `${safeName}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;
    
    await createSnapshot.mutateAsync({
      integrationId: selectedIntegration,
      vpsId,
      name: snapshotName
    });
    setTimeout(() => refetchVPS(), 2000);
  };

  if (integrationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400">Carregando integrações...</span>
      </div>
    );
  }

  if (!integrations || integrations.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Server className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma Integração Hostinger</h3>
          <p className="text-slate-400 mb-4">
            Configure uma integração Hostinger no painel administrativo para visualizar seus VPS.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm"
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                >
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
      <div className="grid gap-6">
        {vpsLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400">Carregando VPS...</span>
          </div>
        ) : !vpsList || vpsList.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum VPS Encontrado</h3>
              <p className="text-slate-400">
                Não foi possível encontrar VPS nesta integração ou houve um erro na conexão.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {vpsList.map((vps: any) => (
              <VPSCard
                key={vps.id}
                vps={vps}
                integrationId={selectedIntegration}
                onRestart={() => handleRestart(vps.id)}
                onSnapshot={() => handleSnapshot(vps.id, vps.hostname || vps.name)}
                restarting={restartVPS.isPending}
                snapshotting={createSnapshot.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Senha Master */}
      <MasterPasswordDialog
        open={showMasterPasswordDialog}
        onOpenChange={setShowMasterPasswordDialog}
        onSuccess={handleMasterPasswordSuccess}
        title="Autorização para Reiniciar VPS"
        description="Esta ação irá reiniciar o servidor virtual. Para continuar, confirme sua senha master:"
      />
    </div>
  );
};

interface VPSCardProps {
  vps: any;
  integrationId: string;
  onRestart: () => void;
  onSnapshot: () => void;
  restarting: boolean;
  snapshotting: boolean;
}

const VPSCard: React.FC<VPSCardProps> = ({
  vps,
  integrationId,
  onRestart,
  onSnapshot,
  restarting,
  snapshotting
}) => {
  const safeValue = (value: any, fallback: any = 'N/A') => {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem.address) {
          return firstItem.address;
        }
        return firstItem;
      }
      if (value.address) return value.address;
      if (value.name) return value.name;
      if (value.id) return value.id;
      return fallback;
    }
    return value !== undefined && value !== null ? value : fallback;
  };

  const getVpsStatus = (vps: any) => {
    return vps.state || vps.status || 'unknown';
  };

  const { data: metrics } = useHostingerVPSMetrics(integrationId, vps.id, safeValue(vps.ipv4));

  const formatMemory = (mb: number) => {
    if (!mb) return '0 MB';
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const formatDisk = (gb: number) => {
    if (!gb) return '0 GB';
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`;
    }
    return `${gb} GB`;
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

  const getUsageColor = (usage: number) => {
    if (usage >= 85) return 'text-red-300';
    if (usage >= 70) return 'text-orange-300';
    return 'text-blue-300';
  };

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all hover-scale">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2 min-w-0">
            <Server className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <span className="truncate flex-1 min-w-0">
              {safeValue(vps.hostname) || safeValue(vps.name) || safeValue(vps.id)}
            </span>
          </CardTitle>
          <Badge variant="outline" className={`${getStatusColor(getVpsStatus(vps))} flex items-center gap-1`}>
            {getStatusIcon(getVpsStatus(vps))}
            {getVpsStatus(vps)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informações Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Wifi className="h-4 w-4 text-blue-400" />
              <span className="text-sm">IP Principal</span>
            </div>
            <p className="text-white font-mono text-sm">{safeValue(vps.ipv4)}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Localização</span>
            </div>
            <p className="text-white text-sm">{safeValue(vps.region)}</p>
          </div>
        </div>

        {/* Especificações */}
        <div className="space-y-3 pt-2 border-t border-slate-600">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            Especificações
          </h4>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Cpu className="h-4 w-4 text-blue-400 mx-auto" />
              </div>
              <p className="text-xs text-slate-400">CPU</p>
              <p className="text-white font-semibold">{safeValue(vps.cpus || vps.cpu, '0')}</p>
            </div>
            
            <div className="space-y-1">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="h-4 w-4 text-blue-400 mx-auto" />
              </div>
              <p className="text-xs text-slate-400">RAM</p>
              <p className="text-white font-semibold">{formatMemory(safeValue(vps.memory, 0))}</p>
            </div>
            
            <div className="space-y-1">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <HardDrive className="h-4 w-4 text-blue-400 mx-auto" />
              </div>
              <p className="text-xs text-slate-400">Disco</p>
              <p className="text-white font-semibold">{formatDisk(safeValue(vps.disk, 0))}</p>
            </div>
          </div>
        </div>

        {/* Métricas de Performance */}
        {metrics && (
          <div className="space-y-3 pt-2 border-t border-slate-600">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-400" />
                Performance
                <span className="text-xs text-slate-500">
                  ({metrics.isReal ? 'Real-time' : 'Live Simulation'})
                </span>
              </h4>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  metrics.isReal ? 'bg-blue-400' : 'bg-orange-400'
                }`} />
                <Badge 
                  variant="outline" 
                  className={metrics.isReal 
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs" 
                    : "bg-orange-500/20 text-orange-300 border-orange-500/40 text-xs"
                  }
                >
                  {metrics.isReal ? 'Real' : 'Sim'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* CPU Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">CPU</span>
                  <span className={`font-mono ${getUsageColor(metrics.cpu_usage)}`}>
                    {Math.round(metrics.cpu_usage)}%
                  </span>
                </div>
                <Progress value={metrics.cpu_usage} className="h-2" />
              </div>
              
              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Memória</span>
                  <span className={`font-mono ${getUsageColor(metrics.memory_usage)}`}>
                    {Math.round(metrics.memory_usage)}%
                  </span>
                </div>
                <Progress value={metrics.memory_usage} className="h-2" />
              </div>
              
              {/* Disk Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Disco</span>
                  <span className={`font-mono ${getUsageColor(metrics.disk_usage)}`}>
                    {Math.round(metrics.disk_usage)}%
                  </span>
                </div>
                <Progress value={metrics.disk_usage} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onRestart}
            variant="outline"
            size="sm"
            disabled={restarting}
            className="p-3 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-red-500 hover:text-red-300"
            title="Reiniciar VPS"
          >
            {restarting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            onClick={onSnapshot}
            variant="outline"
            size="sm"
            disabled={snapshotting}
            className="p-3 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-blue-500 hover:text-blue-300"
            title="Criar Snapshot"
          >
            {snapshotting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};