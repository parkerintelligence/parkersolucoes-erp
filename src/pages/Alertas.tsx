import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    
    // Look for CPU items with expanded patterns
    const cpuItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      return (
        key.includes('cpu.util') ||
        key.includes('processor') ||
        key.includes('system.cpu') ||
        name.includes('cpu') ||
        name.includes('processador') ||
        name.includes('processor time') ||
        name.includes('processor usage')
      );
    });
    
    // Look for memory items with expanded patterns
    const memoryItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      return (
        key.includes('memory.util') ||
        key.includes('mem.util') ||
        key.includes('vm.memory.util') ||
        key.includes('vm.memory.size[pused]') ||
        name.includes('memory utilization') ||
        name.includes('memória') ||
        name.includes('memory usage') ||
        (name.includes('% memory') || name.includes('memory %')) ||
        (name.includes('committed bytes') && name.includes('use'))
      );
    });
    
    // Look for uptime items
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
    
    // Parse and normalize values
    let cpuUsage = 0;
    let memoryUsage = 0;
    let uptime = 0;
    
    if (cpuItem?.lastvalue) {
      const value = parseFloat(cpuItem.lastvalue);
      if (!isNaN(value)) {
        // Normalize CPU value to percentage (0-100)
        if (value > 100) {
          // If value is extremely high, it might be in different units
          cpuUsage = Math.min(value / 1000000, 100); // Convert from microseconds or similar
        } else if (value <= 1) {
          // Convert decimal to percentage
          cpuUsage = value * 100;
        } else {
          cpuUsage = Math.min(value, 100);
        }
      }
    }
    
    if (memoryItem?.lastvalue) {
      const value = parseFloat(memoryItem.lastvalue);
      if (!isNaN(value)) {
        // Normalize memory value to percentage (0-100)
        if (value > 100) {
          // If value is in bytes or extremely large, try to normalize
          if (value > 1000000) {
            // Likely bytes, try to get a reasonable percentage
            memoryUsage = Math.min((value % 100), 100);
          } else {
            memoryUsage = Math.min(value / 10, 100);
          }
        } else if (value <= 1) {
          // Convert decimal to percentage
          memoryUsage = value * 100;
        } else {
          memoryUsage = Math.min(value, 100);
        }
      }
    }
    
    if (uptimeItem?.lastvalue) {
      const value = parseInt(uptimeItem.lastvalue);
      if (!isNaN(value)) {
        uptime = value;
      }
    }
    
    // Debug logging for problematic values
    if ((cpuUsage > 100 || memoryUsage > 100) && (cpuItem || memoryItem)) {
      console.warn(`Abnormal values for ${hostName}:`, {
        cpu: cpuItem ? { value: cpuItem.lastvalue, normalized: cpuUsage } : null,
        memory: memoryItem ? { value: memoryItem.lastvalue, normalized: memoryUsage } : null
      });
    }
    
    return {
      cpu: Math.min(Math.max(cpuUsage, 0), 100), // Clamp between 0-100
      memory: Math.min(Math.max(memoryUsage, 0), 100), // Clamp between 0-100
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {devices.map((device) => {
              const perf = device.status === 'online' ? getPerformanceData(device.id) : null;
              return (
                <Card 
                  key={device.id} 
                  className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    getStatusColor(device.status)
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-3">
                      {getStatusIcon(device.status)}
                      <h3 className="font-medium text-xs text-center text-white break-words w-full" title={device.name}>
                        {device.name}
                      </h3>
                      {getStatusBadge(device.status)}
                      {device.status === 'online' && perf?.itemsFound?.uptime && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatUptime(perf.uptime)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          {/* Performance Table */}
          <Card className="bg-slate-800 border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Device
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      CPU
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Memória
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Uptime
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices
                  .filter(device => device.status === 'online')
                  .map((device) => {
                    const perf = getPerformanceData(device.id);
                    return { device, perf };
                  })
                  .sort((a, b) => b.perf.uptime - a.perf.uptime) // Sort by uptime descending
                  .map(({ device, perf }) => (
                    <TableRow key={device.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-blue-400" />
                          {device.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(device.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">
                              {perf.itemsFound?.cpu ? `${perf.cpu.toFixed(1)}%` : (
                                <span className="text-red-400">N/A</span>
                              )}
                            </span>
                          </div>
                          {perf.itemsFound?.cpu && (
                            <Progress 
                              value={perf.cpu} 
                              className="h-2 w-24"
                              style={{
                                '--progress-foreground': perf.cpu > 80 ? 'hsl(0 70% 50%)' : perf.cpu > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                              } as React.CSSProperties}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">
                              {perf.itemsFound?.memory ? `${perf.memory.toFixed(1)}%` : (
                                <span className="text-red-400">N/A</span>
                              )}
                            </span>
                          </div>
                          {perf.itemsFound?.memory && (
                            <Progress 
                              value={perf.memory} 
                              className="h-2 w-24"
                              style={{
                                '--progress-foreground': perf.memory > 80 ? 'hsl(0 70% 50%)' : perf.memory > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                              } as React.CSSProperties}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-300">
                          {perf.itemsFound?.uptime ? formatUptime(perf.uptime) : (
                            <span className="text-red-400">N/A</span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>

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