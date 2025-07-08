
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader, RefreshCw } from 'lucide-react';

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
          <p className="text-yellow-300">
            Configure a integração com o Grafana no painel de administração.
          </p>
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
          <p className="text-blue-300">
            Servidor: {grafanaIntegration.base_url}
          </p>
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
          <Button 
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
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
          <p className="text-green-300">
            Servidor: {grafanaIntegration.base_url}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};
