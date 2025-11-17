
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
  onDisconnect?: (connectionId: string) => void;
  isDeleting?: boolean;
}

export const GuacamoleConnectionCard = ({
  connection,
  onConnect,
  onEdit,
  onDelete,
  onDisconnect,
  isDeleting = false
}: Omit<GuacamoleConnectionCardProps, 'onToggleDetails' | 'showDetails'>) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const getProtocolColor = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp': return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'vnc': return 'bg-green-400/20 text-green-300 border-green-400/30';
      case 'ssh': return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
      case 'telnet': return 'bg-orange-400/20 text-orange-300 border-orange-400/30';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
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

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect(connection.identifier);
    } finally {
      setIsDisconnecting(false);
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
    <Card className="bg-slate-800 border-slate-700 hover:shadow-lg hover:border-blue-500/40 transition-all h-[90px]">
      <CardHeader className="pb-1 px-2 pt-2">
        <div className="flex items-center gap-1">
          <div className="bg-blue-500/10 p-1 rounded-sm">
            <Monitor className="h-2.5 w-2.5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs truncate text-white">{connection.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-0">
              <Badge className={getProtocolColor(connection.protocol)} variant="secondary">
                <span className="text-[10px]">{connection.protocol?.toUpperCase()}</span>
              </Badge>
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${status.color}`} />
                <span className="text-[10px] text-slate-400">{status.label}</span>
                {connection.activeConnections && connection.activeConnections > 0 && onDisconnect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 px-1 ml-1 text-[9px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                  </Button>
                )}
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-2">
        <div className="flex items-center gap-1">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="flex-1 h-6 text-[10px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting ? (
              <Power className="h-2 w-2 mr-1 animate-spin" />
            ) : (
              <ExternalLink className="h-2 w-2 mr-1" />
            )}
            {isConnecting ? 'Conectando...' : 'Conectar'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-6 px-1.5 border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={() => onEdit(connection)}
          >
            <Edit className="h-2 w-2" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-6 px-1.5 border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={() => onDelete(connection.identifier)}
            disabled={isDeleting}
          >
            <Trash2 className="h-2 w-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
