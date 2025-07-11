
import { useQuery } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { supabase } from '@/integrations/supabase/client';

export const useBaculaAPI = () => {
  const { data: integrations } = useIntegrations();
  const baculaIntegration = integrations?.find(i => i.type === 'bacula' && i.is_active);
  
  const isEnabled = !!baculaIntegration;

  const makeBaculaRequest = async (endpoint: string, params?: any) => {
    if (!baculaIntegration) {
      throw new Error('Bacula integration not configured');
    }

    console.log(`Making Bacula request to endpoint: ${endpoint}`, params ? `with params: ${JSON.stringify(params)}` : '');
    
    try {
      const { data, error } = await supabase.functions.invoke('bacula-proxy', {
        body: { endpoint, params }
      });

      if (error) {
        console.error('Bacula proxy error:', error);
        throw new Error(error.message || 'Failed to connect to BaculaWeb');
      }

      console.log('Bacula API response:', data);
      return data;
    } catch (error) {
      console.error('Error in makeBaculaRequest:', error);
      throw error;
    }
  };

  return {
    baculaIntegration,
    isEnabled,
    makeBaculaRequest
  };
};

export const useBaculaJobs = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-jobs'],
    queryFn: () => makeBaculaRequest('jobs'),
    enabled: isEnabled,
    refetchInterval: 30000, // 30 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaJobsRecent = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-jobs-recent'],
    queryFn: () => makeBaculaRequest('jobs/recent'),
    enabled: isEnabled,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaJobsRunning = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-jobs-running'],
    queryFn: () => makeBaculaRequest('jobs/running'),
    enabled: isEnabled,
    refetchInterval: 10000, // 10 seconds for running jobs
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaJobsLast24h = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-jobs-last24h'],
    queryFn: () => makeBaculaRequest('jobs/last24h'),
    enabled: isEnabled,
    refetchInterval: 60000, // 1 minute
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaClients = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-clients'],
    queryFn: () => makeBaculaRequest('clients'),
    enabled: isEnabled,
    refetchInterval: 60000, // 1 minute
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaVolumes = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-volumes'],
    queryFn: () => makeBaculaRequest('volumes'),
    enabled: isEnabled,
    refetchInterval: 60000, // 1 minute
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaStorages = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-storages'],
    queryFn: () => makeBaculaRequest('storages'),
    enabled: isEnabled,
    refetchInterval: 60000, // 1 minute
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaStatus = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-status'],
    queryFn: () => makeBaculaRequest('status'),
    enabled: isEnabled,
    refetchInterval: 30000, // 30 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaDirectorStatus = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-director-status'],
    queryFn: () => makeBaculaRequest('director'),
    enabled: isEnabled,
    refetchInterval: 30000, // 30 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaStatistics = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-statistics'],
    queryFn: () => makeBaculaRequest('statistics'),
    enabled: isEnabled,
    refetchInterval: 60000, // 1 minute
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useBaculaConnectionTest = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-connection-test'],
    queryFn: () => makeBaculaRequest('test'),
    enabled: isEnabled,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5000 // 5 seconds
  });
};

export const useBaculaJobsByPeriod = (days?: number, status?: string) => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-jobs-period', days, status],
    queryFn: () => {
      return makeBaculaRequest('jobs/period', { days, status });
    },
    enabled: isEnabled,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

// New hook for fetching all jobs with better filtering
export const useBaculaJobsAll = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-jobs-all'],
    queryFn: () => makeBaculaRequest('jobs/all'),
    enabled: isEnabled,
    refetchInterval: 60000, // 1 minute since it's a larger dataset
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000 // Keep data fresh for 30 seconds
  });
};
