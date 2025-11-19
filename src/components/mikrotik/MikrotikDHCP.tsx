import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Network, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const MikrotikDHCP = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [leases, setLeases] = useState<any[]>([]);

  useEffect(() => {
    loadLeases();
  }, []);

  const loadLeases = async () => {
    try {
      const data = await callAPI('/ip/dhcp-server/lease');
      if (data) {
        setLeases(data);
      }
    } catch (error) {
      console.error('Erro ao carregar leases DHCP:', error);
    }
  };

  const formatMacAddress = (mac: string) => {
    if (!mac) return 'N/A';
    return mac.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'bound':
        return <Badge variant="default">Conectado</Badge>;
      case 'waiting':
        return <Badge variant="secondary">Aguardando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && leases.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const activeLeases = leases.filter((l) => l.status === 'bound');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clientes DHCP</CardTitle>
            <CardDescription>
              {activeLeases.length} dispositivos conectados
            </CardDescription>
          </div>
          <Button onClick={loadLeases} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hostname</TableHead>
              <TableHead>Endereço IP</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Servidor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leases.map((lease) => (
              <TableRow key={lease['.id']}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-500" />
                    {lease['host-name'] || lease.comment || 'Sem nome'}
                  </div>
                </TableCell>
                <TableCell>{lease.address || 'N/A'}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {formatMacAddress(lease['mac-address'])}
                  </code>
                </TableCell>
                <TableCell>{lease.server || 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(lease.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {lease['expires-after'] || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {leases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente DHCP encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
};
