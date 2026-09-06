
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Router, 
  Wifi, 
  Globe, 
  Settings, 
  Power,
  Activity,
  Thermometer,
  Cpu,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { UniFiDevice } from '@/hooks/useUniFiAPI';

interface UniFiDeviceManagerProps {
  devices: UniFiDevice[];
  loading?: boolean;
  onRestartDevice: (siteId: string, deviceId: string) => void;
  restartLoading?: boolean;
  selectedSiteId?: string;
}

export const UniFiDeviceManager: React.FC<UniFiDeviceManagerProps> = ({
  devices,
  loading = false,
  onRestartDevice,
  restartLoading = false,
  selectedSiteId
}) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'udm':
      case 'ugw':
      case 'uxg':
        return <Router className="h-5 w-5 text-blue-400" />;
      case 'uap':
        return <Wifi className="h-5 w-5 text-green-400" />;
      case 'usw':
        return <Globe className="h-5 w-5 text-purple-400" />;
      default:
        return <Settings className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, adopted: boolean) => {
    if (!adopted) {
      return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Não Adotado</Badge>;
    }
    return status === 'online' ? 
      <Badge className="bg-green-900/20 text-green-400 border-green-600">Online</Badge> :
      <Badge className="bg-red-900/20 text-red-400 border-red-600">Offline</Badge>;
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

  const handleRestartDevice = (deviceId: string) => {
    if (selectedSiteId) {
      onRestartDevice(selectedSiteId, deviceId);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Router className="h-5 w-5" />
            Gerenciamento de Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-muted-foreground">Carregando dispositivos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Router className="h-5 w-5" />
          Gerenciamento de Dispositivos ({devices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Router className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dispositivo encontrado</p>
            <p className="text-sm">Selecione um site para ver os dispositivos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-card/50">
                  <TableHead className="text-muted-foreground">Dispositivo</TableHead>
                  <TableHead className="text-muted-foreground">Modelo</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">IP</TableHead>
                  <TableHead className="text-muted-foreground">Versão</TableHead>
                  <TableHead className="text-muted-foreground">Uptime</TableHead>
                  <TableHead className="text-muted-foreground">Clientes</TableHead>
                  <TableHead className="text-muted-foreground">CPU</TableHead>
                  <TableHead className="text-muted-foreground">Memória</TableHead>
                  <TableHead className="text-muted-foreground">Temp</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} className="border-border hover:bg-card/30">
                    <TableCell className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <span className="font-medium text-foreground">{device.displayName || device.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{device.model}</TableCell>
                    <TableCell>{getStatusBadge(device.status, device.adopted)}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{device.ip}</TableCell>
                    <TableCell className="text-muted-foreground">{device.version}</TableCell>
                    <TableCell className="text-muted-foreground">{device.uptime ? formatUptime(device.uptime) : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{device.connectedClients || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {device['sys-stats']?.cpu || 0}%
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {device['sys-stats']?.mem || 0}%
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3" />
                        {device['sys-stats']?.['system-temp'] || 0}°C
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestartDevice(device.mac)}
                          disabled={restartLoading || device.status !== 'online'}
                          className="border-border text-foreground hover:bg-secondary"
                        >
                          <Power className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
