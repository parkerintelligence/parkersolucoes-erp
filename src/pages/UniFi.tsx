
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Router, 
  Users, 
  Activity, 
  Settings, 
  RefreshCw, 
  Power, 
  Signal,
  Globe,
  Shield,
  Smartphone,
  Laptop,
  Monitor
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const UniFi = () => {
  const { data: integrations = [] } = useIntegrations();
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [clients, setClients] = useState([]);
  const [networks, setNetworks] = useState([]);

  const unifiIntegration = integrations.find(integration => 
    integration.type === 'unifi' && integration.is_active
  );

  // Mock data para demonstração
  const mockDevices = [
    {
      id: '1',
      name: 'UniFi Dream Machine',
      model: 'UDM-Pro',
      type: 'gateway',
      status: 'online',
      uptime: '15d 4h 32m',
      clients: 24,
      cpu: 12,
      memory: 45,
      temperature: 42
    },
    {
      id: '2',
      name: 'Access Point Sala',
      model: 'U6-Lite',
      type: 'ap',
      status: 'online',
      uptime: '12d 2h 15m',
      clients: 8,
      cpu: 5,
      memory: 32,
      temperature: 38
    },
    {
      id: '3',
      name: 'Switch Escritório',
      model: 'USW-24-POE',
      type: 'switch',
      status: 'online',
      uptime: '20d 1h 45m',
      clients: 16,
      cpu: 8,
      memory: 28,
      temperature: 35
    }
  ];

  const mockClients = [
    {
      id: '1',
      hostname: 'iPhone-John',
      mac: '00:11:22:33:44:55',
      ip: '192.168.1.100',
      type: 'wireless',
      ap: 'Access Point Sala',
      signal: -45,
      uptime: '2h 30m',
      rx_bytes: '150MB',
      tx_bytes: '89MB'
    },
    {
      id: '2',
      hostname: 'Laptop-Office',
      mac: 'AA:BB:CC:DD:EE:FF',
      ip: '192.168.1.101',
      type: 'wired',
      ap: 'Switch Escritório',
      signal: null,
      uptime: '8h 15m',
      rx_bytes: '2.1GB',
      tx_bytes: '1.8GB'
    }
  ];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'gateway':
        return <Router className="h-5 w-5 text-blue-400" />;
      case 'ap':
        return <Wifi className="h-5 w-5 text-green-400" />;
      case 'switch':
        return <Globe className="h-5 w-5 text-purple-400" />;
      default:
        return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  const getClientIcon = (type: string) => {
    switch (type) {
      case 'wireless':
        return <Smartphone className="h-4 w-4 text-blue-400" />;
      case 'wired':
        return <Laptop className="h-4 w-4 text-green-400" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Online</Badge>;
      case 'offline':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Offline</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">Desconhecido</Badge>;
    }
  };

  const handleRefreshData = async () => {
    if (!unifiIntegration) {
      toast({
        title: "Configuração necessária",
        description: "Configure uma integração UniFi no painel de administração.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Aqui seria feita a chamada real para a API UniFi
      // Por enquanto, usando dados mock
      setDevices(mockDevices);
      setClients(mockClients);
      
      toast({
        title: "✅ Dados atualizados",
        description: "Informações da controladora UniFi foram atualizadas."
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao atualizar",
        description: "Falha ao conectar com a controladora UniFi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!unifiIntegration) {
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
            <h1 className="text-2xl font-bold text-white">UniFi Controller - {unifiIntegration.name}</h1>
            <p className="text-gray-400">Controladora: {unifiIntegration.base_url}</p>
          </div>
          <Button onClick={handleRefreshData} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Router className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{mockDevices.length}</p>
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
                  <p className="text-xl md:text-2xl font-bold text-white">{mockClients.length}</p>
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
                    {mockDevices.filter(d => d.type === 'ap').length}
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
                    {mockDevices.filter(d => d.status === 'online').length}
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
                  {mockDevices.map((device) => (
                    <TableRow key={device.id} className="border-gray-700 hover:bg-gray-800/30">
                      <TableCell className="flex items-center gap-2">
                        {getDeviceIcon(device.type)}
                        <span className="font-medium text-gray-200">{device.name}</span>
                      </TableCell>
                      <TableCell className="text-gray-300">{device.model}</TableCell>
                      <TableCell>{getStatusBadge(device.status)}</TableCell>
                      <TableCell className="text-gray-300">{device.uptime}</TableCell>
                      <TableCell className="text-gray-300">{device.clients}</TableCell>
                      <TableCell className="text-gray-300">{device.cpu}%</TableCell>
                      <TableCell className="text-gray-300">{device.memory}%</TableCell>
                      <TableCell className="text-gray-300">{device.temperature}°C</TableCell>
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
                  {mockClients.map((client) => (
                    <TableRow key={client.id} className="border-gray-700 hover:bg-gray-800/30">
                      <TableCell className="flex items-center gap-2">
                        {getClientIcon(client.type)}
                        <span className="font-medium text-gray-200">{client.hostname}</span>
                      </TableCell>
                      <TableCell className="text-gray-300">{client.ip}</TableCell>
                      <TableCell className="text-gray-300 font-mono text-xs">{client.mac}</TableCell>
                      <TableCell className="text-gray-300">{client.ap}</TableCell>
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
                      <TableCell className="text-gray-300">{client.uptime}</TableCell>
                      <TableCell className="text-gray-300">{client.rx_bytes}</TableCell>
                      <TableCell className="text-gray-300">{client.tx_bytes}</TableCell>
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
