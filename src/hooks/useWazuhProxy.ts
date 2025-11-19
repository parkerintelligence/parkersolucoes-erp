import { supabase } from '@/integrations/supabase/client';

export const useWazuhProxy = () => {
  const makeWazuhProxyRequest = async (method: string, endpoint: string, integrationId: string) => {
    console.log('=== Wazuh Proxy Client Request ===');
    console.log('Making request:', { method, endpoint, integrationId });
    
    try {
      const { data, error } = await supabase.functions.invoke('wazuh-proxy', {
        body: {
          method,
          endpoint,
          integrationId
        }
      });

      console.log('Supabase function response:', {
        hasData: !!data,
        hasError: !!error,
        errorDetails: error
      });

      if (error) {
        console.error('=== Supabase Function Error ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        
        if (error.context) {
          throw new Error(`Connection error: ${error.context.error || error.message}`);
        }
        
        throw new Error(`Connection error: ${error.message}`);
      }

      if (data?.error) {
        console.error('=== API Error Response ===');
        console.error('API error:', data.error);
        console.error('API error details:', data.details);
        throw new Error(`${data.error}${data.details ? ': ' + data.details : ''}`);
      }

      console.log('=== Success ===');
      console.log('Response data:', { 
        hasData: !!data?.data,
        dataType: typeof data?.data
      });
      
      return data?.data || data;
    } catch (error) {
      console.error('=== Client Error ===');
      console.error('Final error:', error);
      throw error;
    }
  };

  return { makeWazuhProxyRequest };
};
