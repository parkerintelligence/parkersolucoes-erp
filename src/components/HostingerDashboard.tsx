import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MasterPasswordDialog } from '@/components/MasterPasswordDialog';
import { 
  useHostingerIntegrations, 
  useHostingerVPS, 
  useHostingerVPSMetrics, 
  useHostingerActions 
} from '@/hooks/useHostingerAPI';
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
  Clock
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
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'stopped':
      case 'inactive':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'restarting':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'active':
        return '🟢';
      case 'stopped':
      case 'inactive':
        return '🔴';
      case 'restarting':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const handleRestart = (vpsId: string) => {
    if (!isMaster) {
      toast({
        title: "Acesso Negado",
        description: "Apenas usuários master podem reiniciar VPS",
        variant: "destructive",
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
      description: "Dashboard atualizado com sucesso",
    });
  };

  const handleSnapshot = async (vpsId: string, vpsName: any) => {
    const safeName = typeof vpsName === 'object' ? (vpsName?.hostname || vpsName?.name || vpsName?.id || vpsId) : (vpsName || vpsId);
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
      {/* Header com Botão Atualizar */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-orange-500" />
                Dashboard Hostinger VPS
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                Gerencie seus servidores virtuais Hostinger
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última atualização: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Seletor de Integração */}
      {integrations.length > 1 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Selecionar Integração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {integrations.map((integration) => (
                <Button
                  key={integration.id}
                  variant={selectedIntegration === integration.id ? "default" : "outline"}
                  onClick={() => setSelectedIntegration(integration.id)}
                  className={selectedIntegration === integration.id 
                    ? "bg-orange-600 hover:bg-orange-700" 
                    : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  }
                >
                  <Server className="h-4 w-4 mr-2" />
                  {integration.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
  // Função para extrair valores de forma segura de objetos ou strings
  const safeValue = (value: any, fallback: any = 'N/A') => {
    if (typeof value === 'object' && value !== null) {
      // Se for um array (como ipv4), retorna o primeiro elemento
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem.address) {
          return firstItem.address;
        }
        return firstItem;
      }
      // Se for um objeto com address (como IPv4/IPv6)
      if (value.address) return value.address;
      // Se for um objeto com name
      if (value.name) return value.name;
      // Se for um objeto com id
      if (value.id) return value.id;
      // Se for um objeto sem propriedades conhecidas, retorna o fallback
      return fallback;
    }
    return value !== undefined && value !== null ? value : fallback;
  };

  // Função específica para obter o status do VPS
  const getVpsStatus = (vps: any) => {
    // Tentar diferentes campos de status
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

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'stopped':
      case 'inactive':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'restarting':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 85) return 'text-red-300';
    if (usage >= 70) return 'text-yellow-300';
    return 'text-white';
  };


  const formatNetworkSpeed = (bytes: number) => {
    if (!bytes) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-white text-sm md:text-base flex items-center gap-2 truncate min-w-0 flex-1">
            <Server className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span className="truncate">
              {safeValue(vps.hostname) || safeValue(vps.name) || safeValue(vps.id)}
            </span>
          </CardTitle>
          <Badge variant="outline" className={`${getStatusColor(getVpsStatus(vps))} text-xs flex-shrink-0`}>
            {getVpsStatus(vps)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Badge de Dados Reais */}
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
            🟢 Dados Reais da API
          </Badge>
          <span className="text-xs text-slate-400">
            Atualizado: {new Date(vps.realData?.last_updated || new Date()).toLocaleTimeString()}
          </span>
        </div>

        {/* Informações Básicas - Dados Reais */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">IP Principal:</span>
            </div>
            <p className="text-white font-mono text-xs">
              {safeValue(vps.ipv4)}
            </p>
            {vps.ipv6 && (
              <p className="text-slate-300 font-mono text-xs">
                IPv6: {safeValue(vps.ipv6)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">Localização:</span>
            </div>
            <p className="text-white">{safeValue(vps.region)}</p>
            {vps.datacenter && (
              <p className="text-slate-300 text-xs">
                DC: {safeValue(vps.datacenter)}
              </p>
            )}
          </div>
        </div>

        {/* Sistema Operacional e Plano */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">Sistema:</span>
            </div>
            <p className="text-white">{safeValue(vps.os)}</p>
            {vps.template && (
              <p className="text-slate-300 text-xs">
                Template: {safeValue(vps.template)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">Plano:</span>
            </div>
            <p className="text-white">{safeValue(vps.plan)}</p>
            {vps.created_at && (
              <p className="text-slate-300 text-xs">
                Criado: {new Date(vps.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Especificações de Hardware - Dados Reais */}
        <div className="space-y-3 pt-2 border-t border-slate-600">
          <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-400" />
            Especificações de Hardware
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">CPU:</span>
            </div>
            <span className="text-white font-medium">{safeValue(vps.cpus || vps.cpu, '0')} cores</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">RAM:</span>
            </div>
            <span className="text-white font-medium">{formatMemory(safeValue(vps.memory, 0))}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">Disco:</span>
            </div>
            <span className="text-white font-medium">{formatDisk(safeValue(vps.disk, 0))}</span>
          </div>
        </div>

        {/* Métricas de Performance */}
        {metrics && (
          <div className="space-y-3 pt-2 border-t border-slate-600">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Métricas de Performance
              </div>
              <div className="flex items-center gap-2">
                {metrics.isReal ? (
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                    🟢 Tempo Real
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                    🟡 Simulado
                  </Badge>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(metrics.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            {!metrics.isReal && metrics.note && (
              <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                ⚠️ {metrics.note}
              </p>
            )}
            
            {/* CPU Usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-400" />
                  <span className="text-slate-400">CPU</span>
                </div>
                <span className={`font-mono ${getUsageColor(metrics.cpu_usage)}`}>
                  {Math.round(metrics.cpu_usage)}%
                </span>
              </div>
              <Progress 
                value={metrics.cpu_usage} 
                className="h-2"
              />
            </div>
            
            {/* Memory Usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-400" />
                  <span className="text-slate-400">Memória</span>
                </div>
                <span className={`font-mono ${getUsageColor(metrics.memory_usage)}`}>
                  {Math.round(metrics.memory_usage)}%
                </span>
              </div>
              <Progress 
                value={metrics.memory_usage} 
                className="h-2"
              />
            </div>
            
            {/* Disk Usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3 text-purple-400" />
                  <span className="text-slate-400">Disco</span>
                </div>
                <span className={`font-mono ${getUsageColor(metrics.disk_usage)}`}>
                  {Math.round(metrics.disk_usage)}%
                </span>
              </div>
              <Progress 
                value={metrics.disk_usage} 
                className="h-2"
              />
            </div>

            {/* Network Activity */}
            {(metrics.network_in !== undefined || metrics.network_out !== undefined) && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Wifi className="h-3 w-3" />
                  <span>Rede</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">↓ In:</span>
                    <span className="text-green-300 font-mono">
                      {formatNetworkSpeed(metrics.network_in)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">↑ Out:</span>
                    <span className="text-blue-300 font-mono">
                      {formatNetworkSpeed(metrics.network_out)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* System Metrics */}
            {(metrics.uptime !== undefined || metrics.load_average !== undefined || metrics.processes !== undefined) && (
              <div className="space-y-2 pt-2 border-t border-slate-600">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Activity className="h-3 w-3" />
                  <span>Sistema</span>
                </div>
                <div className="space-y-1 text-xs">
                  {metrics.uptime !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Uptime:</span>
                      <span className="text-white font-mono">{formatUptime(metrics.uptime)}</span>
                    </div>
                  )}
                  {metrics.load_average !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Load:</span>
                      <span className="text-white font-mono">{metrics.load_average.toFixed(2)}</span>
                    </div>
                  )}
                  {metrics.processes !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Processos:</span>
                      <span className="text-white font-mono">{metrics.processes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status da Fonte de Dados */}
            <div className="pt-2 border-t border-slate-600">
              <div className="text-xs">
                {metrics.isReal ? (
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    Dados obtidos da API Hostinger em tempo real
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-300">
                    <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                    Dados simulados - Configure agente de monitoramento para dados reais
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Ações - Ícones Discretos */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={onSnapshot}
            disabled={snapshotting || getVpsStatus(vps)?.toLowerCase() !== 'running'}
            className="h-8 w-8 p-0 bg-gray-900 hover:bg-gray-800 text-white border-none"
            title="Criar Snapshot"
          >
            {snapshotting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onRestart}
            disabled={restarting || getVpsStatus(vps)?.toLowerCase() !== 'running'}
            className="h-8 w-8 p-0 bg-gray-900 hover:bg-gray-800 text-white border-none"
            title="Reiniciar VPS"
          >
            {restarting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};