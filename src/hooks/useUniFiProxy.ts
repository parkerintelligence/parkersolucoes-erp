import { supabase } from '@/integrations/supabase/client';

export const useUniFiProxy = () => {
  const makeUniFiProxyRequest = async (method: string, endpoint: string, integrationId: string, data?: any) => {
    console.log('=== UniFi Proxy Client Request ===');
    console.log('Making request:', { 
      method, 
      endpoint, 
      integrationId, 
      hasData: !!data,
      timestamp: new Date().toISOString()
    });
    
    try {
      const requestStart = Date.now();
      const { data: response, error } = await supabase.functions.invoke('unifi-proxy', {
        body: {
          method,
          endpoint,
          integrationId,
          data
        }
      });
      const requestTime = Date.now() - requestStart;

      console.log('Supabase function response:', {
        hasData: !!response,
        hasError: !!error,
        requestTime: `${requestTime}ms`,
        errorDetails: error,
        responseKeys: response ? Object.keys(response) : []
      });

      if (error) {
        console.error('=== Supabase Function Error ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error context:', error.context);
        
        // Se temos detalhes específicos no contexto
        if (error.context) {
          throw new Error(`Erro na comunicação: ${error.context.error || error.message}`);
        }
        
        throw new Error(`Erro na comunicação: ${error.message}`);
      }

      if (response?.error) {
        console.error('=== API Error Response ===');
        console.error('API error:', response.error);
        console.error('API error details:', response.details);
        throw new Error(`${response.error}${response.details ? ': ' + response.details : ''}`);
      }

      console.log('=== Success ===');
      console.log('Response data:', { 
        hasResult: !!response?.data,
        resultType: typeof response?.data,
        resultLength: Array.isArray(response?.data) ? response.data.length : 'N/A' 
      });
      
      return response?.data || [];
    } catch (error) {
      console.error('=== Client Error ===');
      console.error('Final error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  return { makeUniFiProxyRequest };
};