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
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateDHCPSummary } from '@/utils/mikrotikExportFormatters';

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

  const makeStatic = async (lease: any) => {
    try {
      if (!lease.address || !lease['mac-address']) {
        toast({
          title: 'Erro',
          description: 'Lease não possui IP ou MAC address válidos',
          variant: 'destructive',
        });
        return;
      }

      await callAPI('/ip/dhcp-server/lease/add', 'POST', {
        address: lease.address,
        'mac-address': lease['mac-address'],
        'server': lease.server,
        'comment': lease.comment || lease['host-name'] || 'IP Fixo',
      });

      toast({
        title: 'Sucesso',
        description: `IP ${lease.address} fixado para ${lease['mac-address']}`,
      });

      loadLeases();
    } catch (error) {
      console.error('Erro ao fixar IP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fixar o IP',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'bound':
        return <Badge className="bg-green-600/80 text-white">Conectado</Badge>;
      case 'waiting':
        return <Badge className="bg-yellow-600/80 text-white">Aguardando</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-600 text-slate-400">{status}</Badge>;
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
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-white">Clientes DHCP</CardTitle>
            <CardDescription className="text-slate-400">
              {activeLeases.length} dispositivos conectados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <MikrotikExportActions
              data={leases}
              filteredData={filteredAndSortedLeases}
              columns={[
                { key: 'host-name', label: 'Hostname' },
                { key: 'address', label: 'IP' },
                { key: 'mac-address', label: 'MAC Address' },
                { key: 'server', label: 'Servidor' },
                { key: 'status', label: 'Status' },
                { key: 'expires-after', label: 'Expira em' },
                { key: 'comment', label: 'Comentário' }
              ]}
              gridTitle="DHCP Leases"
              getSummary={() => generateDHCPSummary(filteredAndSortedLeases)}
            />
            <Button onClick={loadLeases} disabled={loading} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
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
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedLeases.map((lease) => (
              <TableRow key={lease['.id']} className="hover:bg-slate-700/50">
                <TableCell className="font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-400" />
                    {lease['host-name'] || lease.comment || 'Sem nome'}
                  </div>
                </TableCell>
                <TableCell className="text-slate-200">{lease.address || 'N/A'}</TableCell>
                <TableCell>
                  <code className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-300">
                    {formatMacAddress(lease['mac-address'])}
                  </code>
                </TableCell>
                <TableCell className="text-slate-200">{lease.server || 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(lease.status)}</TableCell>
                <TableCell className="text-slate-400">
                  {lease['expires-after'] || 'N/A'}
                </TableCell>
                <TableCell>
                  {lease.status === 'bound' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => makeStatic(lease)}
                      disabled={loading}
                      className="h-7 text-xs border-green-600/50 text-green-400 hover:bg-green-600/20"
                    >
                      <Network className="h-3 w-3 mr-1" />
                      Fixar IP
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAndSortedLeases.length === 0 && leases.length > 0 && (
          <div className="text-center py-8 text-slate-400">
            Nenhum cliente encontrado com o filtro aplicado
          </div>
        )}

        {leases.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            Nenhum cliente DHCP encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
};
