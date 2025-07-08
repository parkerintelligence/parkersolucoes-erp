
import { useQuery } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { supabase } from '@/integrations/supabase/client';

export const useBaculaAPI = () => {
  const { data: integrations } = useIntegrations();
  const baculaIntegration = integrations?.find(i => i.type === 'bacula' && i.is_active);
  
  const isEnabled = !!baculaIntegration;

  const makeBaculaRequest = async (endpoint: string) => {
    if (!baculaIntegration) {
      throw new Error('Bacula integration not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/supabase/functions/v1/bacula-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ endpoint })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch data from BaculaWeb');
    }

    return await response.json();
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
