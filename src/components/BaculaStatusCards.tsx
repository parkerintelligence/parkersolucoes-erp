
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Database, HardDrive, Activity } from 'lucide-react';
import { useBaculaAPI } from '@/hooks/useBaculaAPI';

export const BaculaStatusCards = () => {
  const { useJobs, useClients, useStorages, useVolumes, isEnabled } = useBaculaAPI();
  const { data: jobs, isLoading: jobsLoading } = useJobs(50);
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: storages, isLoading: storagesLoading } = useStorages();
  const { data: volumes, isLoading: volumesLoading } = useVolumes();

  if (!isEnabled) return null;

  const runningJobs = jobs?.filter((job: any) => job.jobstatus.toLowerCase() === 'r') || [];
  const recentJobs = jobs?.slice(0, 10) || [];
  const successfulJobs = recentJobs.filter((job: any) => job.jobstatus.toLowerCase() === 't');
  const failedJobs = recentJobs.filter((job: any) => ['e', 'f'].includes(job.jobstatus.toLowerCase()));

  const successRate = recentJobs.length > 0 ? 
    Math.round((successfulJobs.length / recentJobs.length) * 100) : 0;

  const activeClients = clients?.filter((client: any) => client.name) || [];
  const enabledStorages = storages?.filter((storage: any) => storage.enabled === 1) || [];
  const availableVolumes = volumes?.filter((volume: any) => volume.volstatus === 'Append') || [];

  const cards = [
    {
      title: "Jobs em Execução",
      value: runningJobs.length,
      icon: Activity,
      description: "Backup ativo",
      loading: jobsLoading,
      variant: runningJobs.length > 0 ? "default" : "secondary"
    },
    {
      title: "Taxa de Sucesso",
      value: `${successRate}%`,
      icon: Database,
      description: `${successfulJobs.length}/${recentJobs.length} últimos jobs`,
      loading: jobsLoading,
      variant: successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"
    },
    {
      title: "Clientes Ativos",
      value: activeClients.length,
      icon: Server,
      description: "Configurados para backup",
      loading: clientsLoading,
      variant: "default"
    },
    {
      title: "Storages Disponíveis",
      value: enabledStorages.length,
      icon: HardDrive,
      description: `${availableVolumes.length} volumes prontos`,
      loading: storagesLoading || volumesLoading,
      variant: enabledStorages.length > 0 ? "default" : "destructive"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {card.loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400 mr-2" />
                      <span className="text-slate-400">...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-white">{card.value}</div>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {card.description}
                  </p>
                </div>
                {!card.loading && (
                  <Badge variant={card.variant as any} className="ml-2">
                    {card.variant === 'destructive' ? 'Atenção' : 
                     card.variant === 'secondary' ? 'Moderado' : 'OK'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
