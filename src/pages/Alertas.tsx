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
  
  // Simplified performance items query - broader approach
  const { data: performanceItems = [], isLoading: itemsLoading } = useItems(hostIds, {
    output: ['itemid', 'name', 'key_', 'hostid', 'status', 'value_type', 'units', 'lastvalue', 'lastclock'],
    filter: {
      status: 0 // Only active items
    }
  });

  const getDeviceStatus = (host: any): DeviceStatus => {
    // Análise mais robusta de disponibilidade
    const isHostEnabled = host.status === '0'; // 0 = enabled, 1 = disabled
    
    // Verificar se há interfaces disponíveis
    const hasAvailableInterface = host.interfaces?.some((iface: any) => iface.available === '1');
    
    // Verificar se há problemas ativos relacionados à disponibilidade
    const hasAvailabilityProblems = problems.some((problem: any) => 
      problem.hosts?.some((problemHost: any) => problemHost.hostid === host.hostid) &&
      (problem.name?.toLowerCase().includes('unavailable') || 
       problem.name?.toLowerCase().includes('unreachable') ||
       problem.name?.toLowerCase().includes('indisponível') ||
       problem.severity === '5') // Disaster severity
    );
    
    // Host está online apenas se:
    // 1. Está habilitado no Zabbix
    // 2. Tem pelo menos uma interface disponível 
    // 3. Não tem problemas críticos de disponibilidade ativos
    const isAvailable = isHostEnabled && hasAvailableInterface && !hasAvailabilityProblems;
    
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
    // Use simplified single query approach
    const hostItems = performanceItems.filter(item => item.hostid === hostId);
    
    const hostName = hosts.find(h => h.hostid === hostId)?.name || hostId;
    
    // Debug - log all items for this host
    console.log(`[DEBUG] All items for ${hostName}:`, hostItems.map(item => ({
      name: item.name,
      key: item.key_,
      value: item.lastvalue,
      units: item.units
    })));
    
    // Look for CPU items with proper prioritization
    const cpuItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      
      // High priority items first
      if (key.includes('system.cpu.util') || 
          key.includes('cpu.util') ||
          key === 'system.cpu.load[percpu,avg1]' ||
          name === 'cpu utilization' ||
          name === 'cpu usage') {
        return true;
      }
      
      // Windows performance counters - be more specific
      if (key.includes('perf_counter')) {
        // Exclude problematic DPC and specific cache-related counters
        if (key.includes('dpc') || key.includes('cache') || key.includes('interrupt')) {
          return false;
        }
        // Look for processor time or processor usage
        if ((key.includes('processor') || key.includes('cpu')) && 
            (key.includes('time') || key.includes('%'))) {
          return true;
        }
      }
      
      // Name-based search (more restrictive)
      if (name.includes('cpu') && 
          (name.includes('%') || name.includes('utilization') || name.includes('usage')) &&
          !name.includes('dpc') && !name.includes('cache')) {
        return true;
      }
      
      return false;
    });
    
    // Look for memory items with proper prioritization
    const memoryItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      
      // High priority items first
      if (key.includes('vm.memory.util') ||
          key.includes('vm.memory.size[pused]') ||
          key.includes('vm.memory.size[pavailable]') ||
          name === 'memory utilization' ||
          name === 'available memory') {
        return true;
      }
      
      // Windows performance counters - be more specific
      if (key.includes('perf_counter') && key.includes('memory')) {
        // Exclude cache and other non-memory usage items
        if (key.includes('cache') || key.includes('pool') || key.includes('page')) {
          return false;
        }
        // Look for committed bytes, available bytes, etc.
        if (key.includes('committed') || key.includes('available') || key.includes('%')) {
          return true;
        }
      }
      
      // Name-based search (more restrictive)
      if (name.includes('memory') && 
          (name.includes('%') || name.includes('utilization') || name.includes('usage')) &&
          !name.includes('cache') && !name.includes('pool')) {
        return true;
      }
      
      return false;
    });
    
    // Look for uptime items
    const uptimeItem = hostItems.find(item => {
      const key = item.key_.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      return (
        key.includes('system.uptime') ||
        key.includes('agent.uptime') ||
        key === 'system.uptime[s]' ||
        name.includes('uptime') ||
        name.includes('tempo ligado') ||
        name === 'system uptime'
      );
    });
    
    // Debug - log found items
    console.log(`[DEBUG] Found items for ${hostName}:`, {
      cpu: cpuItem ? { name: cpuItem.name, key: cpuItem.key_, value: cpuItem.lastvalue, units: cpuItem.units } : null,
      memory: memoryItem ? { name: memoryItem.name, key: memoryItem.key_, value: memoryItem.lastvalue, units: memoryItem.units } : null,
      uptime: uptimeItem ? { name: uptimeItem.name, key: uptimeItem.key_, value: uptimeItem.lastvalue, units: uptimeItem.units } : null
    });
    
    // Parse values with proper validation and conversion
    let cpuUsage = 0;
    let memoryUsage = 0;
    let uptime = 0;
    
    if (cpuItem?.lastvalue !== undefined && cpuItem.lastvalue !== null && cpuItem.lastvalue !== '') {
      let value = parseFloat(cpuItem.lastvalue);
      console.log(`[DEBUG] CPU raw value for ${hostName}:`, value, 'from item:', cpuItem.name);
      
      if (!isNaN(value)) {
        // Handle different CPU value formats
        if (cpuItem.key_.includes('system.cpu.load')) {
          // CPU load values are typically 0-1 for 100% utilization per core
          // Convert to percentage
          cpuUsage = Math.min(Math.max(value * 100, 0), 100);
        } else if (cpuItem.key_.includes('perf_counter')) {
          // Windows perfcounter - processor time is typically inverted (idle time)
          if (cpuItem.name?.toLowerCase().includes('idle')) {
            cpuUsage = Math.min(Math.max(100 - value, 0), 100);
          } else {
            cpuUsage = Math.min(Math.max(value, 0), 100);
          }
        } else {
          // Standard CPU utilization (should be 0-100)
          cpuUsage = Math.min(Math.max(value, 0), 100);
        }
        console.log(`[DEBUG] CPU final value for ${hostName}:`, cpuUsage);
      }
    }
    
    if (memoryItem?.lastvalue !== undefined && memoryItem.lastvalue !== null && memoryItem.lastvalue !== '') {
      let value = parseFloat(memoryItem.lastvalue);
      console.log(`[DEBUG] Memory raw value for ${hostName}:`, value, 'from item:', memoryItem.name, 'key:', memoryItem.key_);
      
      if (!isNaN(value)) {
        const key = memoryItem.key_.toLowerCase();
        const name = memoryItem.name?.toLowerCase() || '';
        
        // Check if this is available memory (needs to be inverted)
        const isAvailableMemory = key.includes('pavailable') || 
                                 key.includes('available') || 
                                 name.includes('available') ||
                                 name.includes('free');
        
        // Check if value is in bytes (large values)
        if (value > 100) {
          console.log(`[DEBUG] Large memory value detected (likely bytes): ${value}`);
          
          // For byte values, we need total memory to calculate percentage
          // Try to find total memory item for this host
          const totalMemoryKey = key.replace('[pavailable]', '[total]').replace('[pused]', '[total]');
          const totalMemoryItem = performanceItems.find(item => 
            item.hostid === memoryItem.hostid && 
            item.key_.toLowerCase() === totalMemoryKey
          );
          
          if (totalMemoryItem && totalMemoryItem.lastvalue) {
            const totalMem = parseFloat(totalMemoryItem.lastvalue);
            if (!isNaN(totalMem) && totalMem > 0) {
              let usedMem = value;
              if (isAvailableMemory) {
                usedMem = totalMem - value; // Calculate used = total - available
              }
              value = Math.min(100, Math.max(0, (usedMem / totalMem) * 100));
              console.log(`[DEBUG] Calculated memory percentage: ${usedMem}/${totalMem} = ${value.toFixed(1)}%`);
            } else {
              // Without total memory, cap large values
              console.log(`[DEBUG] No valid total memory found, capping large value`);
              value = 0;
            }
          } else {
            // Fallback: assume very large values are incorrect
            console.log(`[DEBUG] No total memory reference found, assuming large value is error`);
            value = 0;
          }
        } else if (isAvailableMemory && value <= 100) {
          // For available memory percentages, invert to get used memory
          value = 100 - value;
          console.log(`[DEBUG] Inverted available memory: ${100 - (100 - value)}% available → ${value}% used`);
        }
        
        // Ensure value is within valid range
        memoryUsage = Math.min(Math.max(value, 0), 100);
        console.log(`[DEBUG] Memory final value for ${hostName}:`, memoryUsage);
      }
    }
    
    if (uptimeItem?.lastvalue !== undefined && uptimeItem.lastvalue !== null && uptimeItem.lastvalue !== '') {
      const value = parseInt(uptimeItem.lastvalue);
      if (!isNaN(value)) {
        uptime = value;
      }
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