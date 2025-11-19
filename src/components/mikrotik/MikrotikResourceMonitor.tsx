import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { Cpu, HardDrive, Activity, Loader2 } from 'lucide-react';

export const MikrotikResourceMonitor = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const [resources, setResources] = useState<any>(null);

  useEffect(() => {
    loadResources();
    const interval = setInterval(loadResources, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadResources = async () => {
    try {
      const data = await callAPI('/system/resource');
      if (data && data.length > 0) {
        setResources(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
    }
  };

  if (loading && !resources) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cpuLoad}%</div>
          <Progress value={cpuLoad} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {resources['cpu-count']} núcleos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memória</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{memoryUsage.toFixed(1)}%</div>
          <Progress value={memoryUsage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {(freeMemory / 1024 / 1024).toFixed(0)} MB livre
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disco</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{hddUsage.toFixed(1)}%</div>
          <Progress value={hddUsage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {(freeHdd / 1024 / 1024).toFixed(0)} MB livre
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
