import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Search,
  Activity,
  Globe,
  CheckCircle2,
  XCircle,
  Signal,
  Cloud,
  Server
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { UniFiDeviceManager } from '@/components/UniFiDeviceManager';
import { UniFiClientManager } from '@/components/UniFiClientManager';
import { useToast } from '@/hooks/use-toast';

const UniFiSimpleDashboard = () => {
  const { data: integrations } = useIntegrations();
  const { toast } = useToast();
  
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('devices');
  const [devicesOpen, setDevicesOpen] = useState(true);
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

  // Determine integration mode
  const currentIntegration = unifiIntegrations.find(i => i.id === selectedIntegration);
  const isLocalController = Boolean(currentIntegration?.base_url && currentIntegration?.username);
  const integrationMode = isLocalController ? 'local' : 'site-manager';

  useEffect(() => {
    if (unifiIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(unifiIntegrations[0].id);
    }
  }, [unifiIntegrations, selectedIntegration]);

  const { data: sites, isLoading: sitesLoading, error: sitesError } = useUniFiSites(selectedIntegration);
  const selectedSite = sites?.data?.find((site: any) => site.id === selectedSiteId);
  const selectedSiteHostId = selectedSite?.controllerId;
  const { data: devices, isLoading: devicesLoading } = useUniFiDevices(selectedIntegration, selectedSiteHostId, selectedSiteId);
  const { data: clients, isLoading: clientsLoading } = useUniFiClients(selectedIntegration, selectedSiteHostId, selectedSiteId);
  const { data: networks, isLoading: networksLoading } = useUniFiNetworks(selectedIntegration, selectedSiteHostId, selectedSiteId);
  const { data: alarms, isLoading: alarmsLoading } = useUniFiAlarms(selectedIntegration, selectedSiteHostId, selectedSiteId);

  useEffect(() => {
    if (sites?.data && sites.data.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites.data[0].id);
    }
  }, [sites, selectedSiteId]);

  const handleRefresh = () => {
    refreshData(selectedIntegration, selectedSiteHostId, selectedSiteId);
    toast({ title: "Dados atualizados", description: "Informações da rede UniFi foram atualizadas." });
  };
  const devicesList = devices?.data || [];
  const clientsList = clients?.data || [];
  const networksList = networks?.data || [];
  const alarmsList = alarms?.data || [];

  const onlineDevices = devicesList.filter((d: any) => d.status === 'online' || d.state === 1).length;
  const totalDevices = devicesList.length;
  const offlineDevices = Math.max(totalDevices - onlineDevices, 0);
  const wifiClients = clientsList.filter((c: any) => !c.isWired && !c.is_wired).length;
  const wiredClients = clientsList.filter((c: any) => c.isWired || c.is_wired).length;
  const totalClients = clientsList.length;
  const cloudDetailUnavailable = !isLocalController && [devices, clients, networks, alarms].some(
    (response: any) => response?.meta?.cloudDetailUnavailable,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">UniFi Network</h1>
          {selectedSite && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              — {selectedSite.description || selectedSite.name}
            </span>
          )}
          {currentIntegration && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`text-[10px] h-5 gap-1 cursor-default ${isLocalController ? 'border-orange-500/40 text-orange-400' : 'border-blue-500/40 text-blue-400'}`}>
                    {isLocalController ? <Server className="h-2.5 w-2.5" /> : <Cloud className="h-2.5 w-2.5" />}
                    {isLocalController ? 'Local' : 'Cloud'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-xs">
                  {isLocalController
                    ? `Controladora Local — ${currentIntegration.base_url}`
                    : 'UniFi Site Manager (unifi.ui.com) — via API Token'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unifiIntegrations.length > 1 && (
            <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
              <SelectTrigger className="w-40 h-8 bg-card border-border text-xs">
                <SelectValue placeholder="Integração" />
              </SelectTrigger>
              <SelectContent>
                {unifiIntegrations.map(int => (
                  <SelectItem key={int.id} value={int.id}>{int.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Dispositivos", value: totalDevices, icon: Router, color: "text-primary" },
          { label: "Online", value: onlineDevices, icon: CheckCircle2, color: "text-green-500" },
          { label: "Offline", value: offlineDevices, icon: XCircle, color: offlineDevices > 0 ? "text-destructive" : "text-muted-foreground" },
          { label: "Clientes", value: totalClients, icon: Users, color: "text-primary" },
          { label: "Wi-Fi", value: wifiClients, icon: Signal, color: "text-primary" },
          { label: "Redes", value: networksList.length, icon: Network, color: "text-muted-foreground" },
          { label: "Alertas", value: alarmsList.length, icon: AlertTriangle, color: alarmsList.length > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: Site selector + Search */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <Select value={selectedSiteId} onValueChange={setSelectedSiteId} disabled={sitesLoading || !sites?.data?.length}>
          <SelectTrigger className="w-56 h-8 bg-card border-border text-xs">
            <Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Selecione um site..." />
          </SelectTrigger>
          <SelectContent>
            {(sites?.data || []).map((site: any) => (
              <SelectItem key={site.id} value={site.id} className="text-xs">
                {site.description || site.name}
                {site.controllerName && (
                  <span className="text-muted-foreground ml-1">({site.controllerName})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar dispositivos, clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-card border-border h-8 text-xs"
          />
        </div>

        <div className="flex items-center bg-card border border-border rounded-lg p-0.5 ml-auto">
          {[
            { value: "devices", icon: Router, label: "Dispositivos", count: devicesList.length },
            { value: "clients", icon: Users, label: "Clientes", count: clientsList.length },
            { value: "networks", icon: Network, label: "Redes", count: networksList.length },
            { value: "alarms", icon: AlertTriangle, label: "Alertas", count: alarmsList.length },
          ].map(view => (
            <Button
              key={view.value}
              variant="ghost"
              size="sm"
              onClick={() => setActiveSection(view.value)}
              className={`h-7 px-2.5 gap-1 rounded-md text-[11px] ${
                activeSection === view.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <view.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{view.label}</span>
              <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-0.5">{view.count}</Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {sitesLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando sites...</p>
          </div>
        </div>
      )}

      {/* No site selected */}
      {!sitesLoading && !selectedSiteId && sites?.data?.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-6 rounded-lg bg-card border border-border text-xs text-muted-foreground justify-center">
          <Globe className="h-4 w-4" />
          Nenhum site encontrado. Verifique a configuração da integração.
        </div>
      )}

      {/* Content Sections */}
      {selectedSiteId && (
        <div className="space-y-3">
          {/* Devices */}
          {activeSection === 'devices' && (
            <Collapsible open={devicesOpen} onOpenChange={setDevicesOpen} defaultOpen>
              <div className="rounded-lg border border-border bg-card">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Router className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Dispositivos</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{devicesList.length}</Badge>
                      {onlineDevices > 0 && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-green-500 border-green-500/30">
                          {onlineDevices} online
                        </Badge>
                      )}
                    </div>
                    {devicesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <UniFiDeviceManager
                      devices={devicesList}
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
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Clients */}
          {activeSection === 'clients' && (
            <Collapsible open={clientsOpen} onOpenChange={setClientsOpen} defaultOpen>
              <div className="rounded-lg border border-border bg-card">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Clientes</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{clientsList.length}</Badge>
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                        {wifiClients} Wi-Fi · {wiredClients} cabeados
                      </Badge>
                    </div>
                    {clientsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <UniFiClientManager
                      clients={clientsList}
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
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Networks */}
          {activeSection === 'networks' && (
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                <Network className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Redes</span>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{networksList.length}</Badge>
              </div>
              <div className="p-4">
                {networksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : networksList.length > 0 ? (
                  <div className="space-y-1">
                    {networksList.map((network: any) => (
                      <div key={network.id || network.name} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <Network className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-foreground truncate" title={network.name}>{network.name}</span>
                          <span className="text-[10px] text-muted-foreground">{network.networkgroup || network.purpose}</span>
                        </div>
                        <Badge variant={network.enabled ? 'outline' : 'secondary'} className="text-[10px] h-5 px-1.5">
                          {network.enabled ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-6">Nenhuma rede encontrada</p>
                )}
              </div>
            </div>
          )}

          {/* Alarms */}
          {activeSection === 'alarms' && (
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Alertas</span>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{alarmsList.length}</Badge>
                {selectedSite?.newAlarmCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{selectedSite.newAlarmCount} novos</Badge>
                )}
              </div>
              <div className="p-4">
                {alarmsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : alarmsList.length > 0 ? (
                  <div className="space-y-1">
                    {alarmsList.map((alarm: any, index: number) => (
                      <div key={alarm.id || index} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${alarm.archived ? 'text-muted-foreground' : 'text-destructive'}`} />
                          <span className="text-xs text-foreground truncate" title={alarm.message}>{alarm.message}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {alarm.datetime && new Date(alarm.datetime * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Badge variant={alarm.archived ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5">
                            {alarm.archived ? 'Arquivado' : 'Ativo'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-6">Nenhum alerta encontrado</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniFiSimpleDashboard;
