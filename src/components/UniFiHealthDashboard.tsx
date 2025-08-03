import React from 'react';
import { Activity, TrendingUp, TrendingDown, Wifi, Globe, Users, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface UniFiHealthDashboardProps {
  health: any[];
  loading?: boolean;
}

export const UniFiHealthDashboard: React.FC<UniFiHealthDashboardProps> = ({
  health = [],
  loading = false
}) => {
  const getHealthIcon = (subsystem: string) => {
    switch (subsystem.toLowerCase()) {
      case 'wan':
        return <Globe className="h-4 w-4" />;
      case 'lan':
        return <Database className="h-4 w-4" />;
      case 'wlan':
        return <Wifi className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ok':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ok':
        return <Badge variant="default" className="bg-success text-success-foreground">OK</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Aviso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B/s';
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateHealthScore = () => {
    if (health.length === 0) return 0;
    
    const okCount = health.filter(h => h.status === 'ok').length;
    return Math.round((okCount / health.length) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const healthScore = calculateHealthScore();
  const wanHealth = health.find(h => h.subsystem === 'wan');
  const lanHealth = health.find(h => h.subsystem === 'lan');
  const wlanHealth = health.find(h => h.subsystem === 'wlan');

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Score de Saúde da Rede
          </CardTitle>
          <CardDescription>Indicador geral da performance da rede</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Score Geral</span>
                <span className={`text-lg font-bold ${
                  healthScore >= 90 ? 'text-success' : 
                  healthScore >= 70 ? 'text-warning' : 
                  'text-destructive'
                }`}>
                  {healthScore}%
                </span>
              </div>
              <Progress 
                value={healthScore} 
                className="h-3"
              />
            </div>
            <div className="text-center">
              {getStatusBadge(healthScore >= 90 ? 'ok' : healthScore >= 70 ? 'warning' : 'error')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subsistemas Ativos</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.length}</div>
            <p className="text-xs text-muted-foreground">Monitorando performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status OK</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {health.filter(h => h.status === 'ok').length}
            </div>
            <p className="text-xs text-muted-foreground">Funcionando normalmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avisos</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {health.filter(h => h.status === 'warning').length}
            </div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {health.filter(h => h.status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">Precisam de correção</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {health.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getHealthIcon(item.subsystem)}
                  <CardTitle className="text-lg">
                    {item.subsystem.toUpperCase()}
                  </CardTitle>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Latency */}
                {item.latency !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Latência:</span>
                    <span className={`text-sm font-medium ${
                      item.latency < 50 ? 'text-success' : 
                      item.latency < 100 ? 'text-warning' : 
                      'text-destructive'
                    }`}>
                      {item.latency}ms
                    </span>
                  </div>
                )}

                {/* Drops */}
                {item.drops !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Perdas:</span>
                    <span className={`text-sm font-medium ${
                      item.drops === 0 ? 'text-success' : 'text-warning'
                    }`}>
                      {item.drops}%
                    </span>
                  </div>
                )}

                {/* Uptime */}
                {item.uptime !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Uptime:</span>
                    <span className="text-sm font-medium">
                      {formatUptime(item.uptime)}
                    </span>
                  </div>
                )}

                {/* Throughput */}
                {(item.xput_up || item.xput_down) && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Upload:</span>
                      <span className="text-sm font-medium">
                        {formatBytes(item.xput_up || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Download:</span>
                      <span className="text-sm font-medium">
                        {formatBytes(item.xput_down || 0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* User counts */}
                {(item.num_user || item.num_guest || item.num_iot) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-3 w-3" />
                      <span className="text-sm font-medium">Usuários Conectados</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {item.num_user > 0 && (
                        <div className="flex justify-between">
                          <span>Corporativo:</span>
                          <span>{item.num_user}</span>
                        </div>
                      )}
                      {item.num_guest > 0 && (
                        <div className="flex justify-between">
                          <span>Visitantes:</span>
                          <span>{item.num_guest}</span>
                        </div>
                      )}
                      {item.num_iot > 0 && (
                        <div className="flex justify-between">
                          <span>IoT:</span>
                          <span>{item.num_iot}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No data message */}
      {health.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              <p>Dados de saúde não disponíveis</p>
              <p className="text-sm">Verifique a conexão com o controlador</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};