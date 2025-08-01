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
  
  // Query for all performance-related items at once with broader search
  const { data: performanceItems = [], isLoading: itemsLoading } = useItems(hostIds, {
    output: ['itemid', 'name', 'key_', 'hostid', 'status', 'value_type', 'units', 'lastvalue', 'lastclock'],
    filter: {
      status: 0 // Only active items
    },
    search: {
      name: ['CPU', 'Memory', 'Uptime', 'Processador', 'Memória', 'Tempo']
    }
  });

  // Also try specific key patterns
  const { data: systemItems = [] } = useItems(hostIds, {
    output: ['itemid', 'name', 'key_', 'hostid', 'status', 'value_type', 'units', 'lastvalue', 'lastclock'],
    filter: {
      status: 0
    }
  });

  const getDeviceStatus = (host: any): DeviceStatus => {
    // Check if host is available based on interface availability
    // available: "1" = available, "2" = not available, "0" = unknown
    // Also check if host status is enabled (status: "0" = enabled, "1" = disabled)
    const isHostEnabled = host.status === '0';
    const hasAvailableInterface = host.interfaces?.some((iface: any) => iface.available === '1');
    const isAvailable = isHostEnabled && hasAvailableInterface;
    
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
    // Combine all items for this host
    const allItems = [...performanceItems, ...systemItems];
    const hostItems = allItems.filter(item => item.hostid === hostId);
    
    const hostName = hosts.find(h => h.hostid === hostId)?.name || hostId;
    console.log(`Performance data for host ${hostId} (${hostName}):`, hostItems);
    
    // Log all available items to understand what we have
    if (hostItems.length > 0) {
      console.log('Available items for', hostName, ':', hostItems.map(item => ({
        name: item.name,
        key: item.key_,
        lastvalue: item.lastvalue,
        units: item.units
      })));
    }
    
    // Look for CPU items - more flexible search
    const cpuItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      return (
        key.includes('cpu.util') ||
        key.includes('processor') ||
        name.includes('cpu') ||
        name.includes('processador') ||
        name.includes('processor time')
      );
    });
    
    // Look for memory items - more flexible search  
    const memoryItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      return (
        key.includes('memory.util') ||
        key.includes('mem.util') ||
        key.includes('vm.memory') ||
        name.includes('memory') ||
        name.includes('memória') ||
        name.includes('memoria') ||
        name.includes('% memory') ||
        (name.includes('committed bytes') && name.includes('use'))
      );
    });
    
    // Look for uptime items - more flexible search
    const uptimeItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      return (
        key.includes('uptime') ||
        key.includes('system.uptime') ||
        name.includes('uptime') ||
        name.includes('tempo ligado') ||
        name.includes('system up time')
      );
    });
    
    console.log(`Host ${hostName} - Found items:`, {
      cpu: cpuItem ? { name: cpuItem.name, key: cpuItem.key_, value: cpuItem.lastvalue } : null,
      memory: memoryItem ? { name: memoryItem.name, key: memoryItem.key_, value: memoryItem.lastvalue } : null,
      uptime: uptimeItem ? { name: uptimeItem.name, key: uptimeItem.key_, value: uptimeItem.lastvalue } : null
    });
    
    // Parse values with better error handling
    let cpuUsage = 0;
    let memoryUsage = 0;
    let uptime = 0;
    
    if (cpuItem?.lastvalue) {
      const value = parseFloat(cpuItem.lastvalue);
      // Some CPU values might be in decimals (0.xx), convert to percentage
      cpuUsage = value > 1 ? value : value * 100;
    }
    
    if (memoryItem?.lastvalue) {
      const value = parseFloat(memoryItem.lastvalue);
      // Memory is usually already in percentage
      memoryUsage = value > 1 ? value : value * 100;
    }
    
    if (uptimeItem?.lastvalue) {
      uptime = parseInt(uptimeItem.lastvalue);
    }
    
    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      uptime: uptime,
      hasData: !!(cpuItem || memoryItem || uptimeItem),
      itemsFound: {
        cpu: !!cpuItem,
        memory: !!memoryItem,
        uptime: !!uptimeItem,
        total: hostItems.length
      }
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
                       {/* Data availability indicator */}
                       {!perf.hasData && (
                         <div className="text-center py-4">
                           <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                           <p className="text-sm text-muted-foreground">Dados de performance não disponíveis</p>
                           <p className="text-xs text-muted-foreground mt-1">
                             Items encontrados: {perf.itemsFound?.total || 0}
                           </p>
                         </div>
                       )}

                       {perf.hasData && (
                         <>
                           {/* CPU Usage */}
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <Cpu className={cn("h-4 w-4", perf.itemsFound?.cpu ? "text-blue-400" : "text-gray-500")} />
                                 <span className="text-sm text-slate-300">CPU</span>
                                 {!perf.itemsFound?.cpu && <span className="text-xs text-red-400">N/A</span>}
                               </div>
                               <span className="text-sm font-medium text-white">
                                 {perf.itemsFound?.cpu ? `${perf.cpu.toFixed(1)}%` : '--'}
                               </span>
                             </div>
                             {perf.itemsFound?.cpu && (
                               <Progress 
                                 value={perf.cpu} 
                                 className="h-2"
                                 style={{
                                   '--progress-foreground': perf.cpu > 80 ? 'hsl(0 70% 50%)' : perf.cpu > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                                 } as React.CSSProperties}
                               />
                             )}
                           </div>

                           {/* Memory Usage */}
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <HardDrive className={cn("h-4 w-4", perf.itemsFound?.memory ? "text-purple-400" : "text-gray-500")} />
                                 <span className="text-sm text-slate-300">Memória</span>
                                 {!perf.itemsFound?.memory && <span className="text-xs text-red-400">N/A</span>}
                               </div>
                               <span className="text-sm font-medium text-white">
                                 {perf.itemsFound?.memory ? `${perf.memory.toFixed(1)}%` : '--'}
                               </span>
                             </div>
                             {perf.itemsFound?.memory && (
                               <Progress 
                                 value={perf.memory} 
                                 className="h-2"
                                 style={{
                                   '--progress-foreground': perf.memory > 80 ? 'hsl(0 70% 50%)' : perf.memory > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                                 } as React.CSSProperties}
                               />
                             )}
                           </div>

                           {/* Uptime */}
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <Clock className={cn("h-4 w-4", perf.itemsFound?.uptime ? "text-green-400" : "text-gray-500")} />
                                 <span className="text-sm text-slate-300">Tempo Ligado</span>
                                 {!perf.itemsFound?.uptime && <span className="text-xs text-red-400">N/A</span>}
                               </div>
                               <span className="text-sm font-medium text-white">
                                 {perf.itemsFound?.uptime ? formatUptime(perf.uptime) : '--'}
                               </span>
                             </div>
                           </div>
                         </>
                       )}
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