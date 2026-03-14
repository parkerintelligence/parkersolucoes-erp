import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useMikrotikContext } from '@/contexts/MikrotikContext';
import { Cpu, HardDrive, Activity, Loader2 } from 'lucide-react';

export const MikrotikResourceMonitor = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { selectedClient } = useMikrotikContext();
  const [resources, setResources] = useState<any>(null);

  useEffect(() => {
    if (!selectedClient) {
      setResources(null);
      return;
    }
    loadResources();
    const interval = setInterval(loadResources, 5000);
    return () => clearInterval(interval);
  }, [selectedClient]);

  const loadResources = async () => {
    if (!selectedClient) return;
    try {
      const data = await callAPI('/system/resource');
      if (data) {
        const resourceData = Array.isArray(data) ? data[0] : data;
        setResources(resourceData);
      }
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      setResources(null);
    }
  };

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-muted-foreground">
          <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Selecione um cliente para ver os recursos</p>
        </div>
      </div>
    );
  }

  if (loading && !resources) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!resources) return null;

  const cpuLoad = parseInt(resources['cpu-load']) || 0;
  const freeMemory = parseInt(resources['free-memory']) || 0;
  const totalMemory = parseInt(resources['total-memory']) || 1;
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
  const freeHdd = parseInt(resources['free-hdd-space']) || 0;
  const totalHdd = parseInt(resources['total-hdd-space']) || 1;
  const hddUsage = ((totalHdd - freeHdd) / totalHdd) * 100;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'text-destructive';
    if (value >= 70) return 'text-amber-500';
    return 'text-primary';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[
        { label: "CPU", value: cpuLoad, icon: Cpu, detail: `${resources['cpu-count']} núcleos`, suffix: '%' },
        { label: "Memória", value: Math.round(memoryUsage * 10) / 10, icon: Activity, detail: `${formatBytes(totalMemory - freeMemory)} / ${formatBytes(totalMemory)}`, suffix: '%' },
        { label: "Disco", value: Math.round(hddUsage * 10) / 10, icon: HardDrive, detail: `${formatBytes(totalHdd - freeHdd)} / ${formatBytes(totalHdd)}`, suffix: '%' },
      ].map(item => (
        <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
          <item.icon className={`h-4 w-4 ${getProgressColor(item.value)} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              <span className={`text-xs font-bold ${getProgressColor(item.value)}`}>{item.value}{item.suffix}</span>
            </div>
            <Progress value={item.value} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
