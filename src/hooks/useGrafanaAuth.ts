
import { useState, useEffect } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

export const useGrafanaAuth = () => {
  const { data: integrations = [] } = useIntegrations();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const grafanaIntegration = integrations.find(integration => 
    integration.type === 'grafana' && integration.is_active
  );

  const authenticateWithGrafana = async () => {
    if (!grafanaIntegration) {
      setAuthError('Integração do Grafana não configurada');
      return false;
    }

    if (!grafanaIntegration.username || !grafanaIntegration.password) {
      setAuthError('Credenciais do Grafana não configuradas');
      return false;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const proxyUrl = `https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/grafana-proxy`;
      const grafanaUrl = `${grafanaIntegration.base_url}/api/user`;
      
      console.log('Autenticando automaticamente com Grafana...', {
        baseUrl: grafanaIntegration.base_url,
        username: grafanaIntegration.username,
        hasPassword: !!grafanaIntegration.password
      });
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: grafanaUrl,
          username: grafanaIntegration.username,
          password: grafanaIntegration.password
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Authentication successful:', data);
        setIsAuthenticated(true);
        toast({
          title: "Conectado ao Grafana",
          description: "Acesso aos dashboards liberado.",
        });
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na autenticação:', response.status, errorData);
        setAuthError(`Erro na autenticação: ${errorData.message || 'Falha na conexão'}`);
        return false;
      }
    } catch (error) {
      console.error('Erro ao conectar com Grafana:', error);
      setAuthError('Erro de conexão com o Grafana');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    if (grafanaIntegration && !isAuthenticated && !isAuthenticating) {
      authenticateWithGrafana();
    }
  }, [grafanaIntegration?.id]);

  return {
    isAuthenticating,
    isAuthenticated,
    authError,
    grafanaIntegration,
    retry: authenticateWithGrafana
  };
};
