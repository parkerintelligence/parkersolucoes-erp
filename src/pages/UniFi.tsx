import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wifi, 
  Router, 
  Users, 
  Activity, 
  RefreshCw, 
  TestTube,
  Server,
  Network,
  Settings,
  AlertTriangle,
  Monitor,
  Shield,
  Database,
  BarChart3,
  Gauge
} from 'lucide-react';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { UniFiSiteSelector } from '@/components/UniFiSiteSelector';
import { UniFiDeviceManager } from '@/components/UniFiDeviceManager';
import { UniFiClientManager } from '@/components/UniFiClientManager';
import { UniFiNetworkManager } from '@/components/UniFiNetworkManager';
import { UniFiMonitoringDashboard } from '@/components/UniFiMonitoringDashboard';
import { UniFiAdvancedDeviceManager } from '@/components/UniFiAdvancedDeviceManager';

const UniFi = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  const {
    sites,
    devices,
    clients,
    networks,
    healthMetrics,
    events,
    systemInfo,
    integration,
    isLoading,
    sitesLoading,
    networksLoading,
    healthMetricsLoading,
    eventsLoading,
    testConnection,
    testConnectionLoading,
    restartDevice,
    restartDeviceLoading,
    blockClient,
    blockClientLoading,
    createNetwork,
    updateNetwork,
    deleteNetwork,
    locateDevice,
    setDeviceLED,
    updateDeviceSettings,
    setClientAlias,
    disconnectClient,
    refreshAllData,
    refreshAdvancedData,
    isConnected,
    connectionUrl
  } = useUniFiAPI(selectedSiteId);

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

  const selectedDevice = devices.find(d => d.mac === selectedDeviceId);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="space-y-6 p-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <Server className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma Controladora UniFi Configurada
                </h3>
                <p className="text-gray-400 mb-4">
                  Configure uma integração com sua Controladora UniFi para acessar e gerenciar seus dispositivos de rede.
                </p>
                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-medium text-blue-400 mb-1">Configurações Necessárias:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• <strong>Nome:</strong> Nome para identificar a integração</li>
                        <li>• <strong>Base URL:</strong> https://seu-servidor:8443 ou IP da controladora</li>
                        <li>• <strong>Username:</strong> Usuário admin da controladora</li>
                        <li>• <strong>Password:</strong> Senha do usuário admin</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button onClick={() => window.location.href = '/admin'} className="bg-blue-600 hover:bg-blue-700">
                  Configurar Controladora UniFi
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Controladora UniFi - {integration?.name}</h1>
            </div>
            <p className="text-gray-400">Conectado em: {connectionUrl}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">Usuário: {integration?.username}</span>
              {integration?.password && (
                <Badge className="bg-green-900/20 text-green-400 border-green-600">
                  Autenticado
                </Badge>
              )}
            </div>
            {systemInfo && (
              <p className="text-sm text-gray-500">
                Versão: {systemInfo.version} | Uptime: {formatUptime(systemInfo.uptime)} | Host: {systemInfo.hostname}
                {systemInfo.update_available && (
                  <Badge className="ml-2 bg-orange-900/20 text-orange-400 border-orange-600">
                    Atualização Disponível
                  </Badge>
                )}
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
              onClick={refreshAdvancedData} 
              disabled={isLoading} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Network className="h-5 w-5" />
              Status da Controladora UniFi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={sites.length > 0 ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-yellow-900/20 text-yellow-400 border-yellow-600'}>
                  {sites.length > 0 ? '✅ Conectado' : '🔄 Conectando...'}
                </Badge>
                <span className="text-gray-400 text-sm">
                  {sites.length > 0 ? 
                    `${sites.length} site(s) encontrado(s) na controladora` : 
                    'Autenticando com a controladora...'
                  }
                </span>
              </div>
              
              {sites.length === 0 && !sitesLoading && (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-yellow-400 font-medium">Nenhum site encontrado</p>
                      <p className="text-gray-300 mt-1">
                        Verifique se a controladora está acessível e se as credenciais estão corretas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Site Selection */}
        <UniFiSiteSelector
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSiteChange={setSelectedSiteId}
          loading={sitesLoading}
        />

        {selectedSiteId && (
          <>
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
                      <p className="text-xl md:text-2xl font-bold text-white">{networks.length}</p>
                      <p className="text-xs md:text-sm text-gray-400">Redes Wi-Fi</p>
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

            {/* Advanced Management Tabs */}
            <Tabs defaultValue="monitoring" className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-gray-800 border-gray-700">
                <TabsTrigger value="monitoring" className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span className="hidden sm:inline">Monitoramento</span>
                </TabsTrigger>
                <TabsTrigger value="networks" className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="hidden sm:inline">Redes</span>
                </TabsTrigger>
                <TabsTrigger value="devices" className="flex items-center gap-2">
                  <Router className="h-4 w-4" />
                  <span className="hidden sm:inline">Dispositivos</span>
                </TabsTrigger>
                <TabsTrigger value="clients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Clientes</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Segurança</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="monitoring" className="space-y-6">
                <UniFiMonitoringDashboard
                  healthMetrics={healthMetrics}
                  events={events}
                  loading={healthMetricsLoading || eventsLoading}
                  onRefresh={refreshAdvancedData}
                />
              </TabsContent>

              <TabsContent value="networks" className="space-y-6">
                <UniFiNetworkManager
                  networks={networks}
                  loading={networksLoading}
                  onCreateNetwork={createNetwork}
                  onUpdateNetwork={updateNetwork}
                  onDeleteNetwork={deleteNetwork}
                  onToggleNetwork={(networkId, enabled) => 
                    updateNetwork(networkId, { enabled })
                  }
                  selectedSiteId={selectedSiteId}
                />
              </TabsContent>

              <TabsContent value="devices" className="space-y-6">
                <UniFiDeviceManager
                  devices={devices}
                  loading={isLoading}
                  onRestartDevice={restartDevice}
                  restartLoading={restartDeviceLoading}
                  selectedSiteId={selectedSiteId}
                />
                
                {/* Device Selection for Advanced Settings */}
                {devices.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Configurações Avançadas de Dispositivo</CardTitle>
                      <CardDescription className="text-gray-400">
                        Selecione um dispositivo para acessar configurações avançadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {devices.map((device) => (
                          <Button
                            key={device.mac}
                            size="sm"
                            variant={selectedDeviceId === device.mac ? "default" : "outline"}
                            onClick={() => setSelectedDeviceId(device.mac)}
                            className={selectedDeviceId === device.mac ? 
                              "bg-blue-600 hover:bg-blue-700" : 
                              "border-gray-600 text-gray-200 hover:bg-gray-700"
                            }
                          >
                            {device.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedDevice && (
                  <UniFiAdvancedDeviceManager
                    device={selectedDevice}
                    onUpdateDevice={updateDeviceSettings}
                    onLocateDevice={locateDevice}
                    onUpgradeDevice={(deviceId) => {
                      // Placeholder for upgrade functionality
                      console.log('Upgrade device:', deviceId);
                    }}
                    onSetLED={setDeviceLED}
                  />
                )}
              </TabsContent>

              <TabsContent value="clients" className="space-y-6">
                <UniFiClientManager
                  clients={clients}
                  loading={isLoading}
                  onBlockClient={blockClient}
                  blockLoading={blockClientLoading}
                  selectedSiteId={selectedSiteId}
                />
                
                {/* Additional Client Management Features */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Gerenciamento Avançado de Clientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={() => {
                          // Placeholder for bulk client management
                          console.log('Bulk client management');
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Gerenciar em Lote
                      </Button>
                      <Button
                        onClick={() => {
                          // Placeholder for client statistics
                          console.log('Client statistics');
                        }}
                        variant="outline"
                        className="border-gray-600 text-gray-200 hover:bg-gray-700"
                      >
                        Estatísticas Detalhadas
                      </Button>
                      <Button
                        onClick={() => {
                          // Placeholder for client reports
                          console.log('Client reports');
                        }}
                        variant="outline"
                        className="border-gray-600 text-gray-200 hover:bg-gray-700"
                      >
                        Relatórios de Uso
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Configurações do Site</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Configurações Gerais</h4>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurações de DHCP
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Network className="h-4 w-4 mr-2" />
                            Configurações de DNS
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Database className="h-4 w-4 mr-2" />
                            Backup e Restauração
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Manutenção</h4>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Monitor className="h-4 w-4 mr-2" />
                            Logs do Sistema
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Relatórios de Performance
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Alertas e Notificações
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Configurações de Segurança</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Firewall e Controle de Acesso</h4>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Shield className="h-4 w-4 mr-2" />
                            Regras de Firewall
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Network className="h-4 w-4 mr-2" />
                            Port Forwarding
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Users className="h-4 w-4 mr-2" />
                            Controle de Acesso
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Detecção de Intrusão</h4>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            IDS/IPS Settings
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <Monitor className="h-4 w-4 mr-2" />
                            Logs de Segurança
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Relatórios de Segurança
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default UniFi;
