
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from '@/hooks/use-toast';

export interface BaculaJob {
  jobid: number;
  job: string;
  name: string;
  type: string;
  level: string;
  clientid: number;
  client: string;
  jobstatus: string;
  schedtime: string;
  starttime?: string;
  endtime?: string;
  realendtime?: string;
  jobtdate: number;
  volsessionid: number;
  volsessiontime: number;
  jobfiles: number;
  jobbytes: number;
  readbytes: number;
  joberrors: number;
  jobmissingfiles: number;
  poolid: number;
  poolname: string;
  priorjobid: number;
  purgedfiles: number;
  hasbase: number;
  hascache: number;
  reviewed: number;
  comment?: string;
}

export interface BaculaClient {
  clientid: number;
  name: string;
  uname: string;
  autoprune: number;
  fileretention: number;
  jobretention: number;
}

export interface BaculaStorage {
  storageid: number;
  name: string;
  autochanger: number;
  enabled: number;
}

export interface BaculaVolume {
  mediaid: number;
  volumename: string;
  slot: number;
  poolid: number;
  mediatype: string;
  mediatypeid: number;
  labeltype: number;
  firstwritten: string;
  lastwritten: string;
  labeldate: string;
  voljobs: number;
  volfiles: number;
  volblocks: number;
  volmounts: number;
  volbytes: number;
  volparts: number;
  volerrors: number;
  volwrites: number;
  volcapacitybytes: number;
  volstatus: string;
  enabled: number;
  recycle: number;
  actiononpurge: number;
  volretention: number;
  voluseduration: number;
  maxvoljobs: number;
  maxvolfiles: number;
  maxvolbytes: number;
  inchanger: number;
  storageid: number;
  deviceid: number;
  locationid: number;
  recyclecount: number;
  initialwrite: string;
  scratchpoolid: number;
  recyclepoolid: number;
  comment?: string;
}

export const useBaculaAPI = () => {
  const { data: integrations } = useIntegrations();
  const baculaIntegration = integrations?.find(i => i.type === 'bacula' && i.is_active);

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!baculaIntegration) {
      throw new Error('Integração BaculaWeb não configurada');
    }

    const response = await fetch('/api/bacula-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseUrl: baculaIntegration.base_url,
        username: baculaIntegration.username,
        password: baculaIntegration.password,
        endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body as string) : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`BaculaWeb API error: ${response.statusText}`);
    }

    return response.json();
  };

  // Hook para buscar jobs
  const useJobs = (limit = 100) => {
    return useQuery({
      queryKey: ['bacula', 'jobs', limit],
      queryFn: () => makeRequest(`/api/jobs?limit=${limit}`),
      enabled: !!baculaIntegration,
      refetchInterval: 30000, // Atualiza a cada 30 segundos
    });
  };

  // Hook para buscar jobs por status
  const useJobsByStatus = (status: string) => {
    return useQuery({
      queryKey: ['bacula', 'jobs', 'status', status],
      queryFn: () => makeRequest(`/api/jobs?status=${status}`),
      enabled: !!baculaIntegration && !!status,
      refetchInterval: 15000,
    });
  };

  // Hook para buscar clientes
  const useClients = () => {
    return useQuery({
      queryKey: ['bacula', 'clients'],
      queryFn: () => makeRequest('/api/clients'),
      enabled: !!baculaIntegration,
      refetchInterval: 60000,
    });
  };

  // Hook para buscar storages
  const useStorages = () => {
    return useQuery({
      queryKey: ['bacula', 'storages'],
      queryFn: () => makeRequest('/api/storages'),
      enabled: !!baculaIntegration,
      refetchInterval: 60000,
    });
  };

  // Hook para buscar volumes
  const useVolumes = () => {
    return useQuery({
      queryKey: ['bacula', 'volumes'],
      queryFn: () => makeRequest('/api/volumes'),
      enabled: !!baculaIntegration,
      refetchInterval: 60000,
    });
  };

  // Hook para buscar estatísticas gerais
  const useStatistics = () => {
    return useQuery({
      queryKey: ['bacula', 'statistics'],
      queryFn: () => makeRequest('/api/statistics'),
      enabled: !!baculaIntegration,
      refetchInterval: 30000,
    });
  };

  // Hook para buscar jobs de um cliente específico
  const useClientJobs = (clientId: number) => {
    return useQuery({
      queryKey: ['bacula', 'client-jobs', clientId],
      queryFn: () => makeRequest(`/api/jobs?clientid=${clientId}`),
      enabled: !!baculaIntegration && !!clientId,
      refetchInterval: 30000,
    });
  };

  // Mutation para cancelar job
  const useCancelJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (jobId: number) => 
        makeRequest(`/api/jobs/${jobId}/cancel`, { method: 'POST' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bacula', 'jobs'] });
        toast({
          title: "Job cancelado",
          description: "O job foi cancelado com sucesso.",
        });
      },
      onError: (error) => {
        toast({
          title: "Erro ao cancelar job",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Mutation para iniciar job
  const useRunJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (jobName: string) => 
        makeRequest('/api/jobs/run', { 
          method: 'POST',
          body: JSON.stringify({ job: jobName })
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bacula', 'jobs'] });
        toast({
          title: "Job iniciado",
          description: "O job foi iniciado com sucesso.",
        });
      },
      onError: (error) => {
        toast({
          title: "Erro ao iniciar job",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return {
    baculaIntegration,
    isEnabled: !!baculaIntegration,
    useJobs,
    useJobsByStatus,
    useClients,
    useStorages,
    useVolumes,
    useStatistics,
    useClientJobs,
    useCancelJob,
    useRunJob,
  };
};
