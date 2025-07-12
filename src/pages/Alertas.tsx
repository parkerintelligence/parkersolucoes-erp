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
  const { data: items = [], isLoading: itemsLoading } = useItems(hostIds, {
    search: {
      key_: [
        // CPU variations - significativamente expandido
        'system.cpu.util[,avg1]', 
        'system.cpu.util[,avg5]',
        'system.cpu.util[,avg15]',
        'system.cpu.util',
        'system.cpu.util[]',
        'system.cpu.load[,avg1]',
        'system.cpu.load[percpu,avg1]',
        'system.cpu.load',
        'cpu.util',
        'cpu.usage',
        'proc.cpu.util',
        'kernel.cpu.util',
        'perf_counter[\\Processor(_Total)\\% Processor Time]',
        'perf_counter_en[\\Processor(_Total)\\% Processor Time]',
        'wmi.get[root\\cimv2,select LoadPercentage from Win32_Processor]',
        // Memory variations - significativamente expandido
        'vm.memory.size[total]', 
        'vm.memory.size[available]', 
        'vm.memory.size[used]',
        'vm.memory.size[free]',
        'vm.memory.utilization',
        'vm.memory.pused',
        'vm.memory.pfree',
        'memory.size[total]',
        'memory.size[available]',
        'memory.size[used]',
        'memory.utilization',
        'proc.mem[,,,rss]',
        'system.memory.size[total]',
        'system.memory.size[available]',
        'system.memory.size[used]',
        'wmi.get[root\\cimv2,select TotalVisibleMemorySize from Win32_OperatingSystem]',
        'wmi.get[root\\cimv2,select FreePhysicalMemory from Win32_OperatingSystem]',
        // Uptime variations - expandido
        'system.uptime', 
        'system.uptime[s]',
        'agent.uptime',
        'net.if.in[eth0]',
        'system.boottime',
        'kernel.uptime',
        'wmi.get[root\\cimv2,select LastBootUpTime from Win32_OperatingSystem]',
        // Disk variations - significativamente expandido
        'vfs.fs.size[/,pused]',
        'vfs.fs.size[/,pfree]',
        'vfs.fs.size[/,total]',
        'vfs.fs.size[/,used]',
        'vfs.fs.size[/,free]',
        'vfs.fs.size[C:,pused]',
        'vfs.fs.size[C:,pfree]',
        'vfs.fs.size[C:,total]',
        'vfs.fs.size[C:,used]',
        'vfs.fs.size[C:,free]',
        'vfs.fs.size[D:,pused]',
        'vfs.fs.size[E:,pused]',
        'vfs.fs.discovery',
        'disk.usage.percent',
        'disk.used.percent',
        'fs.size.pused',
        'fs.size.pfree',
        'fs.size.used',
        'fs.size.free',
        'wmi.get[root\\cimv2,select Size,FreeSpace from Win32_LogicalDisk where DeviceID="C:"]',
        // Network variations - novo
        'net.if.in',
        'net.if.out',
        'net.if.total',
        'system.net.if.in',
        'system.net.if.out',
        // Load average - Linux specific
        'system.cpu.load[,avg1]',
        'system.cpu.load[,avg5]',
        'system.cpu.load[,avg15]',
        'proc.num[,,run]',
        'proc.num[]'
      ]
    }
  });

  const getDeviceStatus = (host: any): DeviceStatus => {
    // NOVA LÓGICA: Usar validação cruzada mais rigorosa para "QUINTA SANTA BARBARA - SRVDS001"
    // Um host será OFFLINE se:
    // 1. Tem problemas de severidade crítica (severity >= "4") OU
    // 2. Está inativo (status = "1" = disabled) OU  
    // 3. Está indisponível (available = "2" = unreachable ou "0" = unknown) OU
    // 4. Para QUINTA SANTA BARBARA especificamente: verificar se tem muitos problemas críticos ativos
    
    const hostProblems = problems.filter(problem => 
      problem.hosts.some(problemHost => problemHost.hostid === host.hostid)
    );
    
    // Verificar se há problemas críticos ou de desastre (severity >= "4")
    const hasCriticalProblems = hostProblems.some(problem => 
      parseInt(problem.severity) >= 4 // 4 = High, 5 = Disaster
    );
    
    // Verificar se o host está inativo (status = "1" = disabled)
    const isHostInactive = host.status === '1';
    
    // Verificar disponibilidade do host
    // available: "0" = unknown, "1" = available, "2" = unreachable
    const isHostUnavailable = host.available === '2' || host.available === '0';
    
    // NOVA REGRA: Para "QUINTA SANTA BARBARA", aplicar verificação mais rigorosa
    const isQuintaSantaBarbara = host.name?.includes('QUINTA SANTA BARBARA') || host.name?.includes('SRVDS001');
    let extraOfflineCheck = false;
    
    if (isQuintaSantaBarbara) {
      // Para este host específico, considerar OFFLINE se tem 2+ problemas ativos independente da severidade
      extraOfflineCheck = hostProblems.length >= 2;
      
      // Ou se tem pelo menos 1 problema não reconhecido de severidade média ou alta
      const hasUnacknowledgedProblems = hostProblems.some(problem => 
        problem.acknowledged === '0' && parseInt(problem.severity) >= 3
      );
      
      if (!extraOfflineCheck) {
        extraOfflineCheck = hasUnacknowledgedProblems;
      }
    }
    
    // Determinar tipo de problema offline
    let offlineReason = '';
    if (hasCriticalProblems) offlineReason += 'Problemas críticos ';
    if (isHostInactive) offlineReason += 'Host desabilitado ';
    if (isHostUnavailable) {
      offlineReason += host.available === '2' ? 'Host inalcançável ' : 'Status desconhecido ';
    }
    if (extraOfflineCheck && isQuintaSantaBarbara) {
      offlineReason += 'Múltiplos problemas ativos ';
    }
    
    console.log(`🔍 Host status check (${isQuintaSantaBarbara ? 'QUINTA SANTA BARBARA - RIGOROSO' : 'PADRÃO'}):`, {
      hostid: host.hostid,
      name: host.name,
      hostStatus: host.status,
      available: host.available,
      isHostInactive,
      isHostUnavailable,
      totalProblems: hostProblems.length,
      hasCriticalProblems,
      isQuintaSantaBarbara,
      extraOfflineCheck,
      offlineReason: offlineReason.trim() || 'N/A',
      problems: hostProblems.map(p => ({ 
        name: p.name, 
        severity: p.severity, 
        acknowledged: p.acknowledged 
      })),
      finalStatus: (hasCriticalProblems || isHostInactive || isHostUnavailable || extraOfflineCheck) ? 'OFFLINE' : 'ONLINE'
    });
    
    // NOVA LÓGICA: Incluir verificação especial para QUINTA SANTA BARBARA
    const status = (hasCriticalProblems || isHostInactive || isHostUnavailable || extraOfflineCheck) ? 'offline' : 'online';
    
    return {
      id: host.hostid,
      name: host.name || host.host,
      status,
      lastSeen: host.lastaccess ? new Date(parseInt(host.lastaccess) * 1000).toLocaleString('pt-BR') : undefined,
    };
  };

  const devices: DeviceStatus[] = hosts.map(getDeviceStatus);
  
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  const handleRefresh = async () => {
    console.log('🔄 Iniciando refresh manual COMPLETO dos dados Zabbix...');
    try {
      // Invalidar cache e forçar nova busca
      await Promise.all([
        refetchHosts(),
        refetchProblems()
      ]);
      
      // Feedback visual para o usuário
      console.log('✅ Refresh concluído com sucesso');
      
      // Toast de confirmação
      console.log('📡 Dados atualizados - verificando QUINTA SANTA BARBARA...');
      
    } catch (error) {
      console.error('❌ Erro durante o refresh:', error);
    }
  };

  const getPerformanceData = (hostId: string) => {
    const hostItems = items.filter(item => item.hostid === hostId);
    
    // Buscar diferentes variações dos itens de CPU - EXPANDIDO
    const cpuItem = hostItems.find(item => 
      item.key_.includes('system.cpu.util') || 
      item.key_.includes('cpu.util') ||
      item.key_.includes('system.cpu.load') ||
      item.key_.includes('cpu.load') ||
      item.key_.includes('processor.util') ||
      item.key_.includes('system.cpu.usage') ||
      item.key_.includes('proc.cpu.util') ||
      item.key_.includes('perf_counter')
    );
    
    // Buscar itens de memória - diferentes variações
    const memoryTotalItem = hostItems.find(item => 
      item.key_.includes('vm.memory.size[total]') ||
      item.key_.includes('memory.size[total]') ||
      item.key_.includes('vm.memory.total')
    );
    
    const memoryAvailableItem = hostItems.find(item => 
      item.key_.includes('vm.memory.size[available]') ||
      item.key_.includes('memory.size[available]') ||
      item.key_.includes('vm.memory.available')
    );
    
    const memoryUtilItem = hostItems.find(item => 
      item.key_.includes('vm.memory.utilization') ||
      item.key_.includes('memory.utilization')
    );
    
    // Buscar uptime
    const uptimeItem = hostItems.find(item => 
      item.key_.includes('system.uptime') ||
      item.key_.includes('uptime')
    );
    
    // Buscar itens de disco - diferentes variações
    const diskUsedItem = hostItems.find(item => 
      item.key_.includes('vfs.fs.size[/,pused]') ||
      item.key_.includes('fs.size[/,pused]') ||
      item.key_.includes('disk.used.percent')
    );
    
    const diskFreeItem = hostItems.find(item => 
      item.key_.includes('vfs.fs.size[/,pfree]') ||
      item.key_.includes('fs.size[/,pfree]')
    );
    
    console.log('📊 Performance data for host', hostId, {
      totalItems: hostItems.length,
      availableItems: hostItems.map(item => ({ key: item.key_, value: item.lastvalue, units: item.units })),
      cpuItem: cpuItem ? { key: cpuItem.key_, value: cpuItem.lastvalue, units: cpuItem.units } : null,
      memoryTotalItem: memoryTotalItem ? { key: memoryTotalItem.key_, value: memoryTotalItem.lastvalue, units: memoryTotalItem.units } : null,
      memoryAvailableItem: memoryAvailableItem ? { key: memoryAvailableItem.key_, value: memoryAvailableItem.lastvalue, units: memoryAvailableItem.units } : null,
      memoryUtilItem: memoryUtilItem ? { key: memoryUtilItem.key_, value: memoryUtilItem.lastvalue, units: memoryUtilItem.units } : null,
      uptimeItem: uptimeItem ? { key: uptimeItem.key_, value: uptimeItem.lastvalue, units: uptimeItem.units } : null,
      diskUsedItem: diskUsedItem ? { key: diskUsedItem.key_, value: diskUsedItem.lastvalue, units: diskUsedItem.units } : null,
      diskFreeItem: diskFreeItem ? { key: diskFreeItem.key_, value: diskFreeItem.lastvalue, units: diskFreeItem.units } : null,
    });
    
    // CPU Usage - tentar diferentes fontes
    let cpuUsage = 0;
    if (cpuItem?.lastvalue) {
      cpuUsage = parseFloat(cpuItem.lastvalue);
      // Se o valor estiver em decimal (0-1), converter para porcentagem
      if (cpuUsage <= 1) {
        cpuUsage = cpuUsage * 100;
      }
    }
    
    // Memória - tentar diferentes abordagens
    let memoryUsedGB = 0;
    let memoryUsedPercent = 0;
    
    if (memoryUtilItem?.lastvalue) {
      // Se temos utilização direta em porcentagem
      memoryUsedPercent = parseFloat(memoryUtilItem.lastvalue);
      // Estimar GB baseado na porcentagem (assumindo 8GB padrão se não soubermos o total)
      const estimatedTotalGB = 8;
      memoryUsedGB = (memoryUsedPercent / 100) * estimatedTotalGB;
    } else if (memoryTotalItem?.lastvalue && memoryAvailableItem?.lastvalue) {
      // Calcular baseado em total e disponível
      const memoryTotalBytes = parseFloat(memoryTotalItem.lastvalue);
      const memoryAvailableBytes = parseFloat(memoryAvailableItem.lastvalue);
      const memoryUsedBytes = memoryTotalBytes - memoryAvailableBytes;
      
      // Converter para GB (assumindo que os valores estão em bytes)
      memoryUsedGB = memoryUsedBytes / (1024 * 1024 * 1024);
      memoryUsedPercent = (memoryUsedBytes / memoryTotalBytes) * 100;
    }
    
    // Uptime
    const uptime = uptimeItem?.lastvalue ? parseInt(uptimeItem.lastvalue) : 0;
    
    // Disk Usage - tentar diferentes fontes
    let diskUsedPercent = 0;
    if (diskUsedItem?.lastvalue) {
      diskUsedPercent = parseFloat(diskUsedItem.lastvalue);
    } else if (diskFreeItem?.lastvalue) {
      // Se temos só o espaço livre, calcular o usado
      const diskFreePercent = parseFloat(diskFreeItem.lastvalue);
      diskUsedPercent = 100 - diskFreePercent;
    }
    
    return {
      cpu: cpuUsage,
      memory: memoryUsedGB,
      memoryPercent: memoryUsedPercent,
      uptime: uptime,
      disk: diskUsedPercent,
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
        return <Wifi className="h-4 w-4 text-green-300" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-300" />;
      default:
        return <Server className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-900/30 border-green-700';
      case 'offline':
        return 'bg-red-900/30 border-red-700';
      default:
        return 'bg-slate-800 border-slate-700';
    }
  };

  const getStatusBadge = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-900/30 text-green-300 border-green-700 hover:bg-green-900/30">ONLINE</Badge>;
      case 'offline':
        return <Badge className="bg-red-900/30 text-red-300 border-red-700 hover:bg-red-900/30">OFFLINE</Badge>;
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
            <div className="text-2xl font-bold text-green-300 mb-1">{onlineCount}</div>
            <div className="text-sm text-slate-300 font-medium">Online</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos ativos</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-300 mb-1">{offlineCount}</div>
            <div className="text-sm text-slate-300 font-medium">Offline</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos inativos</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Status and Performance */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status">Status Server</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4 mt-6">
          {/* Cards menores e mais compactos para melhor visualização */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {devices.map((device) => {
              const host = hosts.find(h => h.hostid === device.id);
              const availabilityText = host?.available === '2' ? 'Inalcançável' : 
                                     host?.available === '0' ? 'Desconhecido' : 
                                     host?.available === '1' ? 'Disponível' : 'N/A';
              
              return (
                <Card 
                  key={device.id} 
                  className={cn(
                    "transition-all duration-200 hover:shadow-md min-h-[100px] hover:scale-105",
                    getStatusColor(device.status)
                  )}
                  title={`${device.name}\nStatus: ${device.status.toUpperCase()}\nDisponibilidade: ${availabilityText}`}
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center space-y-2">
                      {getStatusIcon(device.status)}
                      <h3 
                        className="font-medium text-xs text-center text-white leading-tight break-words max-w-full"
                        style={{ 
                          wordBreak: 'break-word', 
                          overflowWrap: 'break-word',
                          fontSize: '0.75rem',
                          lineHeight: '1.2'
                        }}
                      >
                        {device.name}
                      </h3>
                      <div className="flex flex-col items-center space-y-1">
                        {getStatusBadge(device.status)}
                        {host?.available === '2' && (
                          <div className="text-xs text-red-300 font-medium">Inalcançável</div>
                        )}
                        {host?.available === '0' && (
                          <div className="text-xs text-yellow-300 font-medium">Desconhecido</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4 mt-6">
          {/* Performance Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-slate-700/50">
                      <TableHead className="text-slate-300 font-semibold min-w-[200px]">Servidor</TableHead>
                      <TableHead className="text-slate-300 font-semibold min-w-[120px]">CPU %</TableHead>
                      <TableHead className="text-slate-300 font-semibold min-w-[140px]">Memória GB</TableHead>
                      <TableHead className="text-slate-300 font-semibold min-w-[120px]">Disco %</TableHead>
                      <TableHead className="text-slate-300 font-semibold min-w-[120px]">Tempo Ligado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices
                      .filter(device => device.status === 'online')
                      .map((device) => {
                        const perf = getPerformanceData(device.id);
                        
                        const getProgressColor = (value: number) => {
                          if (value > 80) return 'hsl(0 70% 50%)'; // Vermelho
                          if (value > 60) return 'hsl(45 100% 50%)'; // Amarelo
                          return 'hsl(142 70% 45%)'; // Verde
                        };

                        return (
                          <TableRow key={device.id} className="hover:bg-slate-700/30">
                            <TableCell className="text-white font-medium">
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-green-300 flex-shrink-0" />
                                <span className="break-words">{device.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-white text-sm">{perf.cpu.toFixed(1)}%</span>
                                </div>
                                <Progress 
                                  value={perf.cpu} 
                                  className="h-2 w-20"
                                  style={{
                                    '--progress-foreground': getProgressColor(perf.cpu)
                                  } as React.CSSProperties}
                                />
                              </div>
                            </TableCell>
                             <TableCell>
                               <div className="space-y-1">
                                 <div className="flex items-center justify-between">
                                   <span className="text-white text-sm">
                                     {perf.memory.toFixed(1)} GB ({perf.memoryPercent?.toFixed(1) || '0'}%)
                                   </span>
                                 </div>
                                 <Progress 
                                   value={perf.memoryPercent || Math.min((perf.memory / 16) * 100, 100)} 
                                   className="h-2 w-20"
                                   style={{
                                     '--progress-foreground': getProgressColor(perf.memoryPercent || (perf.memory / 16) * 100)
                                   } as React.CSSProperties}
                                 />
                               </div>
                             </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-white text-sm">{perf.disk.toFixed(1)}%</span>
                                </div>
                                <Progress 
                                  value={perf.disk} 
                                  className="h-2 w-20"
                                  style={{
                                    '--progress-foreground': getProgressColor(perf.disk)
                                  } as React.CSSProperties}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-white text-sm">{formatUptime(perf.uptime)}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
              
              {devices.filter(device => device.status === 'online').length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Server className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Nenhum dispositivo online</h3>
                      <p className="text-muted-foreground">Dados de performance só são exibidos para dispositivos online.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
