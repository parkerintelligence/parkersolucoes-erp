
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader, RefreshCw, Settings } from 'lucide-react';

interface GrafanaConnectionStatusProps {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  grafanaIntegration: any;
  onRetry: () => void;
}

export const GrafanaConnectionStatus = ({ 
  isAuthenticating, 
  isAuthenticated, 
  authError, 
  grafanaIntegration, 
  onRetry 
}: GrafanaConnectionStatusProps) => {
  if (!grafanaIntegration) {
    return (
      <Card className="border-yellow-600 bg-yellow-900/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-200 mb-2">Integração não configurada</h3>
          <p className="text-yellow-300 mb-4">
            Configure a integração com o Grafana no painel de administração para visualizar os dashboards.
          </p>
          <Button 
            onClick={() => window.location.href = '/admin'}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Ir para Administração
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Verificar se tem credenciais configuradas - priorizar API Token
  const hasApiToken = !!(grafanaIntegration.api_token?.trim());
  const hasUserPass = !!(grafanaIntegration.username?.trim() && grafanaIntegration.password?.trim());
  const hasCredentials = hasApiToken || hasUserPass;

  if (!hasCredentials) {
    return (
      <Card className="border-orange-600 bg-orange-900/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-200 mb-2">Credenciais não configuradas</h3>
          <p className="text-orange-300 mb-4">
            Configure API Token (recomendado) ou usuário/senha do Grafana no painel de administração.
          </p>
          <div className="text-sm text-orange-400 mb-4 space-y-1">
            <p><strong>Servidor:</strong> {grafanaIntegration.base_url}</p>
            <p><strong>Nome:</strong> {grafanaIntegration.name}</p>
            <p><strong>Status:</strong> Aguardando credenciais</p>
          </div>
          <Button 
            onClick={() => window.location.href = '/admin'}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Credenciais
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isAuthenticating) {
    return (
      <Card className="border-blue-600 bg-blue-900/20">
        <CardContent className="p-6 text-center">
          <Loader className="h-12 w-12 mx-auto mb-4 text-blue-400 animate-spin" />
          <h3 className="text-lg font-semibold text-blue-200 mb-2">Conectando ao Grafana</h3>
          <div className="text-blue-300 space-y-1">
            <p><strong>Servidor:</strong> {grafanaIntegration.base_url}</p>
            <p><strong>Método:</strong> {hasApiToken ? 'API Token (Recomendado)' : `Basic Auth (${grafanaIntegration.username})`}</p>
            <p className="text-sm text-blue-400">Testando conexão...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (authError) {
    return (
      <Card className="border-red-600 bg-red-900/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-red-200 mb-2">Erro de Conexão</h3>
          <p className="text-red-300 mb-4">{authError}</p>
          <div className="text-sm text-red-400 mb-4 space-y-1">
            <p><strong>Servidor:</strong> {grafanaIntegration.base_url}</p>
            <p><strong>Método:</strong> {hasApiToken ? 'API Token' : `Basic Auth (${grafanaIntegration.username})`}</p>
            <p><strong>Recomendação:</strong> {hasApiToken ? 'Verifique se o token é válido' : 'Use API Token para melhor segurança'}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/admin'}
              className="border-red-600 text-red-200 hover:bg-red-900/30"
            >
              <Settings className="h-4 w-4 mr-2" />
              Verificar Config
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAuthenticated) {
    return (
      <Card className="border-green-600 bg-green-900/20">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
          <h3 className="text-lg font-semibold text-green-200 mb-2">Conectado ao Grafana</h3>
          <div className="text-green-300 space-y-1">
            <p><strong>Servidor:</strong> {grafanaIntegration.base_url}</p>
            <p><strong>Método:</strong> {hasApiToken ? 'API Token (Recomendado)' : `Basic Auth (${grafanaIntegration.username})`}</p>
            <p className="text-sm text-green-400 mt-2">
              ✅ Autenticado com sucesso - Dashboards disponíveis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
