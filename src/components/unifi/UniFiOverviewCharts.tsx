import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend, RadialBarChart, RadialBar,
  AreaChart, Area
} from 'recharts';
import {
  Wifi, Router, Network, Users, Signal, HardDrive, Cpu,
  Thermometer, Activity, TrendingUp, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
  'hsl(330 80% 60%)',
  'hsl(160 60% 45%)',
];

const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatUptime = (seconds?: number) => {
  if (!seconds) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h`;
};

interface Props {
  devices: any[];
  clients: any[];
  networks: any[];
  health: any[];
}

const UniFiOverviewCharts: React.FC<Props> = ({ devices, clients, networks, health }) => {

  // ---- Device type distribution ----
  const deviceTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    devices.forEach((d: any) => {
      const type = d.type?.includes('uap') ? 'Access Point'
        : d.type?.includes('usw') ? 'Switch'
        : d.type?.includes('ugw') || d.type?.includes('udm') ? 'Gateway'
        : d.type || 'Outro';
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [devices]);

  // ---- Client type (Wi-Fi vs Wired vs Guest) ----
  const clientTypeData = useMemo(() => {
    let wifi = 0, wired = 0, guest = 0;
    clients.forEach((c: any) => {
      if (c.isGuest || c.is_guest) guest++;
      else if (c.isWired || c.is_wired) wired++;
      else wifi++;
    });
    return [
      { name: 'Wi-Fi', value: wifi },
      { name: 'Cabeado', value: wired },
      { name: 'Convidado', value: guest },
    ].filter(d => d.value > 0);
  }, [clients]);

  // ---- Clients per AP (top 10) ----
  const clientsPerAP = useMemo(() => {
    const apMap: Record<string, { name: string; count: number }> = {};
    clients.forEach((c: any) => {
      const apMac = c.ap_mac || c.accessPointMac;
      if (!apMac) return;
      if (!apMap[apMac]) {
        const ap = devices.find((d: any) => d.mac === apMac);
        apMap[apMac] = { name: ap?.displayName || ap?.name || apMac.slice(-8), count: 0 };
      }
      apMap[apMac].count++;
    });
    return Object.values(apMap).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [clients, devices]);

  // ---- Traffic per device (top 8) ----
  const trafficPerDevice = useMemo(() => {
    return devices
      .map((d: any) => ({
        name: d.displayName || d.name || d.mac?.slice(-8) || '?',
        tx: d['tx_bytes-d'] || d.tx_bytes || d['bytes-d'] || 0,
        rx: d['rx_bytes-d'] || d.rx_bytes || 0,
      }))
      .filter(d => d.tx > 0 || d.rx > 0)
      .sort((a, b) => (b.tx + b.rx) - (a.tx + a.rx))
      .slice(0, 8);
  }, [devices]);

  // ---- Channel distribution ----
  const channelData = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach((c: any) => {
      const ch = c.channel;
      if (!ch) return;
      const band = ch > 14 ? `${ch} (5G)` : `${ch} (2.4G)`;
      map[band] = (map[band] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, clients]) => ({ name, clients }))
      .sort((a, b) => {
        const chA = parseInt(a.name);
        const chB = parseInt(b.name);
        return chA - chB;
      });
  }, [clients]);

  // ---- Device CPU/Mem overview ----
  const deviceResources = useMemo(() => {
    return devices
      .filter((d: any) => {
        const ss = d['sys-stats'] || d.sys_stats || {};
        return ss.cpu != null || ss.mem != null;
      })
      .map((d: any) => {
        const ss = d['sys-stats'] || d.sys_stats || {};
        return {
          name: d.displayName || d.name || d.mac?.slice(-8) || '?',
          cpu: Math.round(ss.cpu || 0),
          mem: Math.round(ss.mem || 0),
          temp: ss.temps ? Math.round(Object.values(ss.temps as Record<string, number>)[0] || 0) : null,
        };
      })
      .sort((a, b) => b.cpu - a.cpu);
  }, [devices]);

  // ---- Network summary ----
  const networkSummary = useMemo(() => {
    let wlan = 0, lan = 0, wan = 0, guest = 0;
    networks.forEach((n: any) => {
      if (n._source === 'wlanconf' || n.purpose === 'wlan') wlan++;
      else if (n.purpose === 'wan') wan++;
      else lan++;
      if (n.is_guest) guest++;
    });
    return { wlan, lan, wan, guest, total: networks.length };
  }, [networks]);

  // ---- Signal quality distribution ----
  const signalDistribution = useMemo(() => {
    const buckets = { Excelente: 0, Bom: 0, Regular: 0, Fraco: 0 };
    clients.forEach((c: any) => {
      const sig = c.signal || c.rssi;
      if (!sig || c.isWired || c.is_wired) return;
      if (sig >= -50) buckets.Excelente++;
      else if (sig >= -65) buckets.Bom++;
      else if (sig >= -75) buckets.Regular++;
      else buckets.Fraco++;
    });
    return Object.entries(buckets)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);
  }, [clients]);

  const pieChartConfig = {
    value: { label: 'Quantidade' },
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Router className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Dispositivos</span>
            </div>
            <div className="text-lg font-bold">{devices.length}</div>
            <div className="text-[10px] text-muted-foreground">
              {devices.filter((d: any) => d.status === 'online' || d.state === 1).length} online
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Clientes</span>
            </div>
            <div className="text-lg font-bold">{clients.length}</div>
            <div className="text-[10px] text-muted-foreground">
              {clients.filter((c: any) => !c.isWired && !c.is_wired).length} Wi-Fi
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Network className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Redes</span>
            </div>
            <div className="text-lg font-bold">{networkSummary.total}</div>
            <div className="text-[10px] text-muted-foreground">
              {networkSummary.wlan} WLAN · {networkSummary.lan} LAN
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground font-medium">Tráfego Total</span>
            </div>
            <div className="text-lg font-bold">
              {formatBytes(devices.reduce((s, d: any) => s + (d.tx_bytes || d['tx_bytes-d'] || 0), 0))}
            </div>
            <div className="text-[10px] text-muted-foreground">TX acumulado</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Signal className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Sinal Médio</span>
            </div>
            <div className="text-lg font-bold">
              {(() => {
                const wifiClients = clients.filter((c: any) => (c.signal || c.rssi) && !c.isWired && !c.is_wired);
                if (!wifiClients.length) return '-';
                const avg = wifiClients.reduce((s: number, c: any) => s + (c.signal || c.rssi || 0), 0) / wifiClients.length;
                return `${Math.round(avg)} dBm`;
              })()}
            </div>
            <div className="text-[10px] text-muted-foreground">clientes Wi-Fi</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground font-medium">Saúde</span>
            </div>
            <div className="text-lg font-bold">
              {health.filter((h: any) => h.status === 'ok' || h.status === 'healthy').length}/{health.length}
            </div>
            <div className="text-[10px] text-muted-foreground">subsistemas OK</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Device type pie */}
        {deviceTypeData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Tipos de Dispositivos
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceTypeData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {deviceTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Quantidade']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client type pie */}
        {clientTypeData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Distribuição de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={clientTypeData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {clientTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Clientes']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signal quality */}
        {signalDistribution.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Signal className="h-4 w-4 text-primary" />
                Qualidade de Sinal Wi-Fi
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={signalDistribution} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      <Cell fill="hsl(142 76% 36%)" />
                      <Cell fill="hsl(199 89% 48%)" />
                      <Cell fill="hsl(38 92% 50%)" />
                      <Cell fill="hsl(0 84% 60%)" />
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Clientes']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 3: Bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Clients per AP */}
        {clientsPerAP.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Clientes por Access Point
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientsPerAP} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: number) => [value, 'Clientes']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Channel distribution */}
        {channelData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                Clientes por Canal Wi-Fi
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: number) => [value, 'Clientes']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="clients" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 4: Traffic per device */}
      {trafficPerDevice.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tráfego por Dispositivo (Top 8)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficPerDevice} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => formatBytes(v)} />
                  <Tooltip formatter={(value: number) => [formatBytes(value)]} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="tx" name="TX (Envio)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rx" name="RX (Recebido)" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 5: Device Resources */}
      {deviceResources.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Recursos dos Dispositivos (CPU / Memória)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              {deviceResources.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate max-w-[200px]">{d.name}</span>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{d.cpu}%</span>
                      <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{d.mem}%</span>
                      {d.temp && <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />{d.temp}°C</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Progress value={d.cpu} className="h-1.5" />
                    </div>
                    <div className="flex-1">
                      <Progress value={d.mem} className="h-1.5 [&>div]:bg-emerald-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UniFiOverviewCharts;
