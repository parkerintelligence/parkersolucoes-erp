import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { RefreshCw, Wifi, WifiOff, Server, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'problem';
  lastSeen?: string;
  issues?: string[];
}

export default function Alertas() {
  const { useHosts, useProblems } = useZabbixAPI();
  
  const { data: hosts = [], isLoading: hostsLoading, refetch: refetchHosts } = useHosts({}, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const { data: problems = [], isLoading: problemsLoading, refetch: refetchProblems } = useProblems({}, {
    refetchInterval: 30000,
  });

  const getDeviceStatus = (host: any): DeviceStatus => {
    const hostProblems = problems.filter(p => p.hosts?.some(h => h.hostid === host.hostid));
    
    // Check if host is available (status: 0 = monitored, 1 = not monitored)
    const isMonitored = host.status === '0';
    const hasProblems = hostProblems.length > 0;
    
    // Determine status based on availability and problems
    let status: 'online' | 'offline' | 'problem' = 'offline';
    if (isMonitored) {
      status = hasProblems ? 'problem' : 'online';
    }

    return {
      id: host.hostid,
      name: host.name || host.host,
      status,
      lastSeen: host.lastaccess ? new Date(parseInt(host.lastaccess) * 1000).toLocaleString('pt-BR') : undefined,
      issues: hostProblems.map(p => p.name)
    };
  };

  const devices: DeviceStatus[] = hosts.map(getDeviceStatus);
  
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const problemCount = devices.filter(d => d.status === 'problem').length;

  const handleRefresh = () => {
    refetchHosts();
    refetchProblems();
  };

  const getStatusIcon = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      case 'problem':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Server className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'offline':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'problem':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusBadge = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">ONLINE</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">OFFLINE</Badge>;
      case 'problem':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PROBLEMA</Badge>;
      default:
        return <Badge variant="secondary">DESCONHECIDO</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertas Zabbix</h1>
          <p className="text-muted-foreground">Monitor em tempo real do status dos dispositivos</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={hostsLoading || problemsLoading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", (hostsLoading || problemsLoading) && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{devices.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wifi className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{offlineCount}</p>
                <p className="text-xs text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{problemCount}</p>
                <p className="text-xs text-muted-foreground">Problemas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {devices.map((device) => (
          <Card 
            key={device.id} 
            className={cn(
              "transition-all duration-200 hover:shadow-md",
              getStatusColor(device.status)
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {getStatusIcon(device.status)}
                {getStatusBadge(device.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm truncate" title={device.name}>
                  {device.name}
                </h3>
                
                {device.lastSeen && (
                  <p className="text-xs text-muted-foreground">
                    Última atividade: {device.lastSeen}
                  </p>
                )}
                
                {device.issues && device.issues.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Problemas:</p>
                    {device.issues.slice(0, 2).map((issue, index) => (
                      <p key={index} className="text-xs text-muted-foreground truncate" title={issue}>
                        • {issue}
                      </p>
                    ))}
                    {device.issues.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{device.issues.length - 2} mais...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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