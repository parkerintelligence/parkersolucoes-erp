
import { supabase } from '@/integrations/supabase/client';

export const useZabbixProxy = () => {
  const makeZabbixProxyRequest = async (method: string, params: any, integrationId: string) => {
    console.log('=== Zabbix Proxy Client Request ===');
    console.log('Making request:', { method, params, integrationId });
    
    try {
      const { data, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: {
          method,
          params,
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
        console.error('Error context:', error.context);
        
        // Se temos detalhes específicos no contexto
        if (error.context) {
          throw new Error(`Erro na comunicação: ${error.context.error || error.message}`);
        }
        
        throw new Error(`Erro na comunicação: ${error.message}`);
      }

      if (data?.error) {
        console.error('=== API Error Response ===');
        console.error('API error:', data.error);
        console.error('API error details:', data.details);
        throw new Error(`${data.error}${data.details ? ': ' + data.details : ''}`);
      }

      console.log('=== Success ===');
      console.log('Response data:', { 
        hasResult: !!data?.result,
        resultType: typeof data?.result,
        resultLength: Array.isArray(data?.result) ? data.result.length : 'N/A' 
      });
      
      return data?.result || [];
    } catch (error) {
      console.error('=== Client Error ===');
      console.error('Final error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  return { makeZabbixProxyRequest };
};
