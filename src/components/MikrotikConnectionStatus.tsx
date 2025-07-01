import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMikrotikTunnel } from '@/hooks/useMikrotikTunnel';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Wifi, AlertTriangle, CheckCircle, Clock, Router, Zap, Network, RefreshCw } from 'lucide-react';

export const MikrotikConnectionStatus = () => {
  const { 
    isConfigured, 
    isWorkerReady, 
    testConnection,
    isLoading,
    error
  } = useMikrotikTunnel();
  
  const { data: integrations } = useIntegrations();
  const mikrotikIntegration = integrations?.find(integration => integration.type === 'mikrotik');

  if (!isConfigured) {
    return (
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Mikrotik não configurado. Configure a integração primeiro.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getConnectionStatus = () => {
    if (!isWorkerReady) {
      return {
        status: 'service-worker-error',
        color: 'red',
        text: 'Service Worker Inativo',
        description: 'HTTP Tunnel não está funcionando',
        icon: AlertTriangle
      };
    }

    if (isLoading) {
      return {
        status: 'connecting',
        color: 'yellow',
        text: 'Conectando...',
        description: 'Testando conexão via HTTP Tunnel',
        icon: RefreshCw
      };
    }

    if (error) {
      return {
        status: 'error',
        color: 'red',
        text: 'Erro de Conexão',
        description: typeof error === 'string' ? error : error.message || 'Erro desconhecido',
        icon: AlertTriangle
      };
    }

    return {
      status: 'connected',
      color: 'green',
      text: 'Conectado',
      description: 'HTTP Tunnel funcionando corretamente',
      icon: CheckCircle
    };
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <Card className={`border-${connectionStatus.color}-200`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Status da Conexão HTTP Tunnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`bg-${connectionStatus.color}-100 p-2 rounded-lg`}>
              <StatusIcon className={`h-6 w-6 text-${connectionStatus.color}-600 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className={`font-semibold text-${connectionStatus.color}-900`}>
                {connectionStatus.text}
              </h3>
              <p className="text-sm text-gray-600">
                {connectionStatus.description}
              </p>
            </div>
          </div>
          <Badge variant={connectionStatus.color === 'green' ? 'default' : 'destructive'}>
            {connectionStatus.status}
          </Badge>
        </div>

        {/* Detalhes Técnicos */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">HTTP Tunnel</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Service Worker:</span>
                <Badge variant={isWorkerReady ? "default" : "destructive"} className="text-xs">
                  {isWorkerReady ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Estratégias:</span>
                <span className="text-gray-600">WebSocket, Direct, Proxy</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Integração</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>URL Base:</span>
                <span className="text-gray-600 truncate max-w-24" title={mikrotikIntegration?.base_url}>
                  {mikrotikIntegration?.base_url || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Status:</span>
                <Badge variant={mikrotikIntegration?.is_active ? "default" : "destructive"} className="text-xs">
                  {mikrotikIntegration?.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={() => testConnection.mutate()} 
            variant="outline" 
            size="sm"
            disabled={testConnection.isPending || !isWorkerReady}
            className="flex-1"
          >
            {testConnection.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Testar Conexão
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar
          </Button>
        </div>

        {/* Debug Info - apenas em caso de erro */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Debug Info:</strong><br/>
              Erro: {typeof error === 'string' ? error : error.message}<br/>
              Service Worker: {isWorkerReady ? 'OK' : 'FALHA'}<br/>
              Timestamp: {new Date().toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};