import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wifi, 
  Users, 
  Server, 
  Activity,
  AlertTriangle, 
  RefreshCw,
  Router,
  Smartphone,
  Monitor,
  Signal,
  Globe,
  Power,
  Ban,
  Network
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';

const UniFi = () => {
  const { data: integrations } = useIntegrations();
  const unifiIntegration = integrations?.find(int => int.type === 'unifi' && int.is_active);
  
  const [selectedSite, setSelectedSite] = useState('default');
  
  const { 
    useUniFiSites,
    useUniFiDevices, 
    useUniFiClients, 
    useUniFiNetworks,
    useUniFiAlarms,
    useUniFiStats,
    restartDevice,
    toggleClientBlock,
    refreshData 
  } = useUniFiAPI();

  // Fetch data if integration is available
  const { data: sites, isLoading: sitesLoading } = useUniFiSites(unifiIntegration?.id || '');
  const { data: devices, isLoading: devicesLoading } = useUniFiDevices(unifiIntegration?.id || '', selectedSite);
  const { data: clients, isLoading: clientsLoading } = useUniFiClients(unifiIntegration?.id || '', selectedSite);
  const { data: networks, isLoading: networksLoading } = useUniFiNetworks(unifiIntegration?.id || '', selectedSite);
  const { data: alarms, isLoading: alarmsLoading } = useUniFiAlarms(unifiIntegration?.id || '', selectedSite);
  const { data: stats, isLoading: statsLoading } = useUniFiStats(unifiIntegration?.id || '', selectedSite);

  const isLoadingData = sitesLoading || devicesLoading || clientsLoading || networksLoading || alarmsLoading || statsLoading;

  const handleRefresh = () => {
    if (unifiIntegration) {
      refreshData(unifiIntegration.id, selectedSite);
    }
  };

  if (!unifiIntegration) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-orange-500 bg-orange-500/10">
            <Wifi className="h-4 w-4" />
            <AlertDescription className="text-white">
              A integração com UniFi não está configurada. 
              <Button 
                variant="link" 
                className="p-0 ml-2 text-orange-400"
                onClick={() => window.location.href = '/admin'}
              >
                Configure agora
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const sitesList = sites?.data || [];
  const devicesList = devices?.data || [];
  const clientsList = clients?.data || [];
  const networksList = networks?.data || [];
  const alarmsList = alarms?.data || [];

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Controladora UniFi</h1>
              <p className="text-slate-400">Gerenciamento e monitoramento da rede UniFi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-400 border-green-400">
              {isLoadingData ? 'Carregando...' : 'Online'}
            </Badge>
            <Button 
              onClick={handleRefresh}
              disabled={isLoadingData}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Dispositivos Online</CardTitle>
                <Server className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.online_devices || 0}</div>
              <p className="text-xs text-slate-400">de {stats?.total_devices || 0} total</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Clientes Conectados</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.total_clients || 0}</div>
              <p className="text-xs text-slate-400">{stats?.wireless_clients || 0} WiFi • {stats?.wired_clients || 0} Ethernet</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Redes Ativas</CardTitle>
                <Network className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{networksList.filter((n: any) => n.enabled).length}</div>
              <p className="text-xs text-slate-400">de {networksList.length} total</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Alarmes Ativos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{alarmsList.filter((a: any) => !a.archived).length}</div>
              <p className="text-xs text-slate-400">não arquivados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="devices" className="text-white">Dispositivos</TabsTrigger>
            <TabsTrigger value="clients" className="text-white">Clientes</TabsTrigger>
            <TabsTrigger value="networks" className="text-white">Redes</TabsTrigger>
            <TabsTrigger value="alarms" className="text-white">Alarmes</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Dispositivos UniFi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {devicesList.map((device: any) => (
                    <div key={device._id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${device.state === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Router className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">{device.name || device.model}</p>
                          <p className="text-slate-400 text-sm">{device.ip} • {device.model}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={device.state === 1 ? 'default' : 'destructive'}>
                          {device.state === 1 ? 'Online' : 'Offline'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restartDevice.mutate({
                            integrationId: unifiIntegration.id,
                            siteId: selectedSite,
                            deviceId: device.mac
                          })}
                          className="border-slate-600 text-white hover:bg-slate-600"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Conectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientsList.slice(0, 20).map((client: any) => (
                    <div key={client._id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        {client.is_wired ? (
                          <Monitor className="h-5 w-5 text-green-400" />
                        ) : (
                          <Smartphone className="h-5 w-5 text-blue-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">{client.name || client.hostname || 'Dispositivo'}</p>
                          <p className="text-slate-400 text-sm">{client.ip} • {client.mac}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={client.is_wired ? 'default' : 'secondary'}>
                          {client.is_wired ? 'Ethernet' : 'WiFi'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleClientBlock.mutate({
                            integrationId: unifiIntegration.id,
                            siteId: selectedSite,
                            clientId: client.mac,
                            block: true
                          })}
                          className="border-slate-600 text-white hover:bg-slate-600"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="networks" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Redes Configuradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {networksList.map((network: any) => (
                    <div key={network._id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">{network.name}</p>
                          <p className="text-slate-400 text-sm">{network.purpose}</p>
                        </div>
                      </div>
                      <Badge variant={network.enabled ? 'default' : 'secondary'}>
                        {network.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alarms" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alarmes do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alarmsList.slice(0, 20).map((alarm: any) => (
                    <div key={alarm._id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">{alarm.msg}</p>
                          <p className="text-slate-400 text-sm">{new Date(alarm.time * 1000).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge variant={alarm.archived ? 'secondary' : 'destructive'}>
                        {alarm.archived ? 'Arquivado' : 'Ativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UniFi;