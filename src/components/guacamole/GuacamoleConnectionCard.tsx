
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Power, 
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { GuacamoleConnection } from '@/hooks/useGuacamoleAPI';

interface GuacamoleConnectionCardProps {
  connection: GuacamoleConnection;
  onConnect: (connection: GuacamoleConnection) => void;
  onEdit: (connection: GuacamoleConnection) => void;
  onDelete: (connectionId: string) => void;
  onToggleDetails: (connectionId: string) => void;
  showDetails: boolean;
  isDeleting?: boolean;
}

export const GuacamoleConnectionCard = ({
  connection,
  onConnect,
  onEdit,
  onDelete,
  onToggleDetails,
  showDetails,
  isDeleting = false
}: GuacamoleConnectionCardProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const getProtocolColor = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'vnc': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ssh': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'telnet': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect(connection);
    } finally {
      setIsConnecting(false);
    }
  };

  const getConnectionStatus = () => {
    if (connection.activeConnections > 0) {
      return { label: 'Ativo', color: 'bg-green-500' };
    }
    return { label: 'Inativo', color: 'bg-gray-400' };
  };

  const status = getConnectionStatus();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg dark:bg-orange-900">
              <Monitor className="h-5 w-5 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <CardTitle className="text-lg">{connection.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge className={getProtocolColor(connection.protocol)}>
                  {connection.protocol?.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                  <span className="text-sm">{status.label}</span>
                </div>
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleDetails(connection.identifier)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showDetails && (
          <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
            <div><strong>ID:</strong> {connection.identifier}</div>
            {connection.parameters?.hostname && (
              <div><strong>Host:</strong> {connection.parameters.hostname}</div>
            )}
            {connection.parameters?.port && (
              <div><strong>Porta:</strong> {connection.parameters.port}</div>
            )}
            <div><strong>Sessões Ativas:</strong> {connection.activeConnections}</div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 min-w-[120px]"
          >
            {isConnecting ? (
              <Power className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            {isConnecting ? 'Conectando...' : 'Conectar'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(connection)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(connection.identifier)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
