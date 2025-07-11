import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
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
  AlertCircle
} from 'lucide-react';

export const HostingerDashboard = () => {
  const { toast } = useToast();
  const { data: integrations, isLoading: integrationsLoading } = useHostingerIntegrations();
  const { restartVPS, createSnapshot } = useHostingerActions();
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');

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

  const handleRestart = async (vpsId: string) => {
    if (window.confirm('Tem certeza que deseja reiniciar este VPS?')) {
      await restartVPS.mutateAsync({
        integrationId: selectedIntegration,
        vpsId
      });
      setTimeout(() => refetchVPS(), 2000);
    }
  };

  const handleSnapshot = async (vpsId: string, vpsName: string) => {
    const snapshotName = `${vpsName}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {vpsList.map((vps: any) => (
              <VPSCard
                key={vps.id}
                vps={vps}
                integrationId={selectedIntegration}
                onRestart={() => handleRestart(vps.id)}
                onSnapshot={() => handleSnapshot(vps.id, vps.name)}
                restarting={restartVPS.isPending}
                snapshotting={createSnapshot.isPending}
              />
            ))}
          </div>
        )}
      </div>
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
  const { data: metrics } = useHostingerVPSMetrics(integrationId, vps.id);

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

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Server className="h-5 w-5 text-orange-500" />
            {vps.name || vps.id}
          </CardTitle>
          <Badge variant="outline" className={getStatusColor(vps.status)}>
            {vps.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações Básicas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-slate-400" />
              <span className="text-slate-400">IP:</span>
            </div>
            <p className="text-white font-mono text-xs">{vps.ipv4 || 'N/A'}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-slate-400">Região:</span>
            </div>
            <p className="text-white">{vps.region || 'N/A'}</p>
          </div>
        </div>

        {/* Especificações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span className="text-slate-400">CPU:</span>
            </div>
            <span className="text-white">{vps.cpu || 0} cores</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-400" />
              <span className="text-slate-400">RAM:</span>
            </div>
            <span className="text-white">{vps.memory || 0} MB</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-400" />
              <span className="text-slate-400">Disco:</span>
            </div>
            <span className="text-white">{vps.disk || 0} GB</span>
          </div>
        </div>

        {/* Métricas de Uso (se disponíveis) */}
        {metrics && (
          <div className="space-y-3 pt-2 border-t border-slate-600">
            <div className="text-sm font-medium text-slate-300">Utilização</div>
            
            {metrics.cpu_usage !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">CPU</span>
                  <span className="text-white">{metrics.cpu_usage}%</span>
                </div>
                <Progress value={metrics.cpu_usage} className="h-2" />
              </div>
            )}
            
            {metrics.memory_usage !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Memória</span>
                  <span className="text-white">{metrics.memory_usage}%</span>
                </div>
                <Progress value={metrics.memory_usage} className="h-2" />
              </div>
            )}
            
            {metrics.disk_usage !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Disco</span>
                  <span className="text-white">{metrics.disk_usage}%</span>
                </div>
                <Progress value={metrics.disk_usage} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="space-y-2 pt-2 border-t border-slate-600">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span className="text-slate-400">Criado:</span>
            </div>
            <span className="text-slate-300">
              {vps.created_at ? new Date(vps.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          
          {vps.os && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">OS:</span>
              <span className="text-slate-300">{vps.os}</span>
            </div>
          )}
          
          {vps.plan && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Plano:</span>
              <span className="text-slate-300">{vps.plan}</span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onSnapshot}
            disabled={snapshotting || vps.status?.toLowerCase() !== 'running'}
            className="flex-1 bg-blue-600 border-blue-500 text-white hover:bg-blue-500"
          >
            {snapshotting ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-1" />
            )}
            Snapshot
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onRestart}
            disabled={restarting || vps.status?.toLowerCase() !== 'running'}
            className="flex-1 bg-orange-600 border-orange-500 text-white hover:bg-orange-500"
          >
            {restarting ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-1" />
            )}
            Reiniciar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};