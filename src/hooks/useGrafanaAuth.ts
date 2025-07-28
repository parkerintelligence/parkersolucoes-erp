
import { useState, useEffect } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

export const useGrafanaAuth = () => {
  const { data: integrations = [], isLoading } = useIntegrations();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Buscar integração do Grafana ativa
  const grafanaIntegration = integrations.find(integration => 
    integration.type === 'grafana' && integration.is_active
  );

  const authenticateWithGrafana = async () => {
    if (!grafanaIntegration) {
      setAuthError('Integração do Grafana não configurada no painel de administração');
      return false;
    }

    console.log('Dados da integração encontrados:', {
      name: grafanaIntegration.name,
      baseUrl: grafanaIntegration.base_url,
      hasApiToken: !!(grafanaIntegration.api_token?.trim()),
      hasUsername: !!(grafanaIntegration.username?.trim()),
      hasPassword: !!(grafanaIntegration.password?.trim()),
      isActive: grafanaIntegration.is_active
    });

    // Verificar se temos credenciais válidas - priorizar API Token
    const hasApiToken = grafanaIntegration.api_token && grafanaIntegration.api_token.trim() !== '';
    const hasUserPass = grafanaIntegration.username && grafanaIntegration.password && 
                       grafanaIntegration.username.trim() !== '' && grafanaIntegration.password.trim() !== '';

    if (!hasApiToken && !hasUserPass) {
      setAuthError('Configure API Token (recomendado) ou usuário/senha do Grafana no painel de administração.');
      toast({
        title: "Credenciais não encontradas",
        description: "Configure as credenciais do Grafana no painel de administração.",
        variant: "destructive"
      });
      return false;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const proxyUrl = `https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/grafana-proxy`;
      const grafanaUrl = `${grafanaIntegration.base_url}/api/user`;
      
      console.log('Iniciando autenticação com Grafana...', {
        baseUrl: grafanaIntegration.base_url,
        hasApiToken: hasApiToken,
        hasUserPass: hasUserPass,
        username: grafanaIntegration.username || 'N/A',
        authMethod: hasApiToken ? 'token' : 'basic'
      });

      // Preparar dados de autenticação - sempre priorizar API Token
      const authData: any = {
        url: grafanaUrl
      };

      if (hasApiToken) {
        authData.api_token = grafanaIntegration.api_token;
        authData.auth_type = 'token';
        console.log('Usando autenticação por API Token');
      } else if (hasUserPass) {
        authData.username = grafanaIntegration.username;
        authData.password = grafanaIntegration.password;
        authData.auth_type = 'basic';
        console.log('Usando autenticação Basic Auth com usuário:', grafanaIntegration.username);
      } else {
        throw new Error('Nenhum método de autenticação válido encontrado');
      }
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Authentication successful:', data);
        setIsAuthenticated(true);
        toast({
          title: "Conectado ao Grafana",
          description: `Acesso aos dashboards liberado usando ${hasApiToken ? 'API Token' : 'usuário/senha'}.`,
        });
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na autenticação:', response.status, errorData);
        
        let errorMessage = 'Falha na conexão com o Grafana';
        if (response.status === 401) {
          errorMessage = hasApiToken ? 
            'API Token inválido ou expirado. Verifique no painel de administração.' :
            'Credenciais inválidas. Verifique usuário e senha no painel de administração.';
        } else if (response.status === 403) {
          errorMessage = 'Acesso negado. Verifique as permissões do usuário no Grafana.';
        } else if (response.status === 404) {
          errorMessage = 'Endpoint não encontrado. Verifique a URL do Grafana.';
        } else if (response.status >= 500) {
          errorMessage = 'Erro no servidor Grafana. Verifique se o serviço está disponível.';
        }
        
        setAuthError(`${errorData.message || errorMessage}`);
        toast({
          title: "Erro de autenticação",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao conectar com Grafana:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão com o Grafana';
      setAuthError(`Erro de conexão: ${errorMessage}. Verifique a URL e conectividade.`);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao Grafana. Verifique a configuração no painel de administração.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Tentar autenticar automaticamente quando a integração estiver disponível
  useEffect(() => {
    if (grafanaIntegration && !isAuthenticated && !isAuthenticating && !isLoading) {
      console.log('Tentando autenticação automática...');
      authenticateWithGrafana();
    }
  }, [grafanaIntegration?.id, grafanaIntegration?.api_token, grafanaIntegration?.username, grafanaIntegration?.password]);

  return {
    isAuthenticating,
    isAuthenticated,
    authError,
    grafanaIntegration,
    retry: authenticateWithGrafana,
    hasCredentials: grafanaIntegration ? 
      !!(grafanaIntegration.api_token?.trim() || (grafanaIntegration.username?.trim() && grafanaIntegration.password?.trim())) : 
      false
  };
};
