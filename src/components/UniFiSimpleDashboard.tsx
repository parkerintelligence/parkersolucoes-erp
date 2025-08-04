import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Wifi, 
  Router, 
  Users, 
  Network,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Server,
  Activity
} from 'lucide-react';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { UniFiSiteSelector } from '@/components/UniFiSiteSelector';
import { UniFiDeviceManager } from '@/components/UniFiDeviceManager';
import { UniFiClientManager } from '@/components/UniFiClientManager';
import { useToast } from '@/hooks/use-toast';

const UniFiSimpleDashboard = () => {
  const { data: integrations } = useIntegrations();
  const { toast } = useToast();
  
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [networksOpen, setNetworksOpen] = useState(false);
  const [alarmsOpen, setAlarmsOpen] = useState(false);

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

  const unifiIntegrations = integrations?.filter(int => int.type === 'unifi' && int.is_active) || [];

  // Auto-select first integration
  useEffect(() => {
    if (unifiIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(unifiIntegrations[0].id);
    }
  }, [unifiIntegrations, selectedIntegration]);

  // Queries - using Site Manager API directly (no host selection needed)
  const { 
    data: sites, 
    isLoading: sitesLoading 
  } = useUniFiSites(selectedIntegration);
  
  const { 
    data: devices, 
    isLoading: devicesLoading 
  } = useUniFiDevices(selectedIntegration, undefined, selectedSiteId);
  
  const { 
    data: clients, 
    isLoading: clientsLoading 
  } = useUniFiClients(selectedIntegration, undefined, selectedSiteId);
  
  const { 
    data: networks, 
    isLoading: networksLoading 
  } = useUniFiNetworks(selectedIntegration, undefined, selectedSiteId);
  
  const { 
    data: alarms, 
    isLoading: alarmsLoading 
  } = useUniFiAlarms(selectedIntegration, undefined, selectedSiteId);
  
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useUniFiStats(selectedIntegration, undefined, selectedSiteId);

  // Auto-select first site
  useEffect(() => {
    if (sites?.data && sites.data.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites.data[0].id);
    }
  }, [sites, selectedSiteId]);

  const handleRefresh = () => {
    refreshData(selectedIntegration, undefined, selectedSiteId);
    toast({
      title: "Dados atualizados",
      description: "Informações da rede UniFi foram atualizadas.",
    });
  };

  if (unifiIntegrations.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma integração UniFi ativa encontrada. Configure uma integração na página de Administração.
        </AlertDescription>
      </Alert>
    );
  }

  const selectedSite = sites?.data?.find(site => site.id === selectedSiteId);

  const statsData = stats ? [
    {
      title: "Dispositivos",
      value: stats.total_devices || 0,
      subtitle: `${stats.online_devices || 0} online`,
      icon: <Router className="h-4 w-4" />
    },
    {
      title: "Clientes",
      value: stats.total_clients || 0,
      subtitle: `${stats.wireless_clients || 0} Wi-Fi`,
      icon: <Users className="h-4 w-4" />
    },
    {
      title: "Redes",
      value: networks?.data?.length || 0,
      subtitle: "Configuradas",
      icon: <Network className="h-4 w-4" />
    },
    {
      title: "Alertas",
      value: selectedSite?.newAlarmCount || 0,
      subtitle: "Novos",
      icon: <AlertTriangle className="h-4 w-4" />
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header com Site Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>UniFi Network Manager</CardTitle>
                {selectedSite && (
                  <p className="text-sm text-muted-foreground">
                    Site: {selectedSite.description || selectedSite.name}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UniFiSiteSelector
            sites={sites?.data || []}
            selectedSiteId={selectedSiteId}
            onSiteChange={setSelectedSiteId}
            loading={sitesLoading}
          />
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {selectedSiteId && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Expandable Sections */}
      {selectedSiteId && (
        <div className="space-y-4">
          {/* Devices Section */}
          <Collapsible open={devicesOpen} onOpenChange={setDevicesOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Router className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        Dispositivos ({devices?.data?.length || 0})
                      </CardTitle>
                    </div>
                    {devicesOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <UniFiDeviceManager
                    devices={devices?.data || []}
                    loading={devicesLoading}
                    restartLoading={restartDevice.isPending}
                    onRestartDevice={async (deviceId: string) => {
                      try {
                        await restartDevice.mutateAsync({
                          integrationId: selectedIntegration,
                          hostId: undefined,
                          deviceId,
                          siteId: selectedSiteId
                        });
                      } catch (error) {
                        console.error('Device restart failed:', error);
                      }
                    }}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Clients Section */}
          <Collapsible open={clientsOpen} onOpenChange={setClientsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        Clientes ({clients?.data?.length || 0})
                      </CardTitle>
                    </div>
                    {clientsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <UniFiClientManager
                    clients={clients?.data || []}
                    loading={clientsLoading}
                    blockLoading={toggleClientBlock.isPending}
                    onBlockClient={async (siteId: string, clientId: string, block: boolean) => {
                      try {
                        await toggleClientBlock.mutateAsync({
                          integrationId: selectedIntegration,
                          hostId: undefined,
                          clientId,
                          block,
                          siteId: selectedSiteId
                        });
                      } catch (error) {
                        console.error('Client block/unblock failed:', error);
                      }
                    }}
                    selectedSiteId={selectedSiteId}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Networks Section */}
          <Collapsible open={networksOpen} onOpenChange={setNetworksOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Network className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        Redes ({networks?.data?.length || 0})
                      </CardTitle>
                    </div>
                    {networksOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {networksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : networks?.data && networks.data.length > 0 ? (
                    <div className="space-y-2">
                      {networks.data.map((network: any) => (
                        <div key={network.id || network.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{network.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {network.networkgroup || network.purpose}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {network.enabled ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma rede encontrada
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Alarms Section */}
          <Collapsible open={alarmsOpen} onOpenChange={setAlarmsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        Alertas ({alarms?.data?.length || 0})
                        {selectedSite?.newAlarmCount && selectedSite.newAlarmCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {selectedSite.newAlarmCount} novos
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    {alarmsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {alarmsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : alarms?.data && alarms.data.length > 0 ? (
                    <div className="space-y-2">
                      {alarms.data.map((alarm: any, index: number) => (
                        <div key={alarm.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{alarm.message}</p>
                            <p className="text-sm text-muted-foreground">
                              {alarm.datetime && new Date(alarm.datetime * 1000).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={alarm.archived ? "secondary" : "destructive"}>
                            {alarm.archived ? 'Arquivado' : 'Ativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum alerta encontrado
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}
    </div>
  );
};

export default UniFiSimpleDashboard;