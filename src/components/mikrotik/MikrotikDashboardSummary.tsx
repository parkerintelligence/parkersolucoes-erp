import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Router, Cpu, Activity, HardDrive, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface MikrotikResource {
  clientId: string;
  clientName: string;
  cpuLoad: number;
  memoryUsage: number;
  hddUsage: number;
  uptime: string;
  model: string;
  version: string;
  error?: string;
}

const formatUptime = (uptime: string) => {
  if (!uptime) return 'N/A';
  const parts = uptime.match(/(\d+w)?(\d+d)?(\d+h)?(\d+m)?/);
  if (!parts) return uptime;
  const w = parts[1] ? parseInt(parts[1]) : 0;
  const d = parts[2] ? parseInt(parts[2]) : 0;
  const h = parts[3] ? parseInt(parts[3]) : 0;
  if (w > 0) return `${w}s ${d}d`;
  if (d > 0) return `${d}d ${h}h`;
  return uptime.replace(/(\d+h\d+m)\d+s/, '$1');
};

const getColor = (v: number) => {
  if (v >= 90) return 'text-destructive';
  if (v >= 70) return 'text-amber-500';
  return 'text-emerald-500';
};

export const MikrotikDashboardSummary = ({ integrations }: { integrations: any[] }) => {
  const [resources, setResources] = useState<MikrotikResource[]>([]);
  const [loading, setLoading] = useState(true);

  const mikrotikClients = integrations.filter((i: any) => i.type === 'mikrotik' && i.is_active);

  useEffect(() => {
    if (mikrotikClients.length === 0) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [integrations]);

  const loadAll = async () => {
    setLoading(true);
    const results = await Promise.allSettled(
      mikrotikClients.map(async (client) => {
        try {
          const { data, error } = await supabase.functions.invoke('mikrotik-proxy', {
            body: { endpoint: '/system/resource', method: 'GET', clientId: client.id }
          });
          if (error || data?.error) throw new Error(data?.error || error?.message);
          const r = Array.isArray(data) ? data[0] : data;
          const totalMem = parseInt(r['total-memory']) || 1;
          const freeMem = parseInt(r['free-memory']) || 0;
          const totalHdd = parseInt(r['total-hdd-space']) || 1;
          const freeHdd = parseInt(r['free-hdd-space']) || 0;
          return {
            clientId: client.id,
            clientName: client.name,
            cpuLoad: parseInt(r['cpu-load']) || 0,
            memoryUsage: Math.round(((totalMem - freeMem) / totalMem) * 1000) / 10,
            hddUsage: Math.round(((totalHdd - freeHdd) / totalHdd) * 1000) / 10,
            uptime: r.uptime || '',
            model: r['board-name'] || '',
            version: r.version || '',
          } as MikrotikResource;
        } catch {
          return {
            clientId: client.id,
            clientName: client.name,
            cpuLoad: 0, memoryUsage: 0, hddUsage: 0,
            uptime: '', model: '', version: '',
            error: 'offline',
          } as MikrotikResource;
        }
      })
    );
    setResources(results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean) as MikrotikResource[]);
    setLoading(false);
  };

  if (mikrotikClients.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/40 border-orange-600/30">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-orange-300 flex items-center gap-2">
          <Router className="h-3.5 w-3.5" />
          Recursos MikroTik
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-orange-600/30 text-orange-300/70 ml-auto">
            {mikrotikClients.length} dispositivo{mikrotikClients.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-orange-400/60" />
            <span className="text-[10px] text-orange-300/50 ml-2">Consultando dispositivos...</span>
          </div>
        ) : (
          <div className="space-y-3 mt-1">
            {resources.map((r) => (
              <div key={r.clientId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-orange-200/90 truncate max-w-[55%]" title={r.clientName}>
                    {r.clientName}
                  </span>
                  {r.error ? (
                    <Badge variant="destructive" className="text-[8px] py-0 px-1.5 h-4">Offline</Badge>
                  ) : (
                    <span className="text-[9px] text-orange-300/50">{formatUptime(r.uptime)}</span>
                  )}
                </div>
                {r.error ? (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-[10px] text-destructive/70">Sem comunicação</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'CPU', value: r.cpuLoad, icon: Cpu },
                      { label: 'RAM', value: r.memoryUsage, icon: Activity },
                      { label: 'HDD', value: r.hddUsage, icon: HardDrive },
                    ].map((m) => (
                      <div key={m.label} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-orange-300/50">{m.label}</span>
                          <span className={`text-[9px] font-bold ${getColor(m.value)}`}>{m.value}%</span>
                        </div>
                        <Progress value={m.value} className="h-1" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
