
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Smartphone, 
  Laptop, 
  Signal,
  Ban,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { UniFiClient } from '@/hooks/useUniFiAPI';

interface UniFiClientManagerProps {
  clients: UniFiClient[];
  loading?: boolean;
  onBlockClient: (siteId: string, clientId: string, block: boolean) => void;
  blockLoading?: boolean;
  selectedSiteId?: string;
}

export const UniFiClientManager: React.FC<UniFiClientManagerProps> = ({
  clients,
  loading = false,
  onBlockClient,
  blockLoading = false,
  selectedSiteId
}) => {
  const getClientIcon = (isWired: boolean) => {
    return isWired ? 
      <Laptop className="h-4 w-4 text-green-400" /> : 
      <Smartphone className="h-4 w-4 text-blue-400" />;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  };

  const handleBlockClient = (clientId: string, block: boolean) => {
    if (selectedSiteId) {
      onBlockClient(selectedSiteId, clientId, block);
    }
  };

  const isClientBlocked = (client: UniFiClient) => {
    // Verificar se o cliente está bloqueado baseado no tempo desde a última conexão
    const now = Date.now() / 1000;
    const timeSinceLastSeen = now - (client.lastSeen || 0);
    return timeSinceLastSeen > 300; // Considera bloqueado se não visto há mais de 5 minutos
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-400">Carregando clientes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gerenciamento de Clientes ({clients.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cliente conectado</p>
            <p className="text-sm">Selecione um site para ver os clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300">Cliente</TableHead>
                  <TableHead className="text-gray-300">IP</TableHead>
                  <TableHead className="text-gray-300">MAC</TableHead>
                  <TableHead className="text-gray-300">Conexão</TableHead>
                  <TableHead className="text-gray-300">Rede</TableHead>
                  <TableHead className="text-gray-300">Sinal</TableHead>
                  <TableHead className="text-gray-300">Última Conexão</TableHead>
                  <TableHead className="text-gray-300">Uptime</TableHead>
                  <TableHead className="text-gray-300">Download</TableHead>
                  <TableHead className="text-gray-300">Upload</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const blocked = isClientBlocked(client);
                  
                  return (
                    <TableRow key={client.id} className="border-gray-700 hover:bg-gray-800/30">
                      <TableCell className="flex items-center gap-2">
                        {getClientIcon(client.isWired || false)}
                        <span className="font-medium text-gray-200">
                          {client.hostname || client.name || 'Cliente Desconhecido'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">{client.ip}</TableCell>
                      <TableCell className="text-gray-300 font-mono text-xs">{client.mac}</TableCell>
                      <TableCell className="text-gray-300">
                        <Badge className={client.isWired ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-blue-900/20 text-blue-400 border-blue-600'}>
                          {client.isWired ? 'Cabeada' : 'Wireless'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{client.network || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">
                        {client.signal ? (
                          <div className="flex items-center gap-1">
                            <Signal className="h-4 w-4" />
                            {client.signal}dBm
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {client.lastSeen ? formatLastSeen(client.lastSeen) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-300">{client.uptime ? formatUptime(client.uptime) : '-'}</TableCell>
                      <TableCell className="text-gray-300">{client.rxBytes ? formatBytes(client.rxBytes) : '0 B'}</TableCell>
                      <TableCell className="text-gray-300">{client.txBytes ? formatBytes(client.txBytes) : '0 B'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={blocked ? "default" : "destructive"}
                            onClick={() => handleBlockClient(client.mac, !blocked)}
                            disabled={blockLoading}
                            className={blocked ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {blocked ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
