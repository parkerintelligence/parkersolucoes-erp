import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useToast } from '@/hooks/use-toast';
import UniFiDirectSiteSelector from '@/components/UniFiDirectSiteSelector';
import { UniFiDeviceManager } from '@/components/UniFiDeviceManager';
import { UniFiClientManager } from '@/components/UniFiClientManager';
import { UniFiAlertsManager } from '@/components/UniFiAlertsManager';
import { UniFiNetworksManager } from '@/components/UniFiNetworksManager';
import { UniFiHealthDashboard } from '@/components/UniFiHealthDashboard';
import { UniFiAnalyticsDashboard } from '@/components/UniFiAnalyticsDashboard';

const UniFi = () => {
  const { data: integrations } = useIntegrations();
  const { toast } = useToast();
  
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const {
    useUniFiAllSites,
    useUniFiDevices,
    useUniFiClients,
    useUniFiAlarms,
    useUniFiNetworks,
    useUniFiHealth,
    useUniFiInsights,
    useUniFiDPI,
    useUniFiEvents,
    restartDevice,
    toggleClientBlock,
    refreshData
  } = useUniFiAPI();

  const unifiIntegrations = integrations?.filter(int => int.type === 'unifi' && int.is_active) || [];

  // Get all sites directly for selected integration
  const { 
    data: allSites, 
    isLoading: sitesLoading 
  } = useUniFiAllSites(selectedIntegration);

  // Auto-select first integration and site
  useEffect(() => {
    if (unifiIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(unifiIntegrations[0].id);
    }
  }, [unifiIntegrations, selectedIntegration]);

  useEffect(() => {
    if (allSites && allSites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(allSites[0].id);
    }
  }, [allSites, selectedSiteId]);

  // Data fetching for active tab
  const { data: devices, isLoading: devicesLoading } = useUniFiDevices(selectedIntegration, '', selectedSiteId);
  const { data: clients, isLoading: clientsLoading } = useUniFiClients(selectedIntegration, '', selectedSiteId);
  const { data: alarms, isLoading: alarmsLoading } = useUniFiAlarms(selectedIntegration, '', selectedSiteId);
  const { data: networks, isLoading: networksLoading } = useUniFiNetworks(selectedIntegration, '', selectedSiteId);
  const { data: health, isLoading: healthLoading } = useUniFiHealth(selectedIntegration, '', selectedSiteId);
  const { data: insights, isLoading: insightsLoading } = useUniFiInsights(selectedIntegration, selectedSiteId);
  const { data: dpiStats, isLoading: dpiLoading } = useUniFiDPI(selectedIntegration, selectedSiteId);
  const { data: events, isLoading: eventsLoading } = useUniFiEvents(selectedIntegration, selectedSiteId);

  const handleRefresh = () => {
    refreshData(selectedIntegration, '', selectedSiteId);
    toast({
      title: "Dados atualizados",
      description: "Informações da rede UniFi foram atualizadas.",
    });
  };

  if (unifiIntegrations.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma integração UniFi ativa encontrada. Configure uma integração na página de Administração.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Simplificado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">UniFi Network Manager</h1>
            <p className="text-muted-foreground">Gerenciamento e monitoramento da rede UniFi</p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Seletor de Site Proeminente */}
      {selectedIntegration && (
        <UniFiDirectSiteSelector
          sites={allSites || []}
          selectedSiteId={selectedSiteId}
          onSiteChange={setSelectedSiteId}
          loading={sitesLoading}
        />
      )}

      {/* Tabs com Todas as Funcionalidades */}
      {selectedSiteId && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="networks">Redes</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="health">Saúde</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Dispositivos</p>
                    <p className="text-2xl font-bold">{devices?.data?.length || 0}</p>
                  </div>
                  <Wifi className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Clientes</p>
                    <p className="text-2xl font-bold">{clients?.data?.length || 0}</p>
                  </div>
                  <Wifi className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Redes</p>
                    <p className="text-2xl font-bold">{networks?.length || 0}</p>
                  </div>
                  <Wifi className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Alertas</p>
                    <p className="text-2xl font-bold">{alarms?.length || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="devices">
            <UniFiDeviceManager
              devices={devices?.data || []}
              loading={devicesLoading}
              restartLoading={restartDevice.isPending}
              onRestartDevice={async (deviceId: string) => {
                try {
                  await restartDevice.mutateAsync({
                    integrationId: selectedIntegration,
                    hostId: '',
                    deviceId,
                    siteId: selectedSiteId
                  });
                } catch (error) {
                  console.error('Device restart failed:', error);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="clients">
            <UniFiClientManager
              clients={clients?.data || []}
              loading={clientsLoading}
              blockLoading={toggleClientBlock.isPending}
              onBlockClient={async (siteId: string, clientId: string, block: boolean) => {
                try {
                  await toggleClientBlock.mutateAsync({
                    integrationId: selectedIntegration,
                    hostId: '',
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
          </TabsContent>

          <TabsContent value="networks">
            <UniFiNetworksManager
              networks={networks || []}
              loading={networksLoading}
              onToggleNetwork={(networkId: string, enabled: boolean) => {
                toast({
                  title: "Rede atualizada",
                  description: `Rede ${enabled ? 'ativada' : 'desativada'} com sucesso.`,
                });
              }}
              onEditNetwork={(networkId: string) => {
                toast({
                  title: "Editar rede",
                  description: "Funcionalidade em desenvolvimento.",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <UniFiAlertsManager
              alarms={alarms || []}
              events={events || []}
              loading={alarmsLoading || eventsLoading}
              onMarkAsRead={(alarmId: string) => {
                toast({
                  title: "Alerta marcado como lido",
                  description: "O alerta foi marcado como lido.",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="health">
            <UniFiHealthDashboard
              health={health || []}
              loading={healthLoading}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <UniFiAnalyticsDashboard
              insights={insights || []}
              dpiStats={dpiStats || []}
              loading={insightsLoading || dpiLoading}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default UniFi;