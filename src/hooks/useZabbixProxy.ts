
import { supabase } from '@/integrations/supabase/client';

interface ZabbixProxyRequest {
  method: string;
  params: any;
  integrationId: string;
}

export const useZabbixProxy = () => {
  const makeZabbixProxyRequest = async (method: string, params: any, integrationId: string) => {
    console.log('Fazendo requisição via proxy:', { method, params, integrationId });
    
    try {
      const { data, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: {
          method,
          params,
          integrationId
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(`Erro na comunicação: ${error.message}`);
      }

      if (data.error) {
        console.error('Erro retornado pela API:', data.error);
        throw new Error(data.error);
      }

      console.log('Requisição bem-sucedida:', { 
        resultLength: Array.isArray(data.result) ? data.result.length : 'N/A' 
      });
      
      return data.result;
    } catch (error) {
      console.error('Erro na requisição proxy:', error);
      throw error;
    }
  };

  return { makeZabbixProxyRequest };
};
