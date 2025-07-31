import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { RefreshCw, Wifi, WifiOff, Server, AlertTriangle, Cpu, HardDrive, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

export default function Alertas() {
  const { useHosts, useProblems, useItems } = useZabbixAPI();
  
  const { data: hosts = [], isLoading: hostsLoading, refetch: refetchHosts } = useHosts({}, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const { data: problems = [], isLoading: problemsLoading, refetch: refetchProblems } = useProblems({}, {
    refetchInterval: 30000,
  });

  const hostIds = hosts.map(host => host.hostid);
  const { data: items = [], isLoading: itemsLoading } = useItems(hostIds, {
    search: {
      key_: ['system.cpu.util', 'vm.memory.util', 'system.uptime', 'vfs.fs.size']
    }
  });

  const getDeviceStatus = (host: any): DeviceStatus => {
    // Check if host is available (available: "1" = available, "0" = not available)
    const isAvailable = host.available === '1';
    
    return {
      id: host.hostid,
      name: host.name || host.host,
      status: isAvailable ? 'online' : 'offline',
      lastSeen: host.lastaccess ? new Date(parseInt(host.lastaccess) * 1000).toLocaleString('pt-BR') : undefined,
    };
  };

  const devices: DeviceStatus[] = hosts.map(getDeviceStatus);
  
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  const handleRefresh = () => {
    refetchHosts();
    refetchProblems();
  };

  const getPerformanceData = (hostId: string) => {
    const hostItems = items.filter(item => item.hostid === hostId);
    
    const cpuItem = hostItems.find(item => item.key_.includes('system.cpu.util'));
    const memoryItem = hostItems.find(item => item.key_.includes('vm.memory.util'));
    const uptimeItem = hostItems.find(item => item.key_.includes('system.uptime'));
    
    const cpuUsage = cpuItem?.lastvalue ? parseFloat(cpuItem.lastvalue) : 0;
    const memoryUsage = memoryItem?.lastvalue ? parseFloat(memoryItem.lastvalue) : 0;
    const uptime = uptimeItem?.lastvalue ? parseInt(uptimeItem.lastvalue) : 0;
    
    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      uptime: uptime,
    };
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusIcon = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-400" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-400" />;
      default:
        return <Server className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DeviceStatus['status']) => {
    return 'bg-slate-800 border-slate-700';
  };

  const getStatusBadge = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-900/20 text-green-400 border-green-400/30 hover:bg-green-900/20">ONLINE</Badge>;
      case 'offline':
        return <Badge className="bg-red-900/20 text-red-400 border-red-400/30 hover:bg-red-900/20">OFFLINE</Badge>;
      default:
        return <Badge variant="secondary">DESCONHECIDO</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
          <p className="text-muted-foreground">Monitor em tempo real do status dos dispositivos</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={hostsLoading || problemsLoading || itemsLoading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", (hostsLoading || problemsLoading || itemsLoading) && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-300 mb-1">{devices.length}</div>
            <div className="text-sm text-slate-300 font-medium">Total</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{onlineCount}</div>
            <div className="text-sm text-slate-300 font-medium">Online</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos ativos</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">{offlineCount}</div>
            <div className="text-sm text-slate-300 font-medium">Offline</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos inativos</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Status and Performance */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="status">Status Server</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4">
          {/* Devices Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
            {devices.map((device) => (
              <Card 
                key={device.id} 
                className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  getStatusColor(device.status)
                )}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center space-y-2">
                    {getStatusIcon(device.status)}
                    <h3 className="font-medium text-xs text-center text-white truncate w-full" title={device.name}>
                      {device.name}
                    </h3>
                    {getStatusBadge(device.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          {/* Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {devices
              .filter(device => device.status === 'online')
              .map((device) => {
                const perf = getPerformanceData(device.id);
                return (
                  <Card key={device.id} className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        {device.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* CPU Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-slate-300">CPU</span>
                          </div>
                          <span className="text-sm font-medium text-white">{perf.cpu.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={perf.cpu} 
                          className="h-2"
                          style={{
                            '--progress-foreground': perf.cpu > 80 ? 'hsl(0 70% 50%)' : perf.cpu > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                          } as React.CSSProperties}
                        />
                      </div>

                      {/* Memory Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-purple-400" />
                            <span className="text-sm text-slate-300">Memória</span>
                          </div>
                          <span className="text-sm font-medium text-white">{perf.memory.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={perf.memory} 
                          className="h-2"
                          style={{
                            '--progress-foreground': perf.memory > 80 ? 'hsl(0 70% 50%)' : perf.memory > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                          } as React.CSSProperties}
                        />
                      </div>

                      {/* Uptime */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-slate-300">Tempo Ligado</span>
                          </div>
                          <span className="text-sm font-medium text-white">{formatUptime(perf.uptime)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {devices.filter(device => device.status === 'online').length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Server className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Nenhum dispositivo online</h3>
                  <p className="text-muted-foreground">Dados de performance só são exibidos para dispositivos online.</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {(hostsLoading || problemsLoading) && devices.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Carregando dispositivos...</p>
          </div>
        </div>
      )}

      {!hostsLoading && !problemsLoading && devices.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Server className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Nenhum dispositivo encontrado</h3>
              <p className="text-muted-foreground">Verifique a configuração do Zabbix na página de Administração.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}