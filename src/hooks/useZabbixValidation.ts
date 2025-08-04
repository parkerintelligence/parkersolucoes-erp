
import { toast } from '@/hooks/use-toast';

export interface ZabbixValidationResult {
  isValid: boolean;
  error?: string;
  details?: string;
}

export const validateZabbixConnection = async (
  baseUrl: string,
  username?: string,
  password?: string,
  apiToken?: string,
  integrationId?: string
): Promise<ZabbixValidationResult> => {
  try {
    console.log('Validating Zabbix connection...', { baseUrl, hasApiToken: !!apiToken, hasCredentials: !!(username && password) });
    
    if (!integrationId) {
      return {
        isValid: false,
        error: 'ID da integração é obrigatório para validação',
        details: 'Salve a configuração primeiro para poder testar a conexão.'
      };
    }

    // Usar a edge function para fazer a validação
    const { supabase } = await import('@/integrations/supabase/client');
    
    console.log('Using zabbix-proxy function for validation...');
    
    const { data, error } = await supabase.functions.invoke('zabbix-proxy', {
      body: {
        method: 'apiinfo.version',
        params: {},
        integrationId: integrationId
      }
    });

    console.log('Zabbix proxy response:', { data, error });

    if (error) {
      console.error('Zabbix proxy error:', error);
      return {
        isValid: false,
        error: 'Erro na comunicação com o Zabbix',
        details: error.message || 'Erro desconhecido na comunicação'
      };
    }

    if (data?.error) {
      console.error('Zabbix API error:', data.error);
      return {
        isValid: false,
        error: data.error,
        details: data.details || 'Erro na API do Zabbix'
      };
    }

    if (data?.result) {
      console.log('Zabbix validation successful, version:', data.result);
      return {
        isValid: true
      };
    }

    return {
      isValid: false,
      error: 'Resposta inválida da API',
      details: 'A API do Zabbix não retornou dados válidos'
    };

  } catch (error: any) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      error: 'Erro interno de validação',
      details: error.message || 'Erro desconhecido durante a validação'
    };
  }
};
