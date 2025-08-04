
"use client"

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
        
        // Parse error details if it's a string
        let errorDetails = error;
        if (typeof error === 'string') {
          try {
            errorDetails = JSON.parse(error);
          } catch (e) {
            // Keep as string if not JSON
          }
        }
        
        // Check for auth-related errors
        const isAuthError = error.message?.includes('401') || 
                           error.message?.includes('Unauthorized') ||
                           error.message?.includes('autenticação') ||
                           errorDetails?.error?.includes('autenticação') ||
                           errorDetails?.tokenExpired === true ||
                           errorDetails?.needsRefresh === true;
        
        if (isAuthError) {
          throw new Error('Sessão expirada. Por favor, atualize a página e tente novamente.');
        }
        
        // Handle other specific errors
        if (errorDetails?.details) {
          throw new Error(`Bacula API error: ${errorDetails.details}`);
        }
        
        throw new Error(error.message || 'Failed to connect to BaculaWeb');
      }

      if (data?.error) {
        console.error('Bacula API returned error:', data);
        
        // Check for auth errors in the response
        const isAuthError = data.error?.includes('autenticação') || 
                           data.error?.includes('Unauthorized') ||
                           data.details?.includes('expired');
        
        if (isAuthError) {
          throw new Error('Sessão expirada. Por favor, atualize a página e tente novamente.');
        }
        
        throw new Error(`Bacula API error: ${data.error}${data.details ? ': ' + data.details : ''}`);
      }

      console.log('Bacula API response:', data);
      return data;
    } catch (error: any) {
      console.error('Error in makeBaculaRequest:', error);
      
      // Check for auth errors in catch block
      const isAuthError = error.message?.includes('401') || 
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('autenticação') ||
                         error.message?.includes('session') ||
                         error.message?.includes('expired');
      
      if (isAuthError) {
        throw new Error('Sessão expirada. Por favor, atualize a página e tente novamente.');
      }
      
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

// New hook for fetching configured jobs (job definitions)
export const useBaculaJobsConfigured = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-jobs-configured'],
    queryFn: () => makeBaculaRequest('jobs/configured'),
    enabled: isEnabled,
    refetchInterval: 300000, // 5 minutes since configurations don't change often
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60000 // Keep data fresh for 1 minute
  });
};

// New hook for fetching configured clients
export const useBaculaClientsConfigured = () => {
  const { makeBaculaRequest, isEnabled } = useBaculaAPI();

  return useQuery({
    queryKey: ['bacula-clients-configured'],
    queryFn: () => makeBaculaRequest('clients/configured'),
    enabled: isEnabled,
    refetchInterval: 300000, // 5 minutes since configurations don't change often
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60000 // Keep data fresh for 1 minute
  });
};
