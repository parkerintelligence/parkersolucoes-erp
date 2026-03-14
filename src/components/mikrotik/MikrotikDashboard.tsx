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

      const get = (ep: string) => results[ep]?.data;
      const getArr = (ep: string) => {
        const d = get(ep);
        return Array.isArray(d) ? d : d ? [d] : [];
      };
      const getSingle = (ep: string) => {
        const d = get(ep);
        return Array.isArray(d) ? d[0] : d;
      };

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

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Network className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum cliente selecionado</p>
        </div>
      </div>
    );
  }

  if (connectionError && !identity) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-destructive/30 text-destructive bg-destructive/10">
              <Network className="h-2.5 w-2.5 mr-1" />
              {selectedClient.name}
            </Badge>
          </div>
          <Button onClick={loadData} disabled={loading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Tentar novamente
          </Button>
        </div>
        
        <Card className="border-destructive/30 bg-card">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-base font-bold text-foreground mb-2">Falha na conexão com o MikroTik</h3>
            <p className="text-muted-foreground text-xs max-w-md mx-auto mb-4">
              {connectionError}
            </p>
            <div className="text-[10px] text-muted-foreground space-y-0.5 max-w-sm mx-auto">
              <p className="font-medium mb-1">Verifique se:</p>
              <ul className="list-disc list-inside text-left space-y-0.5">
                <li>O dispositivo MikroTik está ligado e acessível</li>
                <li>A API REST está habilitada</li>
                <li>O endereço <code className="bg-muted px-1 rounded text-foreground">{selectedClient.base_url}</code> está correto</li>
                <li>As credenciais estão corretas</li>
                <li>O firewall permite conexões na porta da API</li>
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Conectando com {selectedClient.name}...</p>
          <p className="text-[10px] text-muted-foreground/50">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info bar */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
        </p>
        <Button onClick={loadData} disabled={loading} size="sm" variant="outline" className="h-7 text-[10px] px-2">
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Stats Bar - Projects style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: "Dispositivo", value: identity?.name || 'MikroTik', icon: Activity, color: "text-primary", sub: routerboard?.model || 'RouterOS' },
          { label: "Interfaces", value: `${stats.activeInterfaces}/${stats.totalInterfaces}`, icon: Wifi, color: "text-primary" },
          { label: "DHCP", value: `${stats.activeDhcp}/${stats.totalDhcp}`, icon: Users, color: "text-emerald-500" },
          { label: "Firewall", value: `${stats.activeFirewall}/${stats.totalFirewall}`, icon: Shield, color: "text-amber-500" },
          { label: "NAT", value: `${stats.activeNat}/${stats.totalNat}`, icon: Network, color: "text-primary" },
          { label: "VPN", value: `${stats.connectedVpn}/${stats.enabledVpn}`, icon: KeyRound, color: "text-amber-500" },
          { label: "IPs", value: stats.validIps, icon: Globe, color: "text-primary" },
          { label: "Uptime", value: formatUptime(resource?.uptime), icon: Clock, color: "text-emerald-500" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5 block">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Version badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border text-muted-foreground">
          RB: v{routerboard?.['current-firmware'] || routerboard?.version || 'N/A'}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border text-muted-foreground">
          OS: v{resource?.version || 'N/A'}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
          Online
        </Badge>
      </div>

      {/* Resource Monitor */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-sm">Recursos do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <MikrotikResourceMonitor />
        </CardContent>
      </Card>

      {/* Interfaces list */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-sm">Interfaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {interfaces.slice(0, 6).map((iface: any) => (
              <div key={iface['.id']} className="flex items-center justify-between px-3 py-1.5 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", iface.running ? "bg-emerald-500" : "bg-destructive")} />
                  <span className="font-medium text-xs text-foreground">{iface.name}</span>
                </div>
                <Badge variant="outline" className={cn(
                  "text-[10px] px-1.5 py-0 h-5",
                  iface.running
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : "border-destructive/30 text-destructive bg-destructive/10"
                )}>
                  {iface.running ? "UP" : "DOWN"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
