import { useEffect, useState, useMemo } from 'react';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Loader2, RefreshCw, Wifi, Users, Clock, Shield, 
  Network, KeyRound, Globe, Activity
} from 'lucide-react';
import { MikrotikResourceMonitor } from './MikrotikResourceMonitor';
import { 
  LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export const MikrotikDashboard = () => {
  const { callAPI } = useMikrotikAPI();
  
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
  
  // Estados de gráficos
  const [resourceHistory, setResourceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const MAX_HISTORY = 12; // Últimos 12 registros (1 minuto com refresh de 5s)

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        identityData,
        resourceData,
        routerboardData,
        interfacesData,
        leasesData,
        firewallData,
        natData,
        vpnSecretsData,
        vpnActiveData,
        ipAddressesData
      ] = await Promise.all([
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

      if (identityData?.[0]) setIdentity(identityData[0]);
      if (resourceData?.[0]) setResource(resourceData[0]);
      if (routerboardData?.[0]) setRouterboard(routerboardData[0]);
      if (interfacesData) setInterfaces(interfacesData);
      if (leasesData) setDhcpLeases(leasesData);
      if (firewallData) setFirewallRules(firewallData);
      if (natData) setNatRules(natData);
      if (vpnSecretsData) setVpnSecrets(vpnSecretsData);
      if (vpnActiveData) setVpnActive(vpnActiveData);
      if (ipAddressesData) setIpAddresses(ipAddressesData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  // Atualizar histórico de recursos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await callAPI('/system/resource');
        if (data && data[0]) {
          const newEntry = {
            time: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            }),
            cpu: parseInt(data[0]['cpu-load']) || 0,
            memory: Math.round(((parseInt(data[0]['total-memory']) - parseInt(data[0]['free-memory'])) / parseInt(data[0]['total-memory']) * 100)) || 0
          };
          setResourceHistory(prev => [...prev.slice(-MAX_HISTORY + 1), newEntry]);
        }
      } catch (error) {
        console.error('Erro ao atualizar histórico:', error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  // Dados para gráfico de pizza
  const pieData = [
    { name: 'Firewall', value: stats.totalFirewall },
    { name: 'NAT', value: stats.totalNat },
    { name: 'VPN', value: stats.enabledVpn },
    { name: 'IPs', value: stats.validIps },
  ].filter(item => item.value > 0);

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

  if (loading && !identity) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do MikroTik • Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <Button onClick={loadData} disabled={loading} size="sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivo</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{identity?.name || 'MikroTik'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {routerboard?.model || 'RouterOS'}
            </p>
            <p className="text-xs text-muted-foreground">
              v{resource?.version || 'N/A'}
            </p>
            <Badge className="mt-2" variant="default">Online</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interfaces</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInterfaces}/{stats.totalInterfaces}</div>
            <Progress value={(stats.activeInterfaces / stats.totalInterfaces) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DHCP</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDhcp}</div>
            <Progress value={(stats.activeDhcp / stats.totalDhcp) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">de {stats.totalDhcp} leases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(resource?.uptime)}</div>
            <Badge className="mt-2" variant={getUptimeBadge(resource?.uptime)}>Estável</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recursos do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <MikrotikResourceMonitor />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firewall</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFirewall}/{stats.totalFirewall}</div>
            <Progress value={(stats.activeFirewall / stats.totalFirewall) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NAT</CardTitle>
            <Network className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeNat}/{stats.totalNat}</div>
            <Progress value={(stats.activeNat / stats.totalNat) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VPN</CardTitle>
            <KeyRound className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedVpn}/{stats.enabledVpn}</div>
            <Progress value={stats.enabledVpn > 0 ? (stats.connectedVpn / stats.enabledVpn) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.validIps}</div>
            <Badge className="mt-2" variant="secondary">Configurados</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={resourceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" style={{ fontSize: '11px' }} />
                <YAxis domain={[0, 100]} style={{ fontSize: '11px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="hsl(var(--chart-1))" strokeWidth={2} name="CPU" />
                <Line type="monotone" dataKey="memory" stroke="hsl(var(--chart-2))" strokeWidth={2} name="RAM" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interfaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {interfaces.slice(0, 6).map((iface: any) => (
              <div key={iface['.id']} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", iface.running ? "bg-green-500" : "bg-red-500")} />
                  <span className="font-medium text-sm">{iface.name}</span>
                </div>
                <Badge variant={iface.running ? "default" : "secondary"} className="text-xs">{iface.running ? "UP" : "DOWN"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
