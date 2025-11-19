import { useEffect, useState, useMemo } from 'react';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useMikrotikContext } from '@/contexts/MikrotikContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Loader2, RefreshCw, Wifi, Users, Clock, Shield, 
  Network, KeyRound, Globe, Activity
} from 'lucide-react';
import { MikrotikResourceMonitor } from './MikrotikResourceMonitor';
import { cn } from '@/lib/utils';

export const MikrotikDashboard = () => {
  const { callAPI } = useMikrotikAPI();
  const { selectedClient } = useMikrotikContext();
  
  // Estados básicos
  const [identity, setIdentity] = useState<any>(null);
  const [resource, setResource] = useState<any>(null);
  const [routerboard, setRouterboard] = useState<any>(null);
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [dhcpLeases, setDhcpLeases] = useState<any[]>([]);
  
  // Estados de estatísticas
  const [firewallRules, setFirewallRules] = useState<any[]>([]);
  const [natRules, setNatRules] = useState<any[]>([]);
  const [vpnSecrets, setVpnSecrets] = useState<any[]>([]);
  const [vpnActive, setVpnActive] = useState<any[]>([]);
  const [ipAddresses, setIpAddresses] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados do dashboard...');
      
      const results = await Promise.allSettled([
        callAPI('/system/identity'),
        callAPI('/system/resource'),
        callAPI('/system/routerboard'),
        callAPI('/interface'),
        callAPI('/ip/dhcp-server/lease'),
        callAPI('/ip/firewall/filter'),
        callAPI('/ip/firewall/nat'),
        callAPI('/ppp/secret'),
        callAPI('/ppp/active'),
        callAPI('/ip/address'),
      ]);

      const [
        identityResult,
        resourceResult,
        routerboardResult,
        interfacesResult,
        leasesResult,
        firewallResult,
        natResult,
        vpnSecretsResult,
        vpnActiveResult,
        ipAddressesResult
      ] = results;

      if (identityResult.status === 'fulfilled' && identityResult.value) {
        const data = Array.isArray(identityResult.value) ? identityResult.value[0] : identityResult.value;
        setIdentity(data);
        console.log('Identity loaded:', data);
      }
      
      if (resourceResult.status === 'fulfilled' && resourceResult.value) {
        const data = Array.isArray(resourceResult.value) ? resourceResult.value[0] : resourceResult.value;
        setResource(data);
        console.log('Resource loaded:', data);
      }
      
      if (routerboardResult.status === 'fulfilled' && routerboardResult.value) {
        const data = Array.isArray(routerboardResult.value) ? routerboardResult.value[0] : routerboardResult.value;
        setRouterboard(data);
        console.log('Routerboard loaded:', data);
      }
      
      if (interfacesResult.status === 'fulfilled' && interfacesResult.value) {
        const data = Array.isArray(interfacesResult.value) ? interfacesResult.value : [interfacesResult.value];
        setInterfaces(data);
        console.log('Interfaces loaded:', data.length);
      }
      
      if (leasesResult.status === 'fulfilled' && leasesResult.value) {
        const data = Array.isArray(leasesResult.value) ? leasesResult.value : [leasesResult.value];
        setDhcpLeases(data);
        console.log('DHCP Leases loaded:', data.length, data);
      } else {
        console.error('DHCP failed:', leasesResult);
      }
      
      if (firewallResult.status === 'fulfilled' && firewallResult.value) {
        const data = Array.isArray(firewallResult.value) ? firewallResult.value : [firewallResult.value];
        setFirewallRules(data);
        console.log('Firewall rules loaded:', data.length);
      }
      
      if (natResult.status === 'fulfilled' && natResult.value) {
        const data = Array.isArray(natResult.value) ? natResult.value : [natResult.value];
        setNatRules(data);
        console.log('NAT rules loaded:', data.length);
      }
      
      if (vpnSecretsResult.status === 'fulfilled' && vpnSecretsResult.value) {
        const data = Array.isArray(vpnSecretsResult.value) ? vpnSecretsResult.value : [vpnSecretsResult.value];
        setVpnSecrets(data);
        console.log('VPN Secrets loaded:', data.length);
      }
      
      if (vpnActiveResult.status === 'fulfilled' && vpnActiveResult.value) {
        const data = Array.isArray(vpnActiveResult.value) ? vpnActiveResult.value : [vpnActiveResult.value];
        setVpnActive(data);
        console.log('VPN Active loaded:', data.length);
      }
      
      if (ipAddressesResult.status === 'fulfilled' && ipAddressesResult.value) {
        const data = Array.isArray(ipAddressesResult.value) ? ipAddressesResult.value : [ipAddressesResult.value];
        setIpAddresses(data);
        console.log('IP Addresses loaded:', data.length);
      }
      
      setLastUpdate(new Date());
      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (selectedClient) {
      console.log('🎯 Dashboard carregando dados para:', selectedClient.name);
      loadData();
    }
  }, [selectedClient]);


  // Cálculos memoizados
  const stats = useMemo(() => {
    const activeInterfaces = interfaces.filter(i => i.running).length;
    const activeFirewall = firewallRules.filter(r => r.disabled !== "true").length;
    const activeNat = natRules.filter(r => r.disabled !== "true").length;
    const enabledVpn = vpnSecrets.filter(u => u.disabled !== "true").length;
    const connectedVpn = vpnActive.length;
    const activeDhcp = dhcpLeases.filter(l => l.status === "bound").length;
    const validIps = ipAddresses.filter(ip => !ip.invalid).length;

    return {
      activeInterfaces,
      totalInterfaces: interfaces.length,
      activeFirewall,
      totalFirewall: firewallRules.length,
      activeNat,
      totalNat: natRules.length,
      enabledVpn,
      connectedVpn,
      activeDhcp,
      totalDhcp: dhcpLeases.length,
      validIps
    };
  }, [interfaces, firewallRules, natRules, vpnSecrets, vpnActive, dhcpLeases, ipAddresses]);

  const formatUptime = (uptime: string) => {
    if (!uptime) return 'N/A';
    const parts = uptime.match(/(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?/);
    if (!parts) return uptime;
    
    const weeks = parts[1] ? parseInt(parts[1]) : 0;
    const days = parts[2] ? parseInt(parts[2]) : 0;
    const hours = parts[3] ? parseInt(parts[3]) : 0;
    
    if (weeks > 0) return `${weeks}s ${days}d`;
    if (days > 0) return `${days}d ${hours}h`;
    return uptime;
  };

  const getUptimeBadge = (uptime: string) => {
    if (!uptime) return 'secondary';
    const days = parseInt(uptime.match(/(\d+)d/)?.[1] || '0');
    if (days >= 7) return 'default';
    if (days >= 1) return 'secondary';
    return 'secondary';
  };

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum cliente selecionado</p>
        </div>
      </div>
    );
  }

  if (loading && !identity) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen rounded-xl">
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <Badge variant="outline" className="text-sm">
              <Network className="h-3 w-3 mr-1" />
              {selectedClient.name}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Visão geral do MikroTik • Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <Button onClick={loadData} disabled={loading} size="sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="bg-purple-900/20 border-purple-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-purple-300">Dispositivo</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-purple-400">{identity?.name || 'MikroTik'}</div>
            <p className="text-xs text-purple-300/70 mt-1">
              {routerboard?.model || 'RouterOS'}
            </p>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs bg-purple-800/50 text-purple-200 border-purple-600/30">
                RB: v{routerboard?.['current-firmware'] || routerboard?.version || 'N/A'}
              </Badge>
              <Badge variant="outline" className="text-xs border-purple-600/30 text-purple-200">
                OS: v{resource?.version || 'N/A'}
              </Badge>
            </div>
            <Badge className="mt-2 bg-purple-600/80 text-white" variant="default">Online</Badge>
          </CardContent>
        </Card>

        <Card className="bg-blue-900/20 border-blue-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-blue-300">Interfaces</CardTitle>
            <Wifi className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-blue-400">{stats.activeInterfaces}/{stats.totalInterfaces}</div>
            <Progress value={(stats.activeInterfaces / stats.totalInterfaces) * 100} className="mt-2 bg-blue-900/30" />
            <p className="text-xs text-blue-300/70 mt-2">Ativas</p>
          </CardContent>
        </Card>

        <Card className="bg-green-900/20 border-green-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-green-300">DHCP</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-green-400">{stats.activeDhcp}</div>
            <Progress value={(stats.activeDhcp / stats.totalDhcp) * 100} className="mt-2 bg-green-900/30" />
            <p className="text-xs text-green-300/70 mt-2">de {stats.totalDhcp} leases</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-900/20 border-yellow-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-yellow-300">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-yellow-400">{formatUptime(resource?.uptime)}</div>
            <Badge className="mt-2 bg-yellow-600/80 text-white" variant={getUptimeBadge(resource?.uptime)}>Estável</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recursos do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <MikrotikResourceMonitor />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-white">Firewall</CardTitle>
            <Shield className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-white">{stats.activeFirewall}/{stats.totalFirewall}</div>
            <Progress value={(stats.activeFirewall / stats.totalFirewall) * 100} className="mt-2 bg-red-900/30" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-white">NAT</CardTitle>
            <Network className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-white">{stats.activeNat}/{stats.totalNat}</div>
            <Progress value={(stats.activeNat / stats.totalNat) * 100} className="mt-2 bg-green-900/30" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-white">VPN</CardTitle>
            <KeyRound className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-white">{stats.connectedVpn}/{stats.enabledVpn}</div>
            <Progress value={stats.enabledVpn > 0 ? (stats.connectedVpn / stats.enabledVpn) * 100 : 0} className="mt-2 bg-yellow-900/30" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-white">IPs</CardTitle>
            <Globe className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-white">{stats.validIps}</div>
            <Badge className="mt-2 bg-blue-600/80 text-white" variant="secondary">Configurados</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Interfaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {interfaces.slice(0, 6).map((iface: any) => (
              <div key={iface['.id']} className="flex items-center justify-between p-2 border border-slate-700 rounded hover:bg-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", iface.running ? "bg-green-500" : "bg-red-500")} />
                  <span className="font-medium text-sm text-slate-200">{iface.name}</span>
                </div>
                <Badge variant={iface.running ? "default" : "secondary"} className={cn("text-xs", iface.running ? "bg-green-600/80 text-white" : "bg-slate-700 text-slate-300")}>{iface.running ? "UP" : "DOWN"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
