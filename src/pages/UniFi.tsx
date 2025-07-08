
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Router, 
  Users, 
  Activity, 
  Settings, 
  RefreshCw, 
  TestTube,
  Globe,
  Shield,
  Network
} from 'lucide-react';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { UniFiSiteSelector } from '@/components/UniFiSiteSelector';
import { UniFiDeviceManager } from '@/components/UniFiDeviceManager';
import { UniFiClientManager } from '@/components/UniFiClientManager';

const UniFi = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  
  const {
    sites,
    devices,
    clients,
    systemInfo,
    networkSettings,
    integration,
    isLoading,
    sitesLoading,
    testConnection,
    testConnectionLoading,
    restartDevice,
    restartDeviceLoading,
    blockClient,
    blockClientLoading,
    refreshAllData,
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
              onClick={refreshAllData} 
              disabled={isLoading || !selectedSiteId} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </Button>
          </div>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
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

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Network className="h-6 w-6 md:h-8 md:w-8 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xl md:text-2xl font-bold text-white">{networkSettings.length}</p>
                      <p className="text-xs md:text-sm text-gray-400">Redes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device Management */}
            <UniFiDeviceManager
              devices={devices}
              loading={isLoading}
              onRestartDevice={restartDevice}
              restartLoading={restartDeviceLoading}
              selectedSiteId={selectedSiteId}
            />

            {/* Client Management */}
            <UniFiClientManager
              clients={clients}
              loading={isLoading}
              onBlockClient={blockClient}
              blockLoading={blockClientLoading}
              selectedSiteId={selectedSiteId}
            />

            {/* Network Settings */}
            {networkSettings.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Configurações de Rede
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Redes configuradas no site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {networkSettings.map((network) => (
                      <Card key={network._id} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{network.name}</h4>
                            <Badge className={network.enabled ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-red-900/20 text-red-400 border-red-600'}>
                              {network.enabled ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">Propósito: {network.purpose}</p>
                          {network.vlan_enabled && (
                            <p className="text-sm text-gray-400 mb-1">VLAN: {network.vlan}</p>
                          )}
                          {network.dhcp_enabled && (
                            <p className="text-sm text-gray-400">
                              DHCP: {network.dhcp_start} - {network.dhcp_stop}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UniFi;
