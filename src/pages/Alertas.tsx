import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { RefreshCw, Wifi, WifiOff, Server, AlertTriangle, Cpu, HardDrive, Clock, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

export default function Alertas() {
  const [sortColumn, setSortColumn] = React.useState<'device' | 'cpu' | 'memory' | 'uptime'>('device');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
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
    switch (status) {
      case 'online':
        return 'bg-green-500/30 border-green-500/40';
      case 'offline':
        return 'bg-red-500/30 border-red-500/40';
      default:
        return 'bg-slate-800 border-slate-700';
    }
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
    <div className="container mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Alertas Zabbix</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
              {onlineCount} online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
              {offlineCount} offline
            </span>
            <span className="text-muted-foreground/60">/ {devices.length} total</span>
          </div>
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

      {/* Tabs */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
            {devices
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((device) => {
                const perf = device.status === 'online' ? getPerformanceData(device.id) : null;
                const isOnline = device.status === 'online';
                return (
                  <div 
                    key={device.id} 
                    className={cn(
                      "rounded-lg px-3 py-3 border transition-all text-center",
                      isOnline 
                        ? "bg-green-950 border-green-500/30 hover:border-green-500/50" 
                        : "bg-red-950 border-red-500/30 hover:border-red-500/50"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      {isOnline 
                        ? <Wifi className="h-4 w-4 text-green-400" /> 
                        : <WifiOff className="h-4 w-4 text-red-400" />
                      }
                    </div>
                    <p className="text-xs font-medium text-foreground truncate leading-tight" title={device.name}>
                      {device.name}
                    </p>
                    <Badge className={cn(
                      "mt-1.5 text-[10px] px-1.5 py-0",
                      isOnline 
                        ? "bg-green-900/50 text-green-400 border-green-500/30 hover:bg-green-900/50" 
                        : "bg-red-900/50 text-red-400 border-red-500/30 hover:bg-red-900/50"
                    )}>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                    {isOnline && perf?.itemsFound?.uptime && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-0.5" />
                        {formatUptime(perf.uptime)}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card className="border-border/50 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  {([
                    { key: 'device' as const, icon: Server, label: 'Device' },
                    { key: 'cpu' as const, icon: Cpu, label: 'CPU' },
                    { key: 'memory' as const, icon: HardDrive, label: 'Memória' },
                    { key: 'uptime' as const, icon: Clock, label: 'Uptime' },
                  ]).map(col => {
                    const isSorted = sortColumn === col.key;
                    const SortIcon = isSorted ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <TableHead
                        key={col.key}
                        className="text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => {
                          if (sortColumn === col.key) {
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortColumn(col.key);
                            setSortDirection(col.key === 'device' ? 'asc' : 'desc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <col.icon className="h-4 w-4" />
                          {col.label}
                          <SortIcon className={cn("h-3 w-3", isSorted ? "text-foreground" : "text-muted-foreground/40")} />
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices
                  .filter(device => device.status === 'online')
                  .map((device) => {
                    const perf = getPerformanceData(device.id);
                    return { device, perf };
                  })
                  .sort((a, b) => {
                    let valA: number | string, valB: number | string;
                    switch (sortColumn) {
                      case 'device': valA = a.device.name.toLowerCase(); valB = b.device.name.toLowerCase(); break;
                      case 'cpu': valA = a.perf.cpu; valB = b.perf.cpu; break;
                      case 'memory': valA = a.perf.memory; valB = b.perf.memory; break;
                      case 'uptime': valA = a.perf.uptime; valB = b.perf.uptime; break;
                      default: valA = 0; valB = 0;
                    }
                    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
                    return sortDirection === 'asc' ? cmp : -cmp;
                  })
                  .map(({ device, perf }) => (
                    <TableRow key={device.id} className="border-border/30 hover:bg-muted/30">
                      <TableCell className="py-2.5 text-sm font-medium text-foreground">
                        {device.name}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {perf.itemsFound?.cpu ? (
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={perf.cpu} 
                              className="h-2 w-20"
                              style={{
                                '--progress-foreground': perf.cpu > 80 ? 'hsl(0 70% 50%)' : perf.cpu > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                              } as React.CSSProperties}
                            />
                            <span className="text-xs text-muted-foreground w-10">{perf.cpu.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {perf.itemsFound?.memory ? (
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={perf.memory} 
                              className="h-2 w-20"
                              style={{
                                '--progress-foreground': perf.memory > 80 ? 'hsl(0 70% 50%)' : perf.memory > 60 ? 'hsl(45 100% 50%)' : 'hsl(142 70% 45%)'
                              } as React.CSSProperties}
                            />
                            <span className="text-xs text-muted-foreground w-10">{perf.memory.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-xs text-muted-foreground">
                          {perf.itemsFound?.uptime ? formatUptime(perf.uptime) : 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>

          {devices.filter(d => d.status === 'online').length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Server className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhum dispositivo online</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {(hostsLoading || problemsLoading) && devices.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hostsLoading && !problemsLoading && devices.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Server className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum dispositivo encontrado. Verifique a configuração do Zabbix.</p>
          </div>
        </div>
      )}
    </div>
  );
}