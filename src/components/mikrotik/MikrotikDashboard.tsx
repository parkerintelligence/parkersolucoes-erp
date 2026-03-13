import { useEffect, useState, useMemo } from 'react';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useMikrotikContext } from '@/contexts/MikrotikContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Loader2, RefreshCw, Wifi, Users, Clock, Shield, 
  Network, KeyRound, Globe, Activity, AlertTriangle
} from 'lucide-react';
import { MikrotikResourceMonitor } from './MikrotikResourceMonitor';
import { cn } from '@/lib/utils';

const ENDPOINTS = [
  '/system/identity',
  '/system/resource',
  '/system/routerboard',
  '/interface',
  '/ip/dhcp-server/lease',
  '/ip/firewall/filter',
  '/ip/firewall/nat',
  '/ppp/secret',
  '/ppp/active',
  '/ip/address',
];

export const MikrotikDashboard = () => {
  const { callBatchAPI } = useMikrotikAPI();
  const { selectedClient } = useMikrotikContext();
  
  const [identity, setIdentity] = useState<any>(null);
  const [resource, setResource] = useState<any>(null);
  const [routerboard, setRouterboard] = useState<any>(null);
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [dhcpLeases, setDhcpLeases] = useState<any[]>([]);
  const [firewallRules, setFirewallRules] = useState<any[]>([]);
  const [natRules, setNatRules] = useState<any[]>([]);
  const [vpnSecrets, setVpnSecrets] = useState<any[]>([]);
  const [vpnActive, setVpnActive] = useState<any[]>([]);
  const [ipAddresses, setIpAddresses] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      setConnectionError(null);
      
      const results = await callBatchAPI(ENDPOINTS);

      // Helper to extract data
      const get = (ep: string) => results[ep]?.data;
      const getArr = (ep: string) => {
        const d = get(ep);
        return Array.isArray(d) ? d : d ? [d] : [];
      };
      const getSingle = (ep: string) => {
        const d = get(ep);
        return Array.isArray(d) ? d[0] : d;
      };

      // Check if all errored (timeout)
      const allFailed = ENDPOINTS.every(ep => results[ep]?.error);
      if (allFailed) {
        const firstError = results[ENDPOINTS[0]]?.error;
        setConnectionError(firstError || 'Não foi possível conectar com o MikroTik');
        setLoading(false);
        return;
      }

      setIdentity(getSingle('/system/identity'));
      setResource(getSingle('/system/resource'));
      setRouterboard(getSingle('/system/routerboard'));
      setInterfaces(getArr('/interface'));
      setDhcpLeases(getArr('/ip/dhcp-server/lease'));
      setFirewallRules(getArr('/ip/firewall/filter'));
      setNatRules(getArr('/ip/firewall/nat'));
      setVpnSecrets(getArr('/ppp/secret'));
      setVpnActive(getArr('/ppp/active'));
      setIpAddresses(getArr('/ip/address'));
      
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setConnectionError(error.message || 'Erro ao conectar com o MikroTik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadData();
    }
  }, [selectedClient]);

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

  // Connection error state
  if (connectionError && !identity) {
    return (
      <div className="space-y-4 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[400px] rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Dashboard</h2>
            <Badge variant="outline" className="text-sm border-red-500/30 text-red-400">
              <Network className="h-3 w-3 mr-1" />
              {selectedClient.name}
            </Badge>
          </div>
          <Button onClick={loadData} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Tentar novamente
          </Button>
        </div>
        
        <Card className="bg-red-950/30 border-red-600/30">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-400 mb-2">Falha na conexão com o MikroTik</h3>
            <p className="text-red-300/80 text-sm max-w-md mx-auto mb-4">
              {connectionError}
            </p>
            <div className="text-xs text-red-300/50 space-y-1 max-w-sm mx-auto">
              <p>Verifique se:</p>
              <ul className="list-disc list-inside text-left space-y-0.5">
                <li>O dispositivo MikroTik está ligado e acessível pela internet</li>
                <li>A API REST (www-ssl ou www) está habilitada no MikroTik</li>
                <li>O endereço <code className="bg-red-900/50 px-1 rounded">{selectedClient.base_url}</code> está correto</li>
                <li>As credenciais (usuário/senha) estão corretas</li>
                <li>O firewall do MikroTik permite conexões na porta da API</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !identity) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Conectando com {selectedClient.name}...</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen rounded-xl">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-purple-900/20 border-purple-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-purple-300">Dispositivo</CardTitle>
            <Activity className="h-3 w-3 text-purple-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-purple-400">{identity?.name || 'MikroTik'}</div>
            <p className="text-[10px] text-purple-300/70 mt-0.5">{routerboard?.model || 'RouterOS'}</p>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 bg-purple-800/50 text-purple-200 border-purple-600/30">
                RB: v{routerboard?.['current-firmware'] || routerboard?.version || 'N/A'}
              </Badge>
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 border-purple-600/30 text-purple-200">
                OS: v{resource?.version || 'N/A'}
              </Badge>
            </div>
            <Badge className="mt-1.5 text-[9px] py-0 px-1.5 h-4 bg-purple-600/80 text-white" variant="default">Online</Badge>
          </CardContent>
        </Card>

        <Card className="bg-blue-900/20 border-blue-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-blue-300">Interfaces</CardTitle>
            <Wifi className="h-3 w-3 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-blue-400">{stats.activeInterfaces}/{stats.totalInterfaces}</div>
            <Progress value={stats.totalInterfaces > 0 ? (stats.activeInterfaces / stats.totalInterfaces) * 100 : 0} className="mt-1.5 h-1.5 bg-blue-900/30" />
            <p className="text-[10px] text-blue-300/70 mt-1.5">Ativas</p>
          </CardContent>
        </Card>

        <Card className="bg-green-900/20 border-green-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-green-300">DHCP</CardTitle>
            <Users className="h-3 w-3 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-green-400">{stats.activeDhcp}</div>
            <Progress value={stats.totalDhcp > 0 ? (stats.activeDhcp / stats.totalDhcp) * 100 : 0} className="mt-1.5 h-1.5 bg-green-900/30" />
            <p className="text-[10px] text-green-300/70 mt-1.5">de {stats.totalDhcp} leases</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-900/20 border-yellow-600/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-yellow-300">Uptime</CardTitle>
            <Clock className="h-3 w-3 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-yellow-400">{formatUptime(resource?.uptime)}</div>
            <Badge className="mt-1.5 text-[9px] py-0 px-1.5 h-4 bg-yellow-600/80 text-white" variant={getUptimeBadge(resource?.uptime)}>Estável</Badge>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-white">Firewall</CardTitle>
            <Shield className="h-3 w-3 text-red-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-white">{stats.activeFirewall}/{stats.totalFirewall}</div>
            <Progress value={stats.totalFirewall > 0 ? (stats.activeFirewall / stats.totalFirewall) * 100 : 0} className="mt-1.5 h-1.5 bg-red-900/30" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-white">NAT</CardTitle>
            <Network className="h-3 w-3 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-white">{stats.activeNat}/{stats.totalNat}</div>
            <Progress value={stats.totalNat > 0 ? (stats.activeNat / stats.totalNat) * 100 : 0} className="mt-1.5 h-1.5 bg-green-900/30" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-white">VPN</CardTitle>
            <KeyRound className="h-3 w-3 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-white">{stats.connectedVpn}/{stats.enabledVpn}</div>
            <Progress value={stats.enabledVpn > 0 ? (stats.connectedVpn / stats.enabledVpn) * 100 : 0} className="mt-1.5 h-1.5 bg-yellow-900/30" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-[10px] font-medium text-white">IPs</CardTitle>
            <Globe className="h-3 w-3 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold text-white">{stats.validIps}</div>
            <Badge className="mt-1.5 text-[9px] py-0 px-1.5 h-4 bg-blue-600/80 text-white" variant="secondary">Configurados</Badge>
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
