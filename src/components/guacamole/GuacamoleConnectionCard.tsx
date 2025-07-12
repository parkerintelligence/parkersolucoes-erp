
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Power
} from 'lucide-react';
import { GuacamoleConnection } from '@/hooks/useGuacamoleAPI';

interface GuacamoleConnectionCardProps {
  connection: GuacamoleConnection;
  onConnect: (connection: GuacamoleConnection) => void;
  onEdit: (connection: GuacamoleConnection) => void;
  onDelete: (connectionId: string) => void;
  isDeleting?: boolean;
}

export const GuacamoleConnectionCard = ({
  connection,
  onConnect,
  onEdit,
  onDelete,
  isDeleting = false
}: Omit<GuacamoleConnectionCardProps, 'onToggleDetails' | 'showDetails'>) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const getProtocolColor = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'vnc': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'ssh': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'telnet': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
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
    // Verificar se há sessões ativas para esta conexão
    if (connection.activeConnections && connection.activeConnections > 0) {
      return { label: 'Ativo', color: 'bg-emerald-500' };
    }
    // Verificar se a conexão está configurada corretamente
    if (connection.parameters?.hostname) {
      return { label: 'Disponível', color: 'bg-blue-500' };
    }
    return { label: 'Configuração Incompleta', color: 'bg-orange-500' };
  };

  const status = getConnectionStatus();

  return (
    <Card className="bg-card border-border hover:shadow-sm hover:border-primary/20 transition-all">
      <CardHeader className="pb-1 px-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1 rounded-sm">
            <Monitor className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">{connection.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-0">
              <Badge className={getProtocolColor(connection.protocol)} variant="secondary">
                <span className="text-xs">{connection.protocol?.toUpperCase()}</span>
              </Badge>
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${status.color}`} />
                <span className="text-xs">{status.label}</span>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-2">
        <div className="flex items-center gap-1">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="flex-1 h-7 text-xs"
          >
            {isConnecting ? (
              <Power className="h-2.5 w-2.5 mr-1 animate-spin" />
            ) : (
              <ExternalLink className="h-2.5 w-2.5 mr-1" />
            )}
            {isConnecting ? 'Conectando...' : 'Conectar'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => onEdit(connection)}
          >
            <Edit className="h-2.5 w-2.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => onDelete(connection.identifier)}
            disabled={isDeleting}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
