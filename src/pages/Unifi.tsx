import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUnifiIntegration } from '@/hooks/useUnifiIntegration';
import { UnifiAdminConfig } from '@/components/UnifiAdminConfig';
import { 
  Wifi, 
  Router, 
  Users, 
  Activity, 
  Settings, 
  Power,
  Shield,
  Network,
  HardDrive,
  Signal,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Unifi = () => {
  const { 
    isConfigured, 
    devices, 
    clients, 
    networks, 
    statistics,
    isLoading,
    refetchAll 
  } = useUnifiIntegration();
  
  const [activeTab, setActiveTab] = useState('dashboard');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getDeviceStatusBadge = (state: number) => {
    return state === 1 ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">Offline</Badge>
    );
  };

  const handleDeviceAction = async (action: string, mac: string) => {
    toast({
      title: "Ação executada",
      description: `${action} executado no dispositivo ${mac}`,
    });
    refetchAll();
  };

  if (!isConfigured) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Wifi className="h-8 w-8" />
              Controladora UNIFI
            </h1>
            <p className="text-slate-600">Configure a integração com a controladora UNIFI primeiro</p>
          </div>
          <UnifiAdminConfig />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Wifi className="h-8 w-8" />
              Controladora UNIFI
            </h1>
            <p className="text-slate-600">Gerenciamento da rede WiFi e dispositivos</p>
          </div>
          <Button onClick={refetchAll} variant="outline">
            Atualizar Dados
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="devices">
              <Router className="h-4 w-4 mr-2" />
              Dispositivos
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="networks">
              <Network className="h-4 w-4 mr-2" />
              Redes
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Router className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{statistics.online_devices}/{statistics.total_devices}</p>
                      <p className="text-slate-600 text-sm">Dispositivos Online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{statistics.total_clients}</p>
                      <p className="text-slate-600 text-sm">Clientes Conectados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <HardDrive className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{formatBytes(statistics.total_bytes)}</p>
                      <p className="text-slate-600 text-sm">Tráfego Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Globe className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{statistics.wan_ip || 'N/A'}</p>
                      <p className="text-slate-600 text-sm">IP WAN</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dispositivos Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uptime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.slice(0, 5).map((device) => (
                      <TableRow key={device.mac}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell>{device.ip}</TableCell>
                        <TableCell>{getDeviceStatusBadge(device.state)}</TableCell>
                        <TableCell>{formatUptime(device.uptime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos da Rede</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>MAC</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.mac}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell className="font-mono text-sm">{device.mac}</TableCell>
                        <TableCell>{device.ip}</TableCell>
                        <TableCell>{device.version}</TableCell>
                        <TableCell>{getDeviceStatusBadge(device.state)}</TableCell>
                        <TableCell>{formatUptime(device.uptime)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeviceAction('Reiniciar', device.mac)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Conectados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hostname</TableHead>
                      <TableHead>MAC</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Rede</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Upload</TableHead>
                      <TableHead>Download</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.mac}>
                        <TableCell className="font-medium">{client.hostname || 'Desconhecido'}</TableCell>
                        <TableCell className="font-mono text-sm">{client.mac}</TableCell>
                        <TableCell>{client.ip}</TableCell>
                        <TableCell>{client.network}</TableCell>
                        <TableCell>
                          <Badge variant={client.is_wired ? "secondary" : "default"}>
                            {client.is_wired ? 'Cabo' : 'WiFi'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatBytes(client.tx_bytes)}</TableCell>
                        <TableCell>{formatBytes(client.rx_bytes)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeviceAction('Bloquear', client.mac)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="networks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Redes WiFi</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Propósito</TableHead>
                      <TableHead>VLAN</TableHead>
                      <TableHead>Subnet</TableHead>
                      <TableHead>DHCP</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {networks.map((network) => (
                      <TableRow key={network._id}>
                        <TableCell className="font-medium">{network.name}</TableCell>
                        <TableCell>{network.purpose}</TableCell>
                        <TableCell>
                          {network.vlan_enabled ? (
                            <Badge variant="default">VLAN {network.vlan}</Badge>
                          ) : (
                            <Badge variant="secondary">Sem VLAN</Badge>
                          )}
                        </TableCell>
                        <TableCell>{network.ip_subnet}</TableCell>
                        <TableCell>
                          <Badge variant={network.dhcpd_enabled ? "default" : "secondary"}>
                            {network.dhcpd_enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Ativa
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <UnifiAdminConfig />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Unifi;