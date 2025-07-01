
import { toast } from '@/hooks/use-toast';

export interface ZabbixValidationResult {
  isValid: boolean;
  error?: string;
  details?: string;
}

export const validateZabbixConnection = async (
  baseUrl: string,
  username: string,
  password: string
): Promise<ZabbixValidationResult> => {
  try {
    console.log('Validating Zabbix connection...', { baseUrl, username });
    
    // Clean URL - remove trailing slash
    const cleanUrl = baseUrl.replace(/\/$/, '');
    
    // Test if the URL is reachable first
    try {
      const testResponse = await fetch(`${cleanUrl}/api_jsonrpc.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'apiinfo.version',
          params: {},
          id: 1,
        }),
      });

      if (!testResponse.ok) {
        console.error('Zabbix URL not reachable:', testResponse.status, testResponse.statusText);
        return {
          isValid: false,
          error: 'URL não acessível',
          details: `HTTP ${testResponse.status}: ${testResponse.statusText}. Verifique se a URL está correta e o Zabbix está rodando.`
        };
      }
    } catch (networkError) {
      console.error('Network error:', networkError);
      return {
        isValid: false,
        error: 'Erro de conexão',
        details: 'Não foi possível conectar ao servidor. Verifique se a URL está correta e acessível.'
      };
    }

    // Now test authentication
    const authResponse = await fetch(`${cleanUrl}/api_jsonrpc.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'user.login',
        params: {
          user: username,
          password: password,
        },
        id: 1,
      }),
    });

    if (!authResponse.ok) {
      console.error('Auth request failed:', authResponse.status);
      return {
        isValid: false,
        error: 'Erro de autenticação',
        details: `HTTP ${authResponse.status}: Falha na requisição de autenticação.`
      };
    }

    const authData = await authResponse.json();
    console.log('Auth response:', authData);

    if (authData.error) {
      console.error('Zabbix auth error:', authData.error);
      
      // Check for specific error types
      if (authData.error.code === -32602) {
        return {
          isValid: false,
          error: 'Parâmetros inválidos',
          details: 'Usuário ou senha em formato inválido.'
        };
      } else if (authData.error.code === -32500) {
        return {
          isValid: false,
          error: 'Usuário ou senha incorretos',
          details: 'Credenciais de login inválidas. Verifique o usuário e senha.'
        };
      } else if (authData.error.message?.includes('Login name or password is incorrect')) {
        return {
          isValid: false,
          error: 'Credenciais incorretas',
          details: 'Nome de usuário ou senha incorretos.'
        };
      } else {
        return {
          isValid: false,
          error: 'Erro de autenticação',
          details: authData.error.message || 'Erro desconhecido na autenticação.'
        };
      }
    }

    if (!authData.result) {
      return {
        isValid: false,
        error: 'Falha na autenticação',
        details: 'Não foi possível obter token de autenticação. Verifique as credenciais.'
      };
    }

    console.log('Zabbix connection validated successfully');
    return {
      isValid: true
    };

  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      error: 'Erro de validação',
      details: error instanceof Error ? error.message : 'Erro desconhecido durante a validação.'
    };
  }
};
