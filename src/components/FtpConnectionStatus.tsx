
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Server, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';

export const FtpConnectionStatus = () => {
  const { ftpIntegration, testConnection, ftpIntegrations } = useFtp();

  if (!ftpIntegration) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="text-center">
            <WifiOff className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Nenhuma integração FTP configurada
            </h3>
            <p className="text-yellow-700 mb-4">
              Para gerenciar backups, configure uma integração FTP no Painel de Administração.
            </p>
            <Button 
              variant="outline" 
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              onClick={() => window.location.href = '/admin'}
            >
              Configurar FTP
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
          <Wifi className="h-5 w-5" />
          Status da Conexão FTP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Servidor</span>
            </div>
            <p className="text-gray-900 font-mono text-sm bg-white px-2 py-1 rounded">
              {ftpIntegration.base_url}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Usuário</span>
            </div>
            <p className="text-gray-900 bg-white px-2 py-1 rounded">
              {ftpIntegration.username || 'anonymous'}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Status</span>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Ação</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testConnection.mutate()}
              disabled={testConnection.isPending}
              className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 w-full"
            >
              <RefreshCw className={`h-3 w-3 ${testConnection.isPending ? 'animate-spin' : ''}`} />
              {testConnection.isPending ? 'Testando...' : 'Testar'}
            </Button>
          </div>
        </div>
        
        {/* Informações adicionais */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              Integração: <strong>{ftpIntegration.name}</strong>
            </span>
            <span className="text-blue-600">
              Total de servidores configurados: {ftpIntegrations.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
