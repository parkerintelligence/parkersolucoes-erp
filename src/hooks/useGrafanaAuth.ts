
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
      const authHeader = btoa(`${grafanaIntegration.username}:${grafanaIntegration.password}`);
      const proxyUrl = `https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/grafana-proxy`;
      const grafanaUrl = `${grafanaIntegration.base_url}/api/user`;
      
      console.log('Autenticando automaticamente com Grafana...');
      
      const response = await fetch(`${proxyUrl}?url=${encodeURIComponent(grafanaUrl)}&auth=${encodeURIComponent(authHeader)}`);

      if (response.ok) {
        setIsAuthenticated(true);
        toast({
          title: "Conectado ao Grafana",
          description: "Acesso aos dashboards liberado.",
        });
        return true;
      } else {
        const errorText = await response.text();
        console.error('Erro na autenticação:', response.status, errorText);
        setAuthError('Erro na autenticação com o Grafana');
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
