
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Wifi, 
  Server, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Signal,
  Users,
  Download,
  Upload,
  Zap,
  Thermometer,
  Clock
} from 'lucide-react';

export interface UniFiHealthMetrics {
  subsystem: string;
  status: string;
  num_user: number;
  num_guest: number;
  num_iot: number;
  tx_bytes: number;
  rx_bytes: number;
  num_ap: number;
  num_adopted: number;
  num_disabled: number;
  num_disconnected: number;
  num_pending: number;
  num_gw: number;
  num_sw: number;
  wan_ip: string;
  uptime: number;
}

export interface UniFiEvent {
  _id: string;
  datetime: string;
  msg: string;
  key: string;
  subsystem: string;
  site_id: string;
  is_negative: boolean;
}

interface UniFiMonitoringDashboardProps {
  healthMetrics: UniFiHealthMetrics[];
  events: UniFiEvent[];
  loading?: boolean;
  onRefresh: () => void;
}

export const UniFiMonitoringDashboard: React.FC<UniFiMonitoringDashboardProps> = ({
  healthMetrics,
  events,
  loading = false,
  onRefresh
}) => {
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        onRefresh();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, onRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getHealthStatus = (metrics: UniFiHealthMetrics[]) => {
    const wifiMetrics = metrics.find(m => m.subsystem === 'wifi');
    const wanMetrics = metrics.find(m => m.subsystem === 'wan');
    const wwwMetrics = metrics.find(m => m.subsystem === 'www');
    
    return {
      wifi: wifiMetrics?.status || 'unknown',
      wan: wanMetrics?.status || 'unknown',
      internet: wwwMetrics?.status || 'unknown'
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Online</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Aviso</Badge>;
      case 'error':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Erro</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">Desconhecido</Badge>;
    }
  };

  const wifiMetrics = healthMetrics.find(m => m.subsystem === 'wifi');
  const wanMetrics = healthMetrics.find(m => m.subsystem === 'wan');
  const healthStatus = getHealthStatus(healthMetrics);

  const recentEvents = events.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Status Wi-Fi</p>
                {getStatusBadge(healthStatus.wifi)}
              </div>
              <Wifi className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Status WAN</p>
                {getStatusBadge(healthStatus.wan)}
              </div>
              <Server className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Internet</p>
                {getStatusBadge(healthStatus.internet)}
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Clientes</p>
                <p className="text-2xl font-bold text-white">
                  {wifiMetrics ? (wifiMetrics.num_user + wifiMetrics.num_guest + wifiMetrics.num_iot) : 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Performance */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance da Rede
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`border-gray-600 text-gray-200 hover:bg-gray-700 ${autoRefresh ? 'bg-blue-600' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {wifiMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Download</p>
                      <p className="text-lg font-semibold text-white">
                        {formatBytes(wifiMetrics.rx_bytes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Upload</p>
                      <p className="text-lg font-semibold text-white">
                        {formatBytes(wifiMetrics.tx_bytes)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-400">Usuários</p>
                    <p className="text-xl font-bold text-blue-400">{wifiMetrics.num_user}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Convidados</p>
                    <p className="text-xl font-bold text-orange-400">{wifiMetrics.num_guest}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">IoT</p>
                    <p className="text-xl font-bold text-purple-400">{wifiMetrics.num_iot}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Access Points</span>
                    <span className="text-sm text-white">
                      {wifiMetrics.num_adopted}/{wifiMetrics.num_ap}
                    </span>
                  </div>
                  <Progress 
                    value={(wifiMetrics.num_adopted / wifiMetrics.num_ap) * 100} 
                    className="h-2"
                  />
                </div>

                {wifiMetrics.uptime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Uptime:</span>
                    <span className="text-sm text-white">{formatUptime(wifiMetrics.uptime)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Métricas não disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Eventos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div key={event._id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.is_negative ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white break-words">{event.msg}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(event.datetime).toLocaleString()}
                        </span>
                        <Badge className="bg-gray-600 text-gray-200 text-xs">
                          {event.subsystem}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum evento recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Overview */}
      {wifiMetrics && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5" />
              Status dos Dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Conectados</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{wifiMetrics.num_adopted}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Desconectados</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{wifiMetrics.num_disconnected}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Pendentes</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{wifiMetrics.num_pending}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Desabilitados</span>
                </div>
                <p className="text-2xl font-bold text-gray-400">{wifiMetrics.num_disabled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
