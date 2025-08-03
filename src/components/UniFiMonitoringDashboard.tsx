import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  Server, 
  Users, 
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  Router,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { UniFiHostSelector } from '@/components/UniFiHostSelector';
import { UniFiSiteSelector } from '@/components/UniFiSiteSelector';
import { UniFiDeviceManager } from '@/components/UniFiDeviceManager';
import { UniFiClientManager } from '@/components/UniFiClientManager';
import { useToast } from '@/hooks/use-toast';

const UniFiMonitoringDashboard = () => {
  const { data: integrations } = useIntegrations();
  const { toast } = useToast();
  
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [showRealTimeStats, setShowRealTimeStats] = useState(true);

  const {
    useUniFiHosts,
    useUniFiSites,
    useUniFiDevices,
    useUniFiClients,
    useUniFiStats,
    restartDevice,
    toggleClientBlock,
    refreshData
  } = useUniFiAPI();

  const unifiIntegrations = integrations?.filter(int => int.type === 'unifi' && int.is_active) || [];

  // Queries
  const { 
    data: hosts, 
    isLoading: hostsLoading 
  } = useUniFiHosts(selectedIntegration);
  
  const { 
    data: sites, 
    isLoading: sitesLoading 
  } = useUniFiSites(selectedIntegration, selectedHostId);
  
  const { 
    data: devices, 
    isLoading: devicesLoading 
  } = useUniFiDevices(selectedIntegration, selectedHostId, selectedSiteId);
  
  const { 
    data: clients, 
    isLoading: clientsLoading 
  } = useUniFiClients(selectedIntegration, selectedHostId, selectedSiteId);
  
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useUniFiStats(selectedIntegration, selectedHostId, selectedSiteId);

  // Auto-select first integration
  useEffect(() => {
    if (unifiIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(unifiIntegrations[0].id);
    }
  }, [unifiIntegrations, selectedIntegration]);

  // Auto-select first host
  useEffect(() => {
    if (hosts && hosts.length > 0 && !selectedHostId) {
      setSelectedHostId(hosts[0].id);
    }
  }, [hosts, selectedHostId]);

  // Auto-select first site
  useEffect(() => {
    if (sites?.data && sites.data.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites.data[0].id);
    }
  }, [sites, selectedSiteId]);

  const handleRefresh = () => {
    refreshData(selectedIntegration, selectedHostId, selectedSiteId);
    toast({
      title: "Dados atualizados",
      description: "Informações da rede UniFi foram atualizadas.",
    });
  };

  if (unifiIntegrations.length === 0) {
    return (
      <Alert className="border-yellow-500 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-white">
          Nenhuma integração UniFi ativa encontrada. Configure uma integração na página de Administração.
        </AlertDescription>
      </Alert>
    );
  }

  const statsData = stats ? [
    {
      title: "Dispositivos",
      value: stats.total_devices || 0,
      subtitle: `${stats.online_devices || 0} online`,
      icon: <Router className="h-4 w-4" />,
      color: "text-blue-400"
    },
    {
      title: "Clientes",
      value: stats.total_clients || 0,
      subtitle: `${stats.wireless_clients || 0} Wi-Fi, ${stats.wired_clients || 0} cabeados`,
      icon: <Users className="h-4 w-4" />,
      color: "text-green-400"
    },
    {
      title: "Wi-Fi",
      value: stats.wireless_clients || 0,
      subtitle: `${stats.guest_clients || 0} convidados`,
      icon: <Wifi className="h-4 w-4" />,
      color: "text-purple-400"
    },
    {
      title: "Status",
      value: stats.health_status?.length || 0,
      subtitle: "Subsistemas",
      icon: <Activity className="h-4 w-4" />,
      color: "text-orange-400"
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard UniFi</h2>
            <p className="text-slate-400">Monitoramento em tempo real da rede</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowRealTimeStats(!showRealTimeStats)}
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            {showRealTimeStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showRealTimeStats ? 'Ocultar' : 'Mostrar'} Stats
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Integration Selector */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Seleção de Integração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {unifiIntegrations.map((integration) => (
              <Button
                key={integration.id}
                onClick={() => setSelectedIntegration(integration.id)}
                variant={selectedIntegration === integration.id ? "default" : "outline"}
                size="sm"
                className={
                  selectedIntegration === integration.id 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "border-slate-600 text-white hover:bg-slate-700"
                }
              >
                <Server className="h-4 w-4 mr-2" />
                {integration.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Host and Site Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UniFiHostSelector
          hosts={hosts || []}
          selectedHostId={selectedHostId}
          onHostChange={setSelectedHostId}
          loading={hostsLoading}
        />
        
        <UniFiSiteSelector
          sites={sites?.data || []}
          selectedSiteId={selectedSiteId}
          onSiteChange={setSelectedSiteId}
          loading={sitesLoading}
        />
      </div>

      {/* Statistics Cards */}
      {showRealTimeStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-slate-400 text-xs">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.color} opacity-75`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Devices Management */}
      <UniFiDeviceManager
        devices={devices?.data || []}
        loading={devicesLoading}
        restartLoading={restartDevice.isPending}
        onRestartDevice={async (deviceId: string) => {
          try {
            await restartDevice.mutateAsync({
              integrationId: selectedIntegration,
              hostId: selectedHostId,
              deviceId,
              siteId: selectedSiteId
            });
          } catch (error) {
            console.error('Device restart failed:', error);
          }
        }}
      />

      {/* Clients Management */}
      <UniFiClientManager
        clients={clients?.data || []}
        loading={clientsLoading}
        blockLoading={toggleClientBlock.isPending}
        onBlockClient={async (clientId: string, shouldBlock: boolean) => {
          try {
            await toggleClientBlock.mutateAsync({
              integrationId: selectedIntegration,
              hostId: selectedHostId,
              clientId,
              block: shouldBlock,
              siteId: selectedSiteId
            });
          } catch (error) {
            console.error('Client block/unblock failed:', error);
          }
        }}
        selectedSiteId={selectedSiteId}
      />
    </div>
  );
};

export default UniFiMonitoringDashboard;