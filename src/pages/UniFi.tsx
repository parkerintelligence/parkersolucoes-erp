import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Network,
  Settings,
  CheckCircle,
  XCircle,
  TestTube,
  Shield,
  Zap
} from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { useUniFiAPI } from '@/hooks/useUniFiAPI';
import UniFiConnectionDiagnostic from '@/components/UniFiConnectionDiagnostic';
import { useToast } from '@/hooks/use-toast';

const UniFi = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const { toast } = useToast();
  
  const unifiIntegration = integrations?.find(int => int.type === 'unifi' && int.is_active);
  
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Configuration form state
  const [formData, setFormData] = useState({
    name: 'Controladora UniFi',
    base_url: '',
    username: '',
    password: '',
    port: 8443,
    use_ssl: true,
    ignore_ssl: false,
    is_active: true
  });

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
  const { data: sitesData, isLoading: sitesLoading, error: sitesError } = useUniFiSites(unifiIntegration?.id || '', 'local-controller');
  const { data: devicesData, isLoading: devicesLoading } = useUniFiDevices(unifiIntegration?.id || '', 'local-controller', selectedSite);
  const { data: clientsData, isLoading: clientsLoading } = useUniFiClients(unifiIntegration?.id || '', 'local-controller', selectedSite);
  const { data: networksData, isLoading: networksLoading } = useUniFiNetworks(unifiIntegration?.id || '', 'local-controller', selectedSite);
  const { data: alarmsData, isLoading: alarmsLoading } = useUniFiAlarms(unifiIntegration?.id || '', 'local-controller', selectedSite);
  const { data: stats, isLoading: statsLoading } = useUniFiStats(unifiIntegration?.id || '', 'local-controller', selectedSite);

  // Extract data safely
  const sites = sitesData?.data || [];
  const devices = devicesData?.data || [];
  const clients = clientsData?.data || [];
  const networks = networksData?.data || [];
  const alarms = alarmsData?.data || [];

  // Auto-select first site when sites are loaded
  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0].name || sites[0].id);
    }
  }, [sites, selectedSite]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !unifiIntegration) return;
    
    const interval = setInterval(() => {
      refreshData(unifiIntegration.id, 'local-controller', selectedSite);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, unifiIntegration, selectedSite, refreshData]);

  // Load existing integration data for editing
  useEffect(() => {
    if (unifiIntegration) {
      setFormData({
        name: unifiIntegration.name || 'Controladora UniFi',
        base_url: unifiIntegration.base_url || '',
        username: unifiIntegration.username || '',
        password: unifiIntegration.password || '',
        port: unifiIntegration.port || 8443,
        use_ssl: unifiIntegration.use_ssl ?? true,
        ignore_ssl: false, // Default value since property might not exist
        is_active: unifiIntegration.is_active ?? true
      });
    }
  }, [unifiIntegration]);

  const isLoadingData = sitesLoading || devicesLoading || clientsLoading || networksLoading || alarmsLoading || statsLoading;

  const handleRefresh = () => {
    if (unifiIntegration) {
      refreshData(unifiIntegration.id, 'local-controller', selectedSite);
    }
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const integrationData = {
        type: 'unifi',
        name: formData.name,
        base_url: formData.base_url,
        username: formData.username,
        password: formData.password,
        port: formData.port,
        use_ssl: formData.use_ssl,
        ignore_ssl: formData.ignore_ssl,
        is_active: formData.is_active
      };

      if (unifiIntegration) {
        await updateIntegration.mutateAsync({
          id: unifiIntegration.id,
          updates: integrationData
        });
        toast({
          title: "Configuração atualizada",
          description: "Configuração da controladora UniFi atualizada com sucesso.",
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
        toast({
          title: "Controladora configurada",
          description: "Nova controladora UniFi configurada com sucesso.",
        });
      }
      
      setShowConfig(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar a configuração da controladora.",
        variant: "destructive",
      });
    }
  };

  // Connection status indicator
  const getConnectionStatus = () => {
    if (sitesError) {
      return { status: 'error', text: 'Erro de Conexão', color: 'text-red-400 border-red-400' };
    }
    if (isLoadingData) {
      return { status: 'loading', text: 'Conectando...', color: 'text-yellow-400 border-yellow-400' };
    }
    if (sites.length > 0) {
      return { status: 'connected', text: 'Conectado', color: 'text-green-400 border-green-400' };
    }
    return { status: 'disconnected', text: 'Desconectado', color: 'text-gray-400 border-gray-400' };
  };

  const connectionStatus = getConnectionStatus();

  if (!unifiIntegration && !showConfig) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <Wifi className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Controladora UniFi</h1>
              <p className="text-muted-foreground mt-2">Configure sua controladora UniFi local para começar</p>
            </div>
            <Button onClick={() => setShowConfig(true)} size="lg">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Controladora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfig || !unifiIntegration) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Configuração da Controladora UniFi</CardTitle>
                    <CardDescription>
                      Configure o acesso à sua controladora UniFi local
                    </CardDescription>
                  </div>
                </div>
                {unifiIntegration && (
                  <Button variant="outline" onClick={() => setShowConfig(false)}>
                    Voltar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfigSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Controladora</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: UniFi Principal"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="port">Porta</Label>
                    <Input
                      id="port"
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 8443 })}
                      placeholder="8443"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="base_url">URL da Controladora *</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://192.168.1.1:8443 ou https://unifi.empresa.com:8443"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL completa da sua controladora UniFi local (incluindo porta se diferente de 8443)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuário *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="admin"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Configurações de Segurança
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Usar SSL/HTTPS</Label>
                      <p className="text-sm text-muted-foreground">Conexão segura (recomendado)</p>
                    </div>
                    <Switch
                      checked={formData.use_ssl}
                      onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ignorar certificados SSL inválidos</Label>
                      <p className="text-sm text-muted-foreground">Útil para certificados auto-assinados</p>
                    </div>
                    <Switch
                      checked={formData.ignore_ssl}
                      onCheckedChange={(checked) => setFormData({ ...formData, ignore_ssl: checked })}
                    />
                  </div>
                </div>

                <Alert>
                  <Wifi className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Controladora UniFi Local:</strong><br />
                    • Acesso direto à sua controladora UniFi<br />
                    • Mais rápido e confiável (rede local)<br />
                    • Funciona mesmo sem internet<br />
                    • Suporta certificados auto-assinados<br />
                    • Use as credenciais do admin da controladora
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Integração Ativa</Label>
                    <p className="text-sm text-muted-foreground">Ativar esta integração</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit"
                    disabled={createIntegration.isPending || updateIntegration.isPending}
                  >
                    {unifiIntegration ? 'Atualizar' : 'Criar'} Configuração
                  </Button>
                  {unifiIntegration && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowConfig(false)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>

              {unifiIntegration && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-4">Teste de Conexão</h3>
                  <UniFiConnectionDiagnostic integrationId={unifiIntegration.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Controladora UniFi</h1>
              <p className="text-muted-foreground">Gerenciamento e monitoramento da rede UniFi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={connectionStatus.color}>
              {connectionStatus.status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
              {connectionStatus.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
              {connectionStatus.status === 'loading' && <Activity className="h-3 w-3 mr-1 animate-spin" />}
              {connectionStatus.text}
            </Badge>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
            
            <Button 
              onClick={handleRefresh}
              disabled={isLoadingData}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button 
              onClick={() => setShowConfig(true)}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Site Selector */}
        {sites.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5" />
                Site UniFi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSite} onValueChange={handleSiteChange}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Selecione um site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site: any) => (
                    <SelectItem key={site.name || site.id} value={site.name || site.id}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{site.desc || site.name || site.id}</span>
                        {site.health && site.health.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {site.health.filter((h: any) => h.status === 'ok').length}/{site.health.length} OK
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Dispositivos Online</CardTitle>
                <Server className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.online_devices || 0}</div>
              <p className="text-xs text-muted-foreground">de {stats?.total_devices || 0} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Clientes Conectados</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_clients || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.wireless_clients || 0} WiFi • {stats?.wired_clients || 0} Ethernet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Redes Ativas</CardTitle>
                <Network className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{networks.filter((n: any) => n.enabled).length}</div>
              <p className="text-xs text-muted-foreground">de {networks.length} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Alarmes Ativos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{alarms.filter((a: any) => !a.archived).length}</div>
              <p className="text-xs text-muted-foreground">não arquivados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="networks">Redes</TabsTrigger>
            <TabsTrigger value="alarms">Alarmes</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Dispositivos UniFi ({devices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devices.length > 0 ? (
                  <div className="space-y-3">
                    {devices.map((device: any) => (
                      <div key={device._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${device.state === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <Router className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{device.name || device.model}</p>
                            <p className="text-sm text-muted-foreground">{device.ip} • {device.model}</p>
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
                              hostId: 'local-controller',
                              deviceId: device.mac,
                              siteId: selectedSite
                            })}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum dispositivo encontrado</p>
                    <p className="text-sm">Verifique se há dispositivos configurados no site selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Conectados ({clients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length > 0 ? (
                  <div className="space-y-3">
                    {clients.slice(0, 20).map((client: any) => (
                      <div key={client._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {client.is_wired ? (
                            <Monitor className="h-5 w-5 text-green-500" />
                          ) : (
                            <Smartphone className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <p className="font-medium">{client.name || client.hostname || 'Dispositivo'}</p>
                            <p className="text-sm text-muted-foreground">{client.ip} • {client.mac}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={client.is_wired ? 'default' : 'secondary'}>
                            {client.is_wired ? 'Ethernet' : 'WiFi'}
                          </Badge>
                          {client.signal && (
                            <Badge variant="outline">
                              <Signal className="h-3 w-3 mr-1" />
                              {client.signal}dBm
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleClientBlock.mutate({
                              integrationId: unifiIntegration.id,
                              hostId: 'local-controller',
                              clientId: client.mac,
                              block: true,
                              siteId: selectedSite
                            })}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {clients.length > 20 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Mostrando 20 de {clients.length} clientes</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum cliente conectado</p>
                    <p className="text-sm">Não há dispositivos conectados no site selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="networks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Redes Configuradas ({networks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {networks.length > 0 ? (
                  <div className="space-y-3">
                    {networks.map((network: any) => (
                      <div key={network._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-medium">{network.name}</p>
                            <p className="text-sm text-muted-foreground">{network.purpose}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={network.enabled ? 'default' : 'secondary'}>
                            {network.enabled ? 'Ativa' : 'Inativa'}
                          </Badge>
                          {network.security && (
                            <Badge variant="outline">
                              <Shield className="h-3 w-3 mr-1" />
                              {network.security}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma rede configurada</p>
                    <p className="text-sm">Configure redes WiFi no site selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alarms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alarmes do Sistema ({alarms.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alarms.length > 0 ? (
                  <div className="space-y-3">
                    {alarms.filter((alarm: any) => !alarm.archived).map((alarm: any) => (
                      <div key={alarm._id} className="flex items-start gap-3 p-4 border rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{alarm.msg}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alarm.time * 1000).toLocaleString()} • {alarm.subsystem}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {alarm.key}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum alarme ativo</p>
                    <p className="text-sm">Sistema funcionando normalmente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UniFi;