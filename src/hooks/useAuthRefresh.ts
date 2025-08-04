import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthRefresh = () => {
  const { toast } = useToast();

  const refreshToken = useCallback(async () => {
    try {
      console.log('Attempting to refresh auth token...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Token refresh failed:', error);
        throw error;
      }
      
      if (data.session) {
        console.log('Token refreshed successfully');
        return data.session;
      }
      
      throw new Error('No session returned after refresh');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      toast({
        title: "Sessão Expirada",
        description: "Por favor, faça login novamente.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const checkTokenValidity = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        return false;
      }
      
      if (!session) {
        console.log('No active session found');
        return false;
      }
      
      // Check if token expires in the next 5 minutes
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = now + (5 * 60);
      
      if (expiresAt && expiresAt < fiveMinutesFromNow) {
        console.log('Token expires soon, refreshing...');
        await refreshToken();
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }, [refreshToken]);

  useEffect(() => {
    // Check token validity on mount
    checkTokenValidity();
    
    // Set up interval to check token every minute
    const interval = setInterval(checkTokenValidity, 60000);
    
    return () => clearInterval(interval);
  }, [checkTokenValidity]);

  return {
    refreshToken,
    checkTokenValidity,
  };
};