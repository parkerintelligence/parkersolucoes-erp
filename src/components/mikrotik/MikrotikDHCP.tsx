import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Network, RefreshCw, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MikrotikTableFilter } from './MikrotikTableFilter';

export const MikrotikDHCP = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [leases, setLeases] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedLeases = useMemo(() => {
    let filtered = leases.filter((lease) => {
      const searchTerm = filter.toLowerCase();
      return (
        lease['host-name']?.toLowerCase().includes(searchTerm) ||
        lease.comment?.toLowerCase().includes(searchTerm) ||
        lease.address?.toLowerCase().includes(searchTerm) ||
        lease['mac-address']?.toLowerCase().includes(searchTerm) ||
        lease.server?.toLowerCase().includes(searchTerm)
      );
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [leases, filter, sortField, sortDirection]);

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
        <div className="flex items-center justify-between mb-4">
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
        <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar clientes DHCP..." />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('host-name')} className="h-8 px-2">
                  Hostname
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('address')} className="h-8 px-2">
                  Endereço IP
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Servidor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedLeases.map((lease) => (
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

        {filteredAndSortedLeases.length === 0 && leases.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente encontrado com o filtro aplicado
          </div>
        )}

        {leases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente DHCP encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
};
