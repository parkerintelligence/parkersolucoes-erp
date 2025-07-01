
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
    
    // Clean URL - remove trailing slash and ensure it ends with api_jsonrpc.php
    let cleanUrl = baseUrl.replace(/\/$/, '');
    if (!cleanUrl.endsWith('/api_jsonrpc.php')) {
      cleanUrl = cleanUrl + '/api_jsonrpc.php';
    }
    
    console.log('Clean URL:', cleanUrl);

    // Test if the URL is reachable first
    try {
      console.log('Testing API version endpoint...');
      const testResponse = await fetch(cleanUrl, {
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

      console.log('API version response status:', testResponse.status);

      if (!testResponse.ok) {
        console.error('Zabbix URL not reachable:', testResponse.status, testResponse.statusText);
        
        if (testResponse.status === 404) {
          return {
            isValid: false,
            error: 'URL não encontrada (404)',
            details: `A URL ${cleanUrl} não foi encontrada. Verifique se:\n• A URL está correta\n• O Zabbix está instalado e rodando\n• O caminho para api_jsonrpc.php está correto\n• Não há problemas de firewall ou proxy`
          };
        } else if (testResponse.status === 403) {
          return {
            isValid: false,
            error: 'Acesso negado (403)',
            details: `Acesso negado ao endpoint ${cleanUrl}. Verifique se:\n• O servidor web está configurado corretamente\n• Não há restrições de IP\n• As permissões do Zabbix estão corretas`
          };
        } else if (testResponse.status >= 500) {
          return {
            isValid: false,
            error: 'Erro interno do servidor',
            details: `Erro interno do servidor (${testResponse.status}). O Zabbix pode estar:\n• Fora do ar\n• Com problemas de configuração\n• Com problemas de banco de dados\n• Sobrecarregado`
          };
        } else {
          return {
            isValid: false,
            error: `Erro HTTP ${testResponse.status}`,
            details: `${testResponse.statusText}. Verifique se a URL está correta e o Zabbix está acessível.`
          };
        }
      }

      const versionData = await testResponse.json();
      console.log('API version data:', versionData);

      if (versionData.error) {
        return {
          isValid: false,
          error: 'Erro na API do Zabbix',
          details: `A API retornou erro: ${versionData.error.message || 'Erro desconhecido'}\nCódigo: ${versionData.error.code || 'N/A'}`
        };
      }

    } catch (networkError: any) {
      console.error('Network error:', networkError);
      
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        return {
          isValid: false,
          error: 'Erro de conexão de rede',
          details: `Não foi possível conectar ao servidor ${cleanUrl}. Possíveis causas:\n• Servidor fora do ar\n• URL incorreta\n• Problemas de DNS\n• Firewall bloqueando a conexão\n• Certificado SSL inválido (se HTTPS)\n\nErro técnico: ${networkError.message}`
        };
      } else {
        return {
          isValid: false,
          error: 'Erro de rede',
          details: `Falha na conexão: ${networkError.message}`
        };
      }
    }

    // Now test authentication
    console.log('Testing authentication...');
    const authResponse = await fetch(cleanUrl, {
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

    console.log('Auth response status:', authResponse.status);

    if (!authResponse.ok) {
      console.error('Auth request failed:', authResponse.status);
      return {
        isValid: false,
        error: `Erro HTTP ${authResponse.status}`,
        details: `Falha na requisição de autenticação. Código: ${authResponse.status}`
      };
    }

    const authData = await authResponse.json();
    console.log('Auth response data:', authData);

    if (authData.error) {
      console.error('Zabbix auth error:', authData.error);
      
      // Check for specific error types
      if (authData.error.code === -32602) {
        return {
          isValid: false,
          error: 'Parâmetros de autenticação inválidos',
          details: `Os parâmetros de login estão em formato incorreto.\nCódigo do erro: ${authData.error.code}\nMensagem: ${authData.error.message || 'N/A'}\n\nVerifique se o usuário e senha não contêm caracteres especiais problemáticos.`
        };
      } else if (authData.error.code === -32500) {
        return {
          isValid: false,
          error: 'Credenciais incorretas',
          details: `Usuário ou senha incorretos.\nCódigo do erro: ${authData.error.code}\nMensagem: ${authData.error.message || 'N/A'}\n\nVerifique:\n• Se o usuário '${username}' existe no Zabbix\n• Se a senha está correta\n• Se o usuário tem permissão para fazer login via API\n• Se o usuário não está desabilitado`
        };
      } else if (authData.error.message?.toLowerCase().includes('login name or password is incorrect')) {
        return {
          isValid: false,
          error: 'Nome de usuário ou senha incorretos',
          details: `As credenciais fornecidas são inválidas:\nUsuário: ${username}\n\nVerifique:\n• Se o usuário existe no Zabbix\n• Se a senha está correta (cuidado com maiúsculas/minúsculas)\n• Se o usuário tem permissão de API habilitada\n• Se o usuário não está bloqueado`
        };
      } else {
        return {
          isValid: false,
          error: 'Erro de autenticação do Zabbix',
          details: `Falha na autenticação.\nCódigo: ${authData.error.code || 'N/A'}\nMensagem: ${authData.error.message || 'Erro desconhecido'}\nDados: ${authData.error.data || 'N/A'}`
        };
      }
    }

    if (!authData.result) {
      return {
        isValid: false,
        error: 'Falha na obtenção do token',
        details: 'A autenticação não retornou um token válido. Isso pode indicar:\n• Problema interno do Zabbix\n• Configuração incorreta da API\n• Versão incompatível do Zabbix'
      };
    }

    console.log('Zabbix connection validated successfully. Token:', authData.result);
    return {
      isValid: true
    };

  } catch (error: any) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      error: 'Erro interno de validação',
      details: `Erro inesperado durante a validação:\n${error.message || error.toString()}\n\nTipo: ${error.name || 'Desconhecido'}\nStack: ${error.stack || 'N/A'}`
    };
  }
};
