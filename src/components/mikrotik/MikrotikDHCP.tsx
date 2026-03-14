import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Network, RefreshCw, ArrowUpDown, X } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateDHCPSummary } from '@/utils/mikrotikExportFormatters';
import { MikrotikPagination } from './MikrotikPagination';

export const MikrotikDHCP = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [leases, setLeases] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => { loadLeases(); }, []);

  const loadLeases = async () => {
    try {
      const data = await callAPI('/ip/dhcp-server/lease');
      if (data) setLeases(data);
    } catch (error) {
      console.error('Erro ao carregar leases DHCP:', error);
    }
  };

  const isStaticLease = (lease: any): boolean => lease.dynamic === 'false' || !lease.dynamic;

  const makeStatic = async (lease: any) => {
    try {
      if (!lease['.id']) { toast({ title: 'Erro', description: 'ID do lease não encontrado', variant: 'destructive' }); return; }
      await callAPI(`/ip/dhcp-server/lease/${lease['.id']}/make-static`, 'POST');
      toast({ title: 'Sucesso', description: `IP ${lease.address} fixado` });
      loadLeases();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível fixar o IP', variant: 'destructive' });
    }
  };

  const removeStatic = async (lease: any) => {
    try {
      if (!lease['.id']) { toast({ title: 'Erro', description: 'ID do lease não encontrado', variant: 'destructive' }); return; }
      await callAPI(`/ip/dhcp-server/lease/${lease['.id']}`, 'DELETE');
      toast({ title: 'Sucesso', description: `Lease estático de ${lease.address} removido` });
      loadLeases();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover o lease estático', variant: 'destructive' });
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredAndSortedLeases = useMemo(() => {
    let filtered = leases.filter((l) => {
      const s = filter.toLowerCase();
      return l['host-name']?.toLowerCase().includes(s) || l.comment?.toLowerCase().includes(s) ||
        l.address?.toLowerCase().includes(s) || l['mac-address']?.toLowerCase().includes(s) || l.server?.toLowerCase().includes(s);
    });
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField] || '';
        let bVal = b[sortField] || '';
        if (sortField === 'dynamic') { aVal = a.dynamic === 'true' ? '1' : '0'; bVal = b.dynamic === 'true' ? '1' : '0'; }
        const c = aVal.toString().localeCompare(bVal.toString());
        return sortDirection === 'asc' ? c : -c;
      });
    }
    return filtered;
  }, [leases, filter, sortField, sortDirection]);

  const totalItems = filteredAndSortedLeases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeases = filteredAndSortedLeases.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filter, sortField, sortDirection, itemsPerPage]);

  const activeLeases = leases.filter((l) => l.status === 'bound');

  if (loading && leases.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Clientes DHCP</h3>
          <p className="text-[10px] text-muted-foreground">{activeLeases.length} conectados de {leases.length} total</p>
        </div>
        <div className="flex gap-1.5">
          <MikrotikExportActions data={leases} filteredData={filteredAndSortedLeases}
            columns={[
              { key: 'host-name', label: 'Hostname' }, { key: 'address', label: 'IP' },
              { key: 'mac-address', label: 'MAC', formatter: (val) => val?.toUpperCase() || 'N/A' },
              { key: 'server', label: 'Servidor' }, { key: 'status', label: 'Status' },
              { key: 'dynamic', label: 'Tipo', formatter: (val) => val === 'true' ? 'Dinâmico' : 'IP Fixo' },
            ]}
            gridTitle="DHCP Leases" getSummary={() => generateDHCPSummary(filteredAndSortedLeases)}
          />
          <Button onClick={loadLeases} disabled={loading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar clientes DHCP..." />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {[
                { key: 'host-name', label: 'Hostname' },
                { key: 'address', label: 'IP' },
                { key: 'mac-address', label: 'MAC' },
              ].map(col => (
                <TableHead key={col.key} className="text-muted-foreground text-xs h-8 px-3">
                  <Button variant="ghost" size="sm" onClick={() => handleSort(col.key)} className="h-6 px-1 text-[10px] text-muted-foreground">
                    {col.label} <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Servidor</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">
                <Button variant="ghost" size="sm" onClick={() => handleSort('dynamic')} className="h-6 px-1 text-[10px] text-muted-foreground">
                  Tipo <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
                </Button>
              </TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3 w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeases.map((lease) => (
              <TableRow key={lease['.id']} className="border-border hover:bg-muted/30 group">
                <TableCell className="py-1.5 px-3 text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Network className="h-3 w-3 text-primary" />
                    {lease['host-name'] || lease.comment || 'Sem nome'}
                  </div>
                </TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-foreground">{lease.address || 'N/A'}</TableCell>
                <TableCell className="py-1.5 px-3">
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground">{(lease['mac-address'] || 'N/A').toUpperCase()}</code>
                </TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{lease.server || 'N/A'}</TableCell>
                <TableCell className="py-1.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                    lease.status === 'bound' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  }`}>
                    {lease.status === 'bound' ? 'Conectado' : lease.status || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                    isStaticLease(lease) ? 'border-primary/30 text-primary bg-primary/10' : 'border-border text-muted-foreground'
                  }`}>
                    {isStaticLease(lease) ? '🔒 Fixo' : '🔄 Dinâmico'}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  {isStaticLease(lease) ? (
                    <Button variant="ghost" size="sm" onClick={() => removeStatic(lease)} disabled={loading}
                      className="h-6 text-[10px] px-2 text-destructive hover:text-destructive">
                      <X className="h-3 w-3 mr-1" /> Remover Fixo
                    </Button>
                  ) : lease.status === 'bound' ? (
                    <Button variant="ghost" size="sm" onClick={() => makeStatic(lease)} disabled={loading}
                      className="h-6 text-[10px] px-2 text-primary hover:text-primary">
                      <Network className="h-3 w-3 mr-1" /> Fixar IP
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MikrotikPagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage}
        totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
        onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />

      {filteredAndSortedLeases.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs">
          {leases.length > 0 ? 'Nenhum cliente encontrado com o filtro aplicado' : 'Nenhum cliente DHCP encontrado'}
        </div>
      )}
    </div>
  );
};
