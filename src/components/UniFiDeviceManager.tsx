
import * as React from 'react';
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
        return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (state: number, adopted: boolean) => {
    if (!adopted) {
      return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Não Adotado</Badge>;
    }
    return state === 1 ? 
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
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Router className="h-5 w-5" />
            Gerenciamento de Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-400">Carregando dispositivos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Router className="h-5 w-5" />
          Gerenciamento de Dispositivos ({devices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Router className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dispositivo encontrado</p>
            <p className="text-sm">Selecione um site para ver os dispositivos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300">Dispositivo</TableHead>
                  <TableHead className="text-gray-300">Modelo</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">IP</TableHead>
                  <TableHead className="text-gray-300">Versão</TableHead>
                  <TableHead className="text-gray-300">Uptime</TableHead>
                  <TableHead className="text-gray-300">Clientes</TableHead>
                  <TableHead className="text-gray-300">CPU</TableHead>
                  <TableHead className="text-gray-300">Memória</TableHead>
                  <TableHead className="text-gray-300">Temp</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device._id} className="border-gray-700 hover:bg-gray-800/30">
                    <TableCell className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <span className="font-medium text-gray-200">{device.name}</span>
                    </TableCell>
                    <TableCell className="text-gray-300">{device.model}</TableCell>
                    <TableCell>{getStatusBadge(device.state, device.adopted)}</TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">{device.ip}</TableCell>
                    <TableCell className="text-gray-300">{device.version}</TableCell>
                    <TableCell className="text-gray-300">{formatUptime(device.uptime)}</TableCell>
                    <TableCell className="text-gray-300">{device.num_sta}</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {device['sys-stats']?.cpu || 0}%
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {device['sys-stats']?.mem || 0}%
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
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
                          disabled={restartLoading || device.state !== 1}
                          className="border-gray-600 text-gray-200 hover:bg-gray-700"
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
