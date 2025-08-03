import React from 'react';
import { Wifi, Shield, Users, Database, Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface UniFiNetworksManagerProps {
  networks: any[];
  loading?: boolean;
  onToggleNetwork?: (networkId: string, enabled: boolean) => void;
  onEditNetwork?: (networkId: string) => void;
}

export const UniFiNetworksManager: React.FC<UniFiNetworksManagerProps> = ({
  networks = [],
  loading = false,
  onToggleNetwork,
  onEditNetwork
}) => {
  const getSecurityIcon = (security: string) => {
    switch (security.toLowerCase()) {
      case 'wpapsk':
      case 'wpa2psk':
      case 'wpa3psk':
        return <Shield className="h-4 w-4 text-success" />;
      case 'open':
        return <Eye className="h-4 w-4 text-warning" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSecurityBadge = (security: string) => {
    switch (security.toLowerCase()) {
      case 'wpapsk':
        return <Badge variant="secondary">WPA-PSK</Badge>;
      case 'wpa2psk':
        return <Badge variant="default">WPA2-PSK</Badge>;
      case 'wpa3psk':
        return <Badge variant="default">WPA3-PSK</Badge>;
      case 'open':
        return <Badge variant="destructive">Aberto</Badge>;
      default:
        return <Badge variant="outline">{security}</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeNetworks = networks.filter(n => n.enabled);
  const guestNetworks = networks.filter(n => n.purpose === 'guest');
  const totalClients = networks.reduce((sum, n) => sum + (n.num_sta || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redes Ativas</CardTitle>
            <Wifi className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeNetworks.length}</div>
            <p className="text-xs text-muted-foreground">
              de {networks.length} redes configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redes Guest</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestNetworks.length}</div>
            <p className="text-xs text-muted-foreground">Acesso para visitantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Conectados</CardTitle>
            <Database className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Dispositivos em todas as redes</p>
          </CardContent>
        </Card>
      </div>

      {/* Networks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Wi-Fi Configuradas</CardTitle>
          <CardDescription>Gerenciamento de SSIDs e configurações de rede</CardDescription>
        </CardHeader>
        <CardContent>
          {networks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhuma rede configurada</p>
              <p className="text-sm">Configure uma rede Wi-Fi para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Rede</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Segurança</TableHead>
                  <TableHead>VLAN</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Tráfego</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.map((network) => (
                  <TableRow key={network._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{network.name}</div>
                          {network.purpose === 'guest' && (
                            <Badge variant="outline" className="text-xs">Guest</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {network.purpose === 'corporate' ? 'Corporativa' : 
                         network.purpose === 'guest' ? 'Visitante' : 
                         network.purpose || 'Padrão'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSecurityIcon(network.security)}
                        {getSecurityBadge(network.security)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {network.vlan_enabled ? (
                        <Badge variant="secondary">VLAN {network.vlan}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Não configurada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {network.num_sta || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>↑ {formatBytes(network.tx_bytes || 0)}</div>
                        <div>↓ {formatBytes(network.rx_bytes || 0)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={network.enabled}
                          onCheckedChange={(enabled) => onToggleNetwork?.(network._id, enabled)}
                        />
                        <span className="text-sm">
                          {network.enabled ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditNetwork?.(network._id)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configurar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};