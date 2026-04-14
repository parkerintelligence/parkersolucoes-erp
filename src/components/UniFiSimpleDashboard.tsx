import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wifi, Router, Users, Network, AlertTriangle, RefreshCw, Search, Globe,
  CheckCircle2, XCircle, Signal, Cloud, Server, Power, Ban, Plus, Trash2,
  Edit, Activity, Cpu, HardDrive, Thermometer, Shield, Eye, EyeOff, Copy,
  Upload, MapPin, MoreHorizontal, Zap, BarChart3
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useToast } from '@/hooks/use-toast';
import UniFiOverviewCharts from '@/components/unifi/UniFiOverviewCharts';

const formatUptime = (seconds?: number) => {
  if (!seconds) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
};

const UniFiSimpleDashboard = () => {
  const { data: integrations } = useIntegrations();
  const { toast } = useToast();
  
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [activeTab, setActiveTab] = useState('devices');
  const [showCreateNetwork, setShowCreateNetwork] = useState(false);
  const [newNetwork, setNewNetwork] = useState({ name: '', security: 'wpapsk', x_passphrase: '', enabled: true, is_guest: false });
  // Per-tab filters
  const [deviceFilter, setDeviceFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [alarmFilter, setAlarmFilter] = useState('');

  const {
    useUniFiSites, useUniFiDevices, useUniFiClients, useUniFiNetworks, useUniFiAlarms, useUniFiHealth,
    restartDevice, upgradeDevice, provisionDevice, locateDevice, forgetDevice,
    toggleClientBlock, createNetwork, deleteNetwork, toggleNetwork, refreshData,
  } = useUniFiAPI();

  const unifiIntegrations = integrations?.filter(int => int.type === 'unifi' && int.is_active) || [];
  const currentIntegration = unifiIntegrations.find(i => i.id === selectedIntegration);
  const isLocal = Boolean(currentIntegration?.base_url && currentIntegration?.username);

  useEffect(() => {
    if (unifiIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(unifiIntegrations[0].id);
    }
  }, [unifiIntegrations, selectedIntegration]);

  const { data: sites, isLoading: sitesLoading, error: sitesError } = useUniFiSites(selectedIntegration, undefined, isLocal);
  const selectedSite = sites?.data?.find((s: any) => s.id === selectedSiteId);
  const hostId = selectedSite?.controllerId;

  const { data: devices, isLoading: devicesLoading } = useUniFiDevices(selectedIntegration, hostId, selectedSiteId);
  const { data: clients, isLoading: clientsLoading } = useUniFiClients(selectedIntegration, hostId, selectedSiteId);
  const { data: networks, isLoading: networksLoading } = useUniFiNetworks(selectedIntegration, hostId, selectedSiteId);
  const { data: alarms, isLoading: alarmsLoading } = useUniFiAlarms(selectedIntegration, hostId, selectedSiteId);
  const { data: health } = useUniFiHealth(selectedIntegration, hostId, selectedSiteId);

  useEffect(() => {
    if (sites?.data?.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites.data[0].id);
    }
  }, [sites, selectedSiteId]);

  const handleRefresh = () => {
    refreshData(selectedIntegration, hostId, selectedSiteId);
    toast({ title: "Dados atualizados" });
  };

  const devicesList = devices?.data || [];
  const clientsList = clients?.data || [];
  const networksList = networks?.data || [];
  const alarmsList = alarms?.data || [];
  const healthList = health?.data || [];

  const onlineDevices = devicesList.filter((d: any) => d.status === 'online' || d.state === 1).length;
  const offlineDevices = devicesList.length - onlineDevices;
  const wifiClients = clientsList.filter((c: any) => !c.isWired && !c.is_wired).length;
  const wiredClients = clientsList.filter((c: any) => c.isWired || c.is_wired).length;

  const filter = (items: any[], fields: string[], query: string) => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item => fields.some(f => String(item[f] || '').toLowerCase().includes(q)));
  };

  const handleCreateNetwork = async () => {
    if (!newNetwork.name) return;
    try {
      await createNetwork.mutateAsync({
        integrationId: selectedIntegration,
        siteId: selectedSiteId,
        networkData: newNetwork,
      });
      setShowCreateNetwork(false);
      setNewNetwork({ name: '', security: 'wpapsk', x_passphrase: '', enabled: true, is_guest: false });
    } catch (e) { /* handled by mutation */ }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">UniFi Network</h1>
            {currentIntegration && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`text-[10px] h-5 gap-1 ${isLocal ? 'border-orange-500/40 text-orange-400' : 'border-blue-500/40 text-blue-400'}`}>
                    {isLocal ? <Server className="h-2.5 w-2.5" /> : <Cloud className="h-2.5 w-2.5" />}
                    {isLocal ? 'Local' : 'Cloud'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {isLocal ? `Controladora Local — ${currentIntegration.base_url}` : 'UniFi Site Manager (unifi.ui.com)'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unifiIntegrations.length > 1 && (
              <Select value={selectedIntegration} onValueChange={v => { setSelectedIntegration(v); setSelectedSiteId(''); }}>
                <SelectTrigger className="w-40 h-8 bg-card border-border text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unifiIntegrations.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: "Dispositivos", value: devicesList.length, icon: Router, color: "text-primary" },
            { label: "Online", value: onlineDevices, icon: CheckCircle2, color: "text-green-500" },
            { label: "Offline", value: offlineDevices, icon: XCircle, color: offlineDevices > 0 ? "text-destructive" : "text-muted-foreground" },
            { label: "Clientes", value: clientsList.length, icon: Users, color: "text-primary" },
            { label: "Wi-Fi", value: wifiClients, icon: Signal, color: "text-primary" },
            { label: "Redes", value: networksList.length, icon: Network, color: "text-muted-foreground" },
            { label: "Alertas", value: alarmsList.length, icon: AlertTriangle, color: alarmsList.length > 0 ? "text-destructive" : "text-muted-foreground" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
              <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Site selector */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId} disabled={sitesLoading || !sites?.data?.length}>
            <SelectTrigger className="w-56 h-8 bg-card border-border text-xs">
              <Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder={sitesLoading ? "Carregando..." : "Selecione um site..."} />
            </SelectTrigger>
            <SelectContent>
              {(sites?.data || []).map((site: any) => (
                <SelectItem key={site.id} value={site.id} className="text-xs">
                  {site.description || site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error state */}
        {sitesError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{sitesError instanceof Error ? sitesError.message : 'Erro ao carregar sites'}</p>
          </div>
        )}

        {/* Loading */}
        {sitesLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Carregando sites...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {selectedSiteId && !sitesLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="devices" className="text-xs gap-1.5"><Router className="h-3.5 w-3.5" />Dispositivos <Badge variant="secondary" className="h-4 px-1 text-[9px]">{devicesList.length}</Badge></TabsTrigger>
              <TabsTrigger value="clients" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" />Clientes <Badge variant="secondary" className="h-4 px-1 text-[9px]">{clientsList.length}</Badge></TabsTrigger>
              <TabsTrigger value="networks" className="text-xs gap-1.5"><Network className="h-3.5 w-3.5" />Redes <Badge variant="secondary" className="h-4 px-1 text-[9px]">{networksList.length}</Badge></TabsTrigger>
              <TabsTrigger value="alarms" className="text-xs gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Alertas <Badge variant="secondary" className="h-4 px-1 text-[9px]">{alarmsList.length}</Badge></TabsTrigger>
              <TabsTrigger value="health" className="text-xs gap-1.5"><Activity className="h-3.5 w-3.5" />Saúde</TabsTrigger>
            </TabsList>

            {/* DEVICES TAB */}
            <TabsContent value="devices">
              <div className="space-y-3">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Filtrar dispositivos..." value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)} className="pl-8 bg-card border-border h-8 text-xs" />
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  {devicesLoading ? (
                    <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                  ) : filter(devicesList, ['name', 'displayName', 'mac', 'ip', 'model'], deviceFilter).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Dispositivo</TableHead>
                          <TableHead className="text-xs">Modelo</TableHead>
                          <TableHead className="text-xs">IP</TableHead>
                          <TableHead className="text-xs">MAC</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Clientes</TableHead>
                          <TableHead className="text-xs">CPU/Mem</TableHead>
                          <TableHead className="text-xs">Uptime</TableHead>
                          <TableHead className="text-xs">Versão</TableHead>
                          <TableHead className="text-xs">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filter(devicesList, ['name', 'displayName', 'mac', 'ip', 'model'], deviceFilter).map((d: any) => {
                          const isOnline = d.status === 'online' || d.state === 1;
                          const sysStats = d['sys-stats'] || d.sys_stats || {};
                          const rowBg = isOnline
                            ? 'bg-emerald-500/8 hover:bg-emerald-500/15'
                            : 'bg-red-500/10 hover:bg-red-500/18';
                          return (
                            <TableRow key={d._id || d.id || d.mac} className={rowBg}>
                              <TableCell className="text-xs font-medium">
                                <div className="flex items-center gap-2">
                                  {d.type?.includes('uap') ? <Wifi className="h-3.5 w-3.5 text-primary" /> :
                                   d.type?.includes('usw') ? <Network className="h-3.5 w-3.5 text-muted-foreground" /> :
                                   <Router className="h-3.5 w-3.5 text-primary" />}
                                  <span className="truncate max-w-[150px]">{d.displayName || d.name || d.mac}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{d.model || d.model_in_lts || '-'}</TableCell>
                              <TableCell className="text-xs font-mono">{d.ip || '-'}</TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">{d.mac || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={isOnline ? 'default' : 'destructive'} className="text-[10px] h-5">
                                  {isOnline ? 'Online' : 'Offline'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">{d.num_sta ?? d.connectedClients ?? '-'}</TableCell>
                              <TableCell className="text-xs">
                                {(sysStats.cpu != null || sysStats['cpu'] != null) ? (
                                  <span><Cpu className="h-3 w-3 inline mr-0.5" />{Math.round(sysStats.cpu || 0)}% / <HardDrive className="h-3 w-3 inline mr-0.5" />{Math.round(sysStats.mem || 0)}%</span>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-xs">{formatUptime(d.uptime)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{d.version || '-'}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => restartDevice.mutate({ integrationId: selectedIntegration, deviceId: d.mac, siteId: selectedSiteId })}>
                                      <Power className="h-3.5 w-3.5 mr-2" /> Reiniciar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => upgradeDevice.mutate({ integrationId: selectedIntegration, deviceMac: d.mac, siteId: selectedSiteId })}>
                                      <Upload className="h-3.5 w-3.5 mr-2" /> Atualizar Firmware
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => provisionDevice.mutate({ integrationId: selectedIntegration, deviceMac: d.mac, siteId: selectedSiteId })}>
                                      <Zap className="h-3.5 w-3.5 mr-2" /> Provisionar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => locateDevice.mutate({ integrationId: selectedIntegration, deviceMac: d.mac, siteId: selectedSiteId, enabled: true })}>
                                      <MapPin className="h-3.5 w-3.5 mr-2" /> Localizar (LED)
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                      if (confirm(`Tem certeza que deseja remover o dispositivo ${d.displayName || d.name || d.mac}?`)) {
                                        forgetDevice.mutate({ integrationId: selectedIntegration, deviceMac: d.mac, siteId: selectedSiteId });
                                      }
                                    }}>
                                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Esquecer Dispositivo
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-8">Nenhum dispositivo encontrado</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* CLIENTS TAB */}
            <TabsContent value="clients">
              <div className="space-y-3">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Filtrar clientes..." value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="pl-8 bg-card border-border h-8 text-xs" />
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  {clientsLoading ? (
                    <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                  ) : filter(clientsList, ['name', 'hostname', 'mac', 'ip', 'essid', 'network'], clientFilter).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Cliente</TableHead>
                          <TableHead className="text-xs">IP</TableHead>
                          <TableHead className="text-xs">MAC</TableHead>
                          <TableHead className="text-xs">Rede</TableHead>
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs">Sinal</TableHead>
                          <TableHead className="text-xs">↓ RX / ↑ TX</TableHead>
                          <TableHead className="text-xs">AP</TableHead>
                          <TableHead className="text-xs">Uptime</TableHead>
                          <TableHead className="text-xs">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filter(clientsList, ['name', 'hostname', 'mac', 'ip', 'essid', 'network'], clientFilter).map((c: any) => {
                          const isWired = c.isWired || c.is_wired;
                          const networkName = c.essid || c.network || c.ssid || (isWired ? 'LAN' : '-');
                          const apMac = c.ap_mac || c.accessPointMac;
                          const ap = apMac ? devicesList.find((d: any) => d.mac === apMac) : null;
                          const apOnline = ap ? (ap.status === 'online' || ap.state === 1) : null;
                          const rowBg = apOnline === true
                            ? 'bg-emerald-500/8 hover:bg-emerald-500/15'
                            : apOnline === false
                              ? 'bg-red-500/10 hover:bg-red-500/18'
                              : '';
                          return (
                            <TableRow key={c._id || c.id || c.mac} className={rowBg}>
                              <TableCell className="text-xs font-medium">
                                <div className="flex items-center gap-2">
                                  {isWired ? <Network className="h-3.5 w-3.5 text-primary" /> : <Signal className="h-3.5 w-3.5 text-primary" />}
                                  <span className="truncate max-w-[150px]">{c.name || c.hostname || c.oui || c.mac}</span>
                                  {(c.isGuest || c.is_guest) && <Badge variant="outline" className="text-[9px] h-4">Guest</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-mono">{c.ip || c.fixed_ip || '-'}</TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">{c.mac || '-'}</TableCell>
                              <TableCell className="text-xs">{networkName}</TableCell>
                              <TableCell><Badge variant="outline" className="text-[10px] h-5">{isWired ? 'Cabeado' : 'Wi-Fi'}</Badge></TableCell>
                              <TableCell className="text-xs">{!isWired && (c.signal || c.rssi) ? `${c.signal || c.rssi} dBm` : '-'}</TableCell>
                              <TableCell className="text-xs">{formatBytes(c.rx_bytes || c.rxBytes)} / {formatBytes(c.tx_bytes || c.txBytes)}</TableCell>
                              <TableCell className="text-xs">
                                {ap ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${apOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="truncate max-w-[100px]">{ap.name || ap.model || ap.mac}</span>
                                  </div>
                                ) : isWired ? <span className="text-muted-foreground">—</span> : <span className="text-muted-foreground">?</span>}
                              </TableCell>
                              <TableCell className="text-xs">{formatUptime(c.uptime)}</TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost" size="sm" className="h-7 w-7 p-0"
                                      disabled={toggleClientBlock.isPending}
                                      onClick={() => toggleClientBlock.mutate({ integrationId: selectedIntegration, clientId: c.mac, block: true, siteId: selectedSiteId })}
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">Bloquear cliente</TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-8">Nenhum cliente encontrado</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="networks">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Filtrar redes..." value={networkFilter} onChange={e => setNetworkFilter(e.target.value)} className="pl-8 bg-card border-border h-8 text-xs" />
                  </div>
                  {isLocal && (
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowCreateNetwork(true)}>
                      <Plus className="h-3.5 w-3.5" /> Nova Rede WLAN
                    </Button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  {networksLoading ? (
                    <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                  ) : filter(networksList, ['name', 'purpose', 'networkgroup'], networkFilter).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Rede</TableHead>
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs">VLAN</TableHead>
                          <TableHead className="text-xs">Subnet</TableHead>
                          <TableHead className="text-xs">DHCP</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          {isLocal && <TableHead className="text-xs">Ações</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filter(networksList, ['name', 'purpose', 'networkgroup'], networkFilter).map((n: any, idx: number) => {
                          const isWlan = n._source === 'wlanconf' || n.purpose === 'wlan';
                          const purposeLabel = isWlan ? 'WLAN' : (n.purpose === 'corporate' ? 'LAN' : n.purpose === 'wan' ? 'WAN' : n.purpose || 'LAN');
                          return (
                            <TableRow key={`${n._id || n.id || n.name}-${idx}`}>
                              <TableCell className="text-xs font-medium">
                                <div className="flex items-center gap-2">
                                  {isWlan ? <Wifi className="h-3.5 w-3.5 text-primary" /> : <Network className="h-3.5 w-3.5 text-muted-foreground" />}
                                  {n.name}
                                  {n.is_guest && <Badge variant="outline" className="text-[9px] h-4">Guest</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] h-5">{purposeLabel}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{n.vlan_enabled ? (n.vlan || n.vlan_id || '-') : '-'}</TableCell>
                              <TableCell className="text-xs font-mono">{n.ip_subnet || n.ipv4_subnet || '-'}</TableCell>
                              <TableCell className="text-xs">{n.dhcpd_enabled || n.dhcp_enabled ? 'Sim' : n.purpose === 'wan' ? '-' : 'Não'}</TableCell>
                              <TableCell>
                                <Badge variant={n.enabled !== false ? 'default' : 'secondary'} className="text-[10px] h-5">
                                  {n.enabled !== false ? 'Ativa' : 'Inativa'}
                                </Badge>
                              </TableCell>
                              {isLocal && (
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {isWlan && (
                                      <>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                              onClick={() => toggleNetwork.mutate({ integrationId: selectedIntegration, siteId: selectedSiteId, networkId: n._id || n.id, enabled: !n.enabled })}>
                                              {n.enabled ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent className="text-xs">{n.enabled ? 'Desativar' : 'Ativar'}</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                                              onClick={() => { if (confirm('Remover esta rede?')) deleteNetwork.mutate({ integrationId: selectedIntegration, siteId: selectedSiteId, networkId: n._id || n.id }); }}>
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent className="text-xs">Remover rede</TooltipContent>
                                        </Tooltip>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-8">Nenhuma rede encontrada</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ALARMS TAB */}
            <TabsContent value="alarms">
              <div className="space-y-3">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Filtrar alertas..." value={alarmFilter} onChange={e => setAlarmFilter(e.target.value)} className="pl-8 bg-card border-border h-8 text-xs" />
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  {alarmsLoading ? (
                    <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                  ) : filter(alarmsList, ['msg', 'message', 'key', 'subsystem'], alarmFilter).length > 0 ? (
                    <div className="divide-y divide-border">
                      {filter(alarmsList, ['msg', 'message', 'key', 'subsystem'], alarmFilter).map((a: any, i: number) => {
                        const alarmMsg = a.msg || a.message || a.key || 'Alerta desconhecido';
                        const alarmTime = a.time || a.datetime;
                        return (
                          <div key={a._id || a.id || i} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${a.archived ? 'text-muted-foreground' : 'text-destructive'}`} />
                              <span className="text-xs truncate">{alarmMsg}</span>
                              {a.subsystem && <Badge variant="outline" className="text-[9px] h-4 shrink-0">{a.subsystem}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {alarmTime && new Date(typeof alarmTime === 'number' && alarmTime < 1e12 ? alarmTime * 1000 : alarmTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <Badge variant={a.archived ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                                {a.archived ? 'Arquivado' : 'Ativo'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-8">Nenhum alerta</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* HEALTH TAB */}
            <TabsContent value="health">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {healthList.length > 0 ? healthList.map((h: any, i: number) => (
                  <div key={h.subsystem || i} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold capitalize">{h.subsystem || 'Sistema'}</span>
                      <Badge variant={h.status === 'ok' || h.status === 'healthy' ? 'default' : 'destructive'} className="text-[10px] h-5">
                        {h.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {h.num_adopted != null && <div><span className="text-muted-foreground">Adotados:</span> {h.num_adopted}</div>}
                      {h.num_user != null && <div><span className="text-muted-foreground">Clientes:</span> {h.num_user}</div>}
                      {h.num_disconnected != null && <div><span className="text-muted-foreground">Desconect:</span> {h.num_disconnected}</div>}
                      {h.tx_bytes != null && <div><span className="text-muted-foreground">TX:</span> {formatBytes(h.tx_bytes)}</div>}
                      {h.rx_bytes != null && <div><span className="text-muted-foreground">RX:</span> {formatBytes(h.rx_bytes)}</div>}
                      {h['lan-num_user'] != null && <div><span className="text-muted-foreground">LAN Users:</span> {h['lan-num_user']}</div>}
                      {h.latency != null && <div><span className="text-muted-foreground">Latência:</span> {h.latency}ms</div>}
                      {h.uptime != null && <div><span className="text-muted-foreground">Uptime:</span> {formatUptime(h.uptime)}</div>}
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-xs text-muted-foreground py-8 col-span-full">Dados de saúde indisponíveis</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Create Network Dialog */}
        <Dialog open={showCreateNetwork} onOpenChange={setShowCreateNetwork}>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Rede WLAN</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-xs">Nome da Rede (SSID)</Label><Input value={newNetwork.name} onChange={e => setNewNetwork(p => ({ ...p, name: e.target.value }))} placeholder="MinhaRedeWiFi" className="mt-1" /></div>
              <div><Label className="text-xs">Segurança</Label>
                <Select value={newNetwork.security} onValueChange={v => setNewNetwork(p => ({ ...p, security: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wpapsk">WPA Personal</SelectItem>
                    <SelectItem value="wpa2psk">WPA2 Personal</SelectItem>
                    <SelectItem value="open">Aberta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newNetwork.security !== 'open' && (
                <div><Label className="text-xs">Senha</Label><Input type="password" value={newNetwork.x_passphrase} onChange={e => setNewNetwork(p => ({ ...p, x_passphrase: e.target.value }))} placeholder="Mínimo 8 caracteres" className="mt-1" /></div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={newNetwork.is_guest} onCheckedChange={v => setNewNetwork(p => ({ ...p, is_guest: v }))} />
                <Label className="text-xs">Rede de convidados</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateNetwork(false)}>Cancelar</Button>
              <Button onClick={handleCreateNetwork} disabled={!newNetwork.name || createNetwork.isPending}>
                {createNetwork.isPending ? 'Criando...' : 'Criar Rede'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default UniFiSimpleDashboard;
