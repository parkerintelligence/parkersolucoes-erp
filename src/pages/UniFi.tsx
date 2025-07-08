
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Router, 
  Users, 
  Activity, 
  RefreshCw, 
  TestTube,
  Cloud,
  Network,
  Key,
  AlertTriangle
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
                <Cloud className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma Integração UniFi Cloud Configurada
                </h3>
                <p className="text-gray-400 mb-4">
                  Configure uma integração UniFi Cloud na seção de Administração para acessar seus dados da nuvem UniFi.
                </p>
                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-medium text-blue-400 mb-1">Credenciais Necessárias:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• <strong>Nome:</strong> Nome para identificar a integração</li>
                        <li>• <strong>Base URL:</strong> https://unifi.ui.com/</li>
                        <li>• <strong>Username:</strong> Seu email da conta Ubiquiti</li>
                        <li>• <strong>Password:</strong> Sua senha da conta Ubiquiti</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button onClick={() => window.location.href = '/admin'} className="bg-blue-600 hover:bg-blue-700">
                  Configurar UniFi Cloud
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
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">UniFi Cloud - {integration?.name}</h1>
            </div>
            <p className="text-gray-400">Conectado via: {connectionUrl}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">Credenciais: {integration?.username}</span>
              {integration?.password && (
                <Badge className="bg-green-900/20 text-green-400 border-green-600">
                  Senha Configurada
                </Badge>
              )}
            </div>
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
              disabled={isLoading} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </Button>
          </div>
        </div>

        {/* Authentication Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5" />
              Status de Autenticação UniFi Cloud
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
                    `${sites.length} site(s) encontrado(s) na UniFi Cloud` : 
                    'Autenticando com UniFi Cloud...'
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
                        Verifique se suas credenciais estão corretas e se você possui sites configurados em sua conta UniFi Cloud.
                      </p>
                      <ul className="text-xs text-gray-400 mt-2 space-y-1">
                        <li>• Acesse https://unifi.ui.com/ para verificar seus sites</li>
                        <li>• Certifique-se de que não há autenticação de dois fatores ativada</li>
                        <li>• Verifique se o email e senha estão corretos na configuração</li>
                      </ul>
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
          </>
        )}
      </div>
    </div>
  );
};

export default UniFi;
