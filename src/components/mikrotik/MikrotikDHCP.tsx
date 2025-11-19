import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Network, RefreshCw, ArrowUpDown, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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

  const isStaticLease = (lease: any): boolean => {
    return lease.dynamic === 'false' || !lease.dynamic;
  };

  const makeStatic = async (lease: any) => {
    try {
      if (!lease['.id']) {
        toast({
          title: 'Erro',
          description: 'ID do lease não encontrado',
          variant: 'destructive',
        });
        return;
      }

      // Usar o comando make-static no formato correto do MikroTik REST API
      await callAPI(`/ip/dhcp-server/lease/${lease['.id']}/make-static`, 'POST');

      toast({
        title: 'Sucesso',
        description: `IP ${lease.address} fixado com sucesso`,
      });

      loadLeases();
    } catch (error) {
      console.error('Erro ao fixar IP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fixar o IP. Verifique se o lease é dinâmico.',
        variant: 'destructive',
      });
    }
  };

  const removeStatic = async (lease: any) => {
    try {
      if (!lease['.id']) {
        toast({
          title: 'Erro',
          description: 'ID do lease não encontrado',
          variant: 'destructive',
        });
        return;
      }

      await callAPI(`/ip/dhcp-server/lease/${lease['.id']}`, 'DELETE');

      toast({
        title: 'Sucesso',
        description: `Lease estático de ${lease.address} removido`,
      });

      loadLeases();
    } catch (error) {
      console.error('Erro ao remover lease estático:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o lease estático',
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
        let aVal = a[sortField] || '';
        let bVal = b[sortField] || '';
        
        // Ordenação especial para o campo "dynamic" (tipo)
        if (sortField === 'dynamic') {
          aVal = a.dynamic === 'true' ? '1' : '0'; // Dinâmico = 1, Estático = 0
          bVal = b.dynamic === 'true' ? '1' : '0';
        }
        
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [leases, filter, sortField, sortDirection]);

  // Calcular paginação
  const totalItems = filteredAndSortedLeases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeases = filteredAndSortedLeases.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortField, sortDirection, itemsPerPage]);

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
                { key: 'mac-address', label: 'MAC Address', formatter: (val) => val?.toUpperCase() || 'N/A' },
                { key: 'server', label: 'Servidor' },
                { key: 'status', label: 'Status' },
                { key: 'expires-after', label: 'Expira em' },
                { 
                  key: 'dynamic', 
                  label: 'Tipo',
                  formatter: (val) => val === 'true' ? '🔄 Dinâmico' : '🔒 IP Fixo'
                },
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
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('mac-address')} className="h-8 px-2">
                  MAC Address
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Servidor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('expires-after')} className="h-8 px-2">
                  Expira em
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('dynamic')} className="h-8 px-2">
                  Tipo
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {paginatedLeases.map((lease) => (
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
                  {isStaticLease(lease) ? (
                    <Badge className="bg-purple-600/80 text-white">
                      🔒 IP Fixo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-600 text-blue-400">
                      🔄 Dinâmico
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isStaticLease(lease) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeStatic(lease)}
                      disabled={loading}
                      className="h-7 text-xs border-red-600/50 text-red-400 hover:bg-red-600/20"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remover IP Fixo
                    </Button>
                  ) : lease.status === 'bound' ? (
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
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Registros por página:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-400">
              Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} registros
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-300 px-3">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
