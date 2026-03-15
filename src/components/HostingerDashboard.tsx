import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MasterPasswordDialog } from '@/components/MasterPasswordDialog';
import { useHostingerIntegrations, useHostingerVPS, useHostingerVPSMetrics, useHostingerActions } from '@/hooks/useHostingerAPI';
import { Server, Cpu, HardDrive, Wifi, Camera, RotateCcw, MapPin, Activity, Zap, RefreshCw, AlertCircle, Clock, Gauge, Network, BarChart3, Play, Square } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const HostingerDashboard = () => {
  const { toast } = useToast();
  const { isMaster } = useAuth();
  const { data: integrations, isLoading: integrationsLoading } = useHostingerIntegrations();
  const { restartVPS, startVPS, stopVPS, createSnapshot } = useHostingerActions();
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [showMasterPasswordDialog, setShowMasterPasswordDialog] = useState(false);
  const [pendingRestartVpsId, setPendingRestartVpsId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data: vpsList, isLoading: vpsLoading, refetch: refetchVPS } = useHostingerVPS(selectedIntegration || integrations?.[0]?.id);

  useEffect(() => {
    if (integrations && integrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(integrations[0].id);
    }
  }, [integrations, selectedIntegration]);

  const handleVPSAction = (vpsId: string, action: 'restart' | 'start' | 'stop') => {
    if (!isMaster) {
      toast({ title: "Acesso Negado", description: "Apenas usuários master podem gerenciar VPS", variant: "destructive" });
      return;
    }
    setPendingRestartVpsId(`${action}:${vpsId}`);
    setShowMasterPasswordDialog(true);
  };

  const handleMasterPasswordSuccess = async () => {
    if (!pendingRestartVpsId) return;
    const [action, vpsId] = pendingRestartVpsId.split(':');
    try {
      const mutationMap = { restart: restartVPS, start: startVPS, stop: stopVPS };
      const mutation = mutationMap[action as keyof typeof mutationMap];
      await mutation.mutateAsync({ integrationId: selectedIntegration, vpsId });
      setTimeout(() => refetchVPS(), 3000);
    } finally {
      setPendingRestartVpsId(null);
    }
  };

  const handleRefresh = () => {
    refetchVPS();
    setLastRefresh(new Date());
    toast({ title: "Atualizado", description: "Dados atualizados com sucesso" });
  };

  const handleSnapshot = async (vpsId: string, vpsName: any) => {
    const safeName = typeof vpsName === 'object' ? vpsName?.hostname || vpsName?.name || vpsName?.id || vpsId : vpsName || vpsId;
    const snapshotName = `${safeName}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;
    await createSnapshot.mutateAsync({ integrationId: selectedIntegration, vpsId, name: snapshotName });
    setTimeout(() => refetchVPS(), 2000);
  };

  if (integrationsLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground">Carregando integrações...</span>
      </div>
    );
  }

  if (!integrations || integrations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <Server className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Nenhuma Integração Hostinger</h3>
        <p className="text-xs text-muted-foreground">Configure uma integração no painel administrativo.</p>
      </div>
    );
  }

  const totalVps = vpsList?.length || 0;
  const activeVps = vpsList?.filter((vps: any) => vps.state === 'running' || vps.status === 'active').length || 0;

  return (
    <div className="space-y-3">
      {/* Compact Stats Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-4 bg-card border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-xs font-bold text-foreground">{totalVps}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Ativos:</span>
            <span className="text-xs font-bold text-emerald-500">{activeVps}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-amber-500" />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Tempo Real</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-muted-foreground">{lastRefresh.toLocaleTimeString()}</span>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="h-7 text-xs px-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* VPS Grid */}
      {vpsLoading ? (
        <div className="flex items-center justify-center p-6">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">Carregando VPS...</span>
        </div>
      ) : !vpsList || vpsList.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground mb-1">Nenhum VPS Encontrado</h3>
          <p className="text-xs text-muted-foreground">Não foi possível encontrar VPS nesta integração.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {vpsList.map((vps: any, index: number) => (
            <VPSCard
              key={vps.id}
              vps={vps}
              index={index}
              integrationId={selectedIntegration}
              onRestart={() => handleVPSAction(vps.id, 'restart')}
              onStart={() => handleVPSAction(vps.id, 'start')}
              onStop={() => handleVPSAction(vps.id, 'stop')}
              onSnapshot={() => handleSnapshot(vps.id, vps.hostname || vps.name)}
              actionPending={restartVPS.isPending || startVPS.isPending || stopVPS.isPending}
              snapshotting={createSnapshot.isPending}
            />
          ))}
        </div>
      )}

      <MasterPasswordDialog
        open={showMasterPasswordDialog}
        onOpenChange={setShowMasterPasswordDialog}
        onSuccess={handleMasterPasswordSuccess}
        title="Autorização para Gerenciar VPS"
        description="Confirme sua senha master para continuar:"
      />
    </div>
  );
};

interface VPSCardProps {
  vps: any;
  index: number;
  integrationId: string;
  onRestart: () => void;
  onStart: () => void;
  onStop: () => void;
  onSnapshot: () => void;
  actionPending: boolean;
  snapshotting: boolean;
}

const VPSCard = ({ vps, index, integrationId, onRestart, onStart, onStop, onSnapshot, actionPending, snapshotting }: VPSCardProps) => {
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

  const getUsageColor = (usage: number) => {
    if (usage >= 85) return 'text-destructive';
    if (usage >= 70) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getProgressColor = (usage: number) => {
    if (usage >= 85) return '[&>div]:bg-destructive';
    if (usage >= 70) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-emerald-500';
  };

  const status = getVpsStatus(vps);
  const isOnline = status?.toLowerCase() === 'running' || status?.toLowerCase() === 'active';
  const statusLabel = isOnline ? 'Online' : status?.toLowerCase() === 'restarting' ? 'Reiniciando' : 'Offline';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors cursor-default">
            {/* Thin status bar */}
            <div className={`h-0.5 w-full ${isOnline ? 'bg-emerald-500' : 'bg-destructive'}`} />

            <div className="p-3 space-y-2.5">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative">
                    <div className="w-7 h-7 bg-muted rounded-md flex items-center justify-center">
                      <Server className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500' : 'bg-destructive'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-foreground truncate leading-tight">
                      {safeValue(vps.hostname) || safeValue(vps.name) || `VPS-${index + 1}`}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {safeValue(vps.ipv4)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 font-medium ${isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                  {statusLabel}
                </Badge>
              </div>

              {/* Specs Row */}
              <div className="grid grid-cols-3 gap-1">
                {[
                  { icon: Cpu, label: 'CPU', value: `${safeValue(vps.cpus || vps.cpu, '0')} cores`, color: 'text-primary' },
                  { icon: Zap, label: 'RAM', value: formatMemory(safeValue(vps.memory, 0)), color: 'text-purple-500' },
                  { icon: HardDrive, label: 'Disco', value: formatDisk(safeValue(vps.disk, 0)), color: 'text-cyan-500' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-muted/50 rounded px-2 py-1.5 text-center border border-border/50">
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Icon className={`h-2.5 w-2.5 ${color}`} />
                      <span className="text-[8px] text-muted-foreground uppercase font-medium">{label}</span>
                    </div>
                    <p className="text-[11px] font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Location & OS */}
              <div className="flex items-center justify-between text-[10px] px-0.5">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>{safeValue(vps.region)}</span>
                </div>
                {vps.os && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Network className="h-2.5 w-2.5" />
                    <span className="truncate max-w-[100px]">{safeValue(vps.os)}</span>
                  </div>
                )}
              </div>

              {/* Performance */}
              {metrics && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <BarChart3 className="h-2.5 w-2.5" />
                      Performance
                    </span>
                    <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${metrics.isReal ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                      {metrics.isReal ? '● Real' : '○ Simulado'}
                    </Badge>
                  </div>
                  {[
                    { label: 'CPU', value: metrics.cpu_usage },
                    { label: 'RAM', value: metrics.memory_usage },
                    { label: 'Disco', value: metrics.disk_usage },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={`font-mono font-medium ${getUsageColor(value)}`}>{Math.round(value)}%</span>
                      </div>
                      <Progress value={value} className={`h-1 bg-muted ${getProgressColor(value)}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1.5 pt-1">
                <Button onClick={onRestart} variant="outline" size="sm" disabled={restarting} className="flex-1 h-6 text-[10px] hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors">
                  {restarting ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                  Reiniciar
                </Button>
                <Button
                  onClick={() => window.open('https://hpanel.hostinger.com.br/hosting/vps-list', '_blank')}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-6 text-[10px] hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <Camera className="h-3 w-3 mr-1" />
                  Snapshot
                </Button>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] max-w-[220px]">
          <p className="font-semibold">{safeValue(vps.hostname) || safeValue(vps.name)}</p>
          <p>IP: {safeValue(vps.ipv4)}</p>
          <p>Região: {safeValue(vps.region)}</p>
          <p>OS: {safeValue(vps.os)}</p>
          <p>Criado: {vps.created_at ? new Date(vps.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
