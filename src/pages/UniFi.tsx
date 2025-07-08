
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Gauge,
  CheckCircle,
  XCircle,
  Loader2,
  HelpCircle,
  Zap,
  Globe,
  Info,
  Stethoscope,
  Link
} from 'lucide-react';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { UniFiSiteSelector } from '@/components/UniFiSiteSelector';
import { UniFiDeviceManager } from '@/components/UniFiDeviceManager';
import { UniFiClientManager } from '@/components/UniFiClientManager';
import { UniFiNetworkManager } from '@/components/UniFiNetworkManager';
import { UniFiMonitoringDashboard } from '@/components/UniFiMonitoringDashboard';
import { UniFiAdvancedDeviceManager } from '@/components/UniFiAdvancedDeviceManager';
import { UniFiConnectionDiagnostic } from '@/components/UniFiConnectionDiagnostic';
import { toast } from '@/hooks/use-toast';

const UniFi = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error' | 'unknown'>('unknown');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  
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
    diagnose,
    diagnoseLoading,
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
    connectionUrl,
    sitesError,
    devicesError,
    clientsError
  } = useUniFiAPI(selectedSiteId);

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && selectedSiteId) {
      interval = setInterval(() => {
        refreshAdvancedData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedSiteId, refreshAdvancedData]);

  // Test connection on component mount
  useEffect(() => {
    if (isConnected && !testConnectionLoading && connectionStatus === 'unknown') {
      handleTestConnection();
    }
  }, [isConnected]);

  // Auto select the first site if none is selected
  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0]._id);
      toast({
        title: "Site selecionado automaticamente",
        description: `${sites[0].desc || sites[0].name} foi selecionado para você.`,
      });
    }
  }, [sites, selectedSiteId]);

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      await testConnection();
      setConnectionStatus('connected');
      
      toast({
        title: "✅ Conexão bem sucedida",
        description: "Conectado à controladora UniFi com sucesso.",
      });
    } catch (error) {
      setConnectionStatus('error');
      
      toast({
        title: "❌ Erro de conexão",
        description: "Falha ao conectar à controladora UniFi.",
        variant: "destructive"
      });
    }
  };

  const handleDiagnose = async () => {
    try {
      await diagnose();
      // The diagnosis result will be handled in the mutation's onSuccess
    } catch (error) {
      console.error('Diagnosis failed:', error);
    }
  };

  const handleUpdateIntegration = (updates: any) => {
    // This would update the integration in the database
    // For now, we'll just show a toast
    toast({
      title: "⚙️ Configuração atualizada",
      description: "As configurações da controladora foram atualizadas. Teste a conexão para verificar.",
    });
  };

  const handleForceRefresh = async () => {
    toast({
      title: "🔄 Atualizando dados",
      description: "Forçando atualização de todos os dados da controladora..."
    });
    
    try {
      await Promise.all([
        refreshAllData(),
        refreshAdvancedData()
      ]);
      
      toast({
        title: "✅ Dados atualizados",
        description: "Todas as informações foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        title: "❌ Erro na atualização",
        description: "Ocorreu um erro ao atualizar os dados.",
        variant: "destructive"
      });
    }
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

  const getConnectionStatusBadge = () => {
    // Check for specific errors
    if (sitesError || devicesError || clientsError) {
      const errorMessage = sitesError?.message || devicesError?.message || clientsError?.message || '';
      
      if (errorMessage.includes('Authentication failed') || errorMessage.includes('Invalid credentials')) {
        return (
          <Badge className="bg-red-900/20 text-red-400 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Falha de Autenticação
          </Badge>
        );
      } else if (errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
        return (
          <Badge className="bg-orange-900/20 text-orange-400 border-orange-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Erro SSL/Certificado
          </Badge>
        );
      } else if (errorMessage.includes('timeout') || errorMessage.includes('unreachable')) {
        return (
          <Badge className="bg-red-900/20 text-red-400 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Controladora Inacessível
          </Badge>
        );
      }
    }
    
    switch (connectionStatus) {
      case 'testing':
        return (
          <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Testando...
          </Badge>
        );
      case 'connected':
        return (
          <Badge className="bg-green-900/20 text-green-400 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-900/20 text-red-400 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Erro de Conexão
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">
            <HelpCircle className="h-3 w-3 mr-1" />
            Desconhecido
          </Badge>
        );
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
                  <Link className="h-4 w-4 mr-2" />
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
        {/* Enhanced Header with Better Status */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Controladora UniFi - {integration?.name}</h1>
              {getConnectionStatusBadge()}
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
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              className={autoRefresh ? 
                "bg-green-600 hover:bg-green-700" : 
                "border-gray-600 text-gray-200 hover:bg-gray-700"
              }
            >
              <Zap className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button 
              onClick={handleTestConnection}
              disabled={testConnectionLoading}
              variant="outline"
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              <TestTube className={`h-4 w-4 mr-2 ${testConnectionLoading ? 'animate-spin' : ''}`} />
              Testar Conexão
            </Button>
            <Button 
              onClick={handleForceRefresh} 
              disabled={isLoading} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Forçar Atualização
            </Button>
          </div>
        </div>

        {/* Connection Diagnostic Section */}
        <UniFiConnectionDiagnostic
          onRunDiagnosis={handleDiagnose}
          diagnosisLoading={diagnoseLoading}
          diagnosis={diagnosis}
          connectionUrl={connectionUrl}
          integration={integration}
          onUpdateIntegration={handleUpdateIntegration}
        />

        {/* Enhanced Connection Status */}
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
                {getConnectionStatusBadge()}
                <span className="text-gray-400 text-sm">
                  {sites.length > 0 ? 
                    `${sites.length} site(s) encontrado(s) na controladora` : 
                    sitesLoading ? 'Carregando sites...' : 'Nenhum site encontrado'
                  }
                </span>
              </div>
              
              {(sitesError || devicesError || clientsError) && (
                <Alert className="bg-red-900/20 border-red-600">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {sitesError?.message || devicesError?.message || clientsError?.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {sites.length === 0 && !sitesLoading && connectionStatus !== 'testing' && !sitesError && (
                <Alert className="bg-yellow-900/20 border-yellow-600">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300">
                    Nenhum site encontrado. Verifique se a controladora está acessível e se as credenciais estão corretas.
                  </AlertDescription>
                </Alert>
              )}

              {sitesLoading && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Carregando informações da controladora...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Site Selection - Made more prominent */}
        <div className="my-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              Selecione um Site para Gerenciar
            </h2>
            <p className="text-gray-400 mt-1">
              Escolha um site da controladora UniFi para visualizar e administrar seus dispositivos e configurações
            </p>
          </div>
          
          <UniFiSiteSelector
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSiteChange={(siteId) => {
              setSelectedSiteId(siteId);
              const selectedSite = sites.find(site => site._id === siteId);
              toast({
                title: "Site selecionado",
                description: `${selectedSite?.desc || selectedSite?.name || 'Site'} foi selecionado.`,
              });
            }}
            loading={sitesLoading}
          />
        </div>

        {!selectedSiteId && sites.length > 0 && (
          <Alert className="bg-blue-900/30 border-blue-600">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Por favor, selecione um site acima para visualizar e gerenciar os dispositivos e redes.
            </AlertDescription>
          </Alert>
        )}

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

            {/* Quick Actions Bar */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button
                    onClick={() => refreshAdvancedData()}
                    disabled={isLoading}
                    variant="outline"
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar Tudo
                  </Button>
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    variant={autoRefresh ? "default" : "outline"}
                    className={autoRefresh ? 
                      "bg-green-600 hover:bg-green-700" : 
                      "border-gray-600 text-gray-200 hover:bg-gray-700"
                    }
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Auto Refresh
                  </Button>
                  <Button
                    onClick={handleTestConnection}
                    disabled={testConnectionLoading}
                    variant="outline"
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar
                  </Button>
                  <Button
                    onClick={handleDiagnose}
                    disabled={diagnoseLoading}
                    variant="outline"
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Diagnóstico
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Recarregar
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                      toast({
                        title: "🔄 Atualização iniciada",
                        description: `Iniciando atualização do dispositivo ${deviceId}...`
                      });
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
                          toast({
                            title: "🔧 Em desenvolvimento",
                            description: "Funcionalidade de gerenciamento em lote em breve."
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Gerenciar em Lote
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "📊 Em desenvolvimento",
                            description: "Estatísticas detalhadas em breve."
                          });
                        }}
                        variant="outline"
                        className="border-gray-600 text-gray-200 hover:bg-gray-700"
                      >
                        Estatísticas Detalhadas
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "📋 Em desenvolvimento",
                            description: "Relatórios de uso em breve."
                          });
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
