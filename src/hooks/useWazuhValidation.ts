import { toast } from '@/hooks/use-toast';

export interface WazuhValidationResult {
  isValid: boolean;
  error?: string;
  details?: string;
  diagnostics?: any;
}

export const validateWazuhConnection = async (
  baseUrl: string,
  username?: string,
  password?: string,
  integrationId?: string
): Promise<WazuhValidationResult> => {
  try {
    console.log('Validating Wazuh connection...', { baseUrl, hasCredentials: !!(username && password) });
    
    if (!integrationId) {
      return {
        isValid: false,
        error: 'ID da integração é obrigatório para validação',
        details: 'Salve a configuração primeiro para poder testar a conexão.'
      };
    }

    // Use the edge function for validation
    const { supabase } = await import('@/integrations/supabase/client');
    
    console.log('🔧 Using wazuh-proxy function for validation...');
    
    const { data, error } = await supabase.functions.invoke('wazuh-proxy', {
      body: {
        method: 'GET',
        endpoint: '/version',
        integrationId: integrationId
      }
    });

    console.log('🔍 Wazuh proxy response:', { data, error, hasData: !!data });

    if (error) {
      console.error('❌ Wazuh proxy error:', error);
      return {
        isValid: false,
        error: 'Erro na comunicação com o Wazuh',
        details: `Edge function error: ${error.message}` || 'Erro desconhecido na comunicação'
      };
    }

    if (data?.error) {
      console.error('Wazuh API error:', data.error);
      return {
        isValid: false,
        error: data.error,
        details: data.details || 'Erro na API do Wazuh'
      };
    }

    // Check for successful response
    if (data && (data.data || data.result || data.api_version)) {
      console.log('✅ Wazuh validation successful');
      return {
        isValid: true
      };
    }

    return {
      isValid: false,
      error: 'Resposta inválida da API',
      details: 'A API do Wazuh não retornou dados válidos'
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

export const runWazuhDiagnostics = async (
  baseUrl: string,
  username?: string,
  password?: string,
  integrationId?: string
): Promise<WazuhValidationResult> => {
  try {
    console.log('Running Wazuh diagnostics...', { baseUrl });
    
    if (!integrationId) {
      return {
        isValid: false,
        error: 'ID da integração é obrigatório para diagnósticos',
        details: 'Salve a configuração primeiro para poder executar diagnósticos.'
      };
    }

    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('wazuh-proxy', {
      body: {
        method: 'GET',
        endpoint: '/version',
        integrationId: integrationId,
        diagnostics: true
      }
    });

    console.log('Wazuh diagnostics response:', { data, error });

    if (error) {
      console.error('Wazuh diagnostics error:', error);
      return {
        isValid: false,
        error: 'Erro ao executar diagnósticos',
        details: error.message || 'Erro desconhecido durante diagnósticos'
      };
    }

    if (data?.diagnostics) {
      return {
        isValid: data.summary?.hasConnectivity || false,
        diagnostics: data
      };
    }

    return {
      isValid: false,
      error: 'Diagnósticos não puderam ser executados',
      details: 'Resposta inválida do servidor de diagnósticos'
    };

  } catch (error: any) {
    console.error('Diagnostics error:', error);
    return {
      isValid: false,
      error: 'Erro interno de diagnósticos',
      details: error.message || 'Erro desconhecido durante diagnósticos'
    };
  }
};