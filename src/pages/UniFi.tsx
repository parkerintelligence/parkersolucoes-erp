import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Router, 
  Users, 
  Activity, 
  Settings, 
  RefreshCw, 
  Signal,
  Globe,
  Smartphone,
  Laptop,
  Monitor,
  Zap,
  Thermometer,
  Cpu,
  HardDrive,
  TestTube
} from 'lucide-react';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';

const UniFi = () => {
  const {
    devices,
    clients,
    systemInfo,
    integration,
    isLoading,
    testConnection,
    testConnectionLoading,
    refreshAllData,
    isConnected,
    connectionUrl
  } = useUniFiAPI();

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'udm':
      case 'ugw':
        return <Router className="h-5 w-5 text-blue-400" />;
      case 'uap':
        return <Wifi className="h-5 w-5 text-green-400" />;
      case 'usw':
        return <Globe className="h-5 w-5 text-purple-400" />;
      default:
        return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  const getClientIcon = (isWired: boolean) => {
    return isWired ? 
      <Laptop className="h-4 w-4 text-green-400" /> : 
      <Smartphone className="h-4 w-4 text-blue-400" />;
  };

  const getStatusBadge = (state: number) => {
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="space-y-6 p-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <Wifi className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma Controladora UniFi Configurada
                </h3>
                <p className="text-gray-400 mb-4">
                  Configure uma integração UniFi na seção de Administração para gerenciar sua rede.
                </p>
                <Button onClick={() => window.location.href = '/admin'} className="bg-blue-600 hover:bg-blue-700">
                  Configurar UniFi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">UniFi Controller - {integration?.name}</h1>
            <p className="text-gray-400">Controladora: {connectionUrl}</p>
            {systemInfo && (
              <p className="text-sm text-gray-500">
                Versão: {systemInfo.version} | Uptime: {formatUptime(systemInfo.uptime)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={testConnection}
              disabled={testConnectionLoading}
              variant="outline"
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              <TestTube className={`h-4 w-4 mr-2 ${testConnectionLoading ? 'animate-spin' : ''}`} />
              Testar Conexão
            </Button>
            <Button 
              onClick={refreshAllData} 
              disabled={isLoading} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Router className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{devices.length}</p>
                  <p className="text-xs md:text-sm text-gray-400">Dispositivos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{clients.length}</p>
                  <p className="text-xs md:text-sm text-gray-400">Clientes Conectados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Wifi className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {devices.filter(d => d.type === 'uap').length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">Access Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Activity className="h-6 w-6 md:h-8 md:w-8 text-orange-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {devices.filter(d => d.state === 1).length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">Dispositivos Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Router className="h-5 w-5" />
              Dispositivos UniFi
            </CardTitle>
            <CardDescription className="text-gray-400">
              Lista de dispositivos gerenciados pela controladora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300">Dispositivo</TableHead>
                    <TableHead className="text-gray-300">Modelo</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Uptime</TableHead>
                    <TableHead className="text-gray-300">Clientes</TableHead>
                    <TableHead className="text-gray-300">CPU</TableHead>
                    <TableHead className="text-gray-300">Memória</TableHead>
                    <TableHead className="text-gray-300">Temp</TableHead>
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
                      <TableCell>{getStatusBadge(device.state)}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clientes Conectados
            </CardTitle>
            <CardDescription className="text-gray-400">
              Dispositivos conectados à rede
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300">Cliente</TableHead>
                    <TableHead className="text-gray-300">IP</TableHead>
                    <TableHead className="text-gray-300">MAC</TableHead>
                    <TableHead className="text-gray-300">Conexão</TableHead>
                    <TableHead className="text-gray-300">Sinal</TableHead>
                    <TableHead className="text-gray-300">Uptime</TableHead>
                    <TableHead className="text-gray-300">Download</TableHead>
                    <TableHead className="text-gray-300">Upload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client._id} className="border-gray-700 hover:bg-gray-800/30">
                      <TableCell className="flex items-center gap-2">
                        {getClientIcon(client.is_wired)}
                        <span className="font-medium text-gray-200">
                          {client.hostname || 'Cliente Desconhecido'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">{client.ip}</TableCell>
                      <TableCell className="text-gray-300 font-mono text-xs">{client.mac}</TableCell>
                      <TableCell className="text-gray-300">
                        <Badge className={client.is_wired ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-blue-900/20 text-blue-400 border-blue-600'}>
                          {client.is_wired ? 'Cabeada' : 'Wireless'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {client.signal ? (
                          <div className="flex items-center gap-1">
                            <Signal className="h-4 w-4" />
                            {client.signal}dBm
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">{formatUptime(client.uptime)}</TableCell>
                      <TableCell className="text-gray-300">{formatBytes(client.rx_bytes)}</TableCell>
                      <TableCell className="text-gray-300">{formatBytes(client.tx_bytes)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UniFi;
