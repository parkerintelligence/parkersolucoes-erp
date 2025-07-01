
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  HardDrive, 
  Clock, 
  Database, 
  Wifi, 
  Settings,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';

interface FtpStatusPanelProps {
  ftpIntegration: any;
  totalFiles: number;
  totalSize: number;
  recentFiles: number;
  formatFileSize: (bytes: number) => string;
}

export const FtpStatusPanel = ({ 
  ftpIntegration, 
  totalFiles, 
  totalSize, 
  recentFiles, 
  formatFileSize 
}: FtpStatusPanelProps) => {
  const { testConnection } = useFtp();

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Servidor</span>
            </div>
            <p className="text-xs bg-gray-50 px-2 py-1 rounded font-mono">
              {ftpIntegration.base_url}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">Usuário</span>
            </div>
            <p className="text-xs bg-gray-50 px-2 py-1 rounded">
              {ftpIntegration.username || 'anonymous'}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => testConnection.mutate()}
            disabled={testConnection.isPending}
            className="w-full mt-3"
          >
            {testConnection.isPending ? 'Testando...' : 'Testar Conexão'}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <HardDrive className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Total</p>
                  <p className="text-xs text-gray-600">arquivos</p>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600">{totalFiles}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Recentes</p>
                  <p className="text-xs text-gray-600">hoje</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">{recentFiles}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Database className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tamanho</p>
                  <p className="text-xs text-gray-600">total</p>
                </div>
              </div>
              <span className="text-sm font-bold text-purple-600">
                {formatFileSize(totalSize)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/admin'}
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações FTP
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
