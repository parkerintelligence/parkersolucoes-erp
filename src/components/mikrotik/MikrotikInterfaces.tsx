import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Wifi, RefreshCw, Power, PowerOff, ArrowUpDown } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateInterfacesSummary, formatBytes } from '@/utils/mikrotikExportFormatters';
import { MikrotikPagination } from './MikrotikPagination';
import { cn } from '@/lib/utils';

export const MikrotikInterfaces = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => { loadInterfaces(); }, []);

  const loadInterfaces = async () => {
    try { const data = await callAPI('/interface'); if (data) setInterfaces(data); }
    catch (error) { console.error('Erro ao carregar interfaces:', error); }
  };

  const toggleInterface = async (id: string, disabled: boolean) => {
    try {
      await callAPI(`/interface/${id}`, 'PATCH', { disabled: !disabled });
      toast({ title: 'Sucesso', description: `Interface ${disabled ? 'ativada' : 'desativada'}` });
      loadInterfaces();
    } catch (error) { console.error('Erro ao alterar interface:', error); }
  };

  const fmtBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredAndSortedInterfaces = useMemo(() => {
    let filtered = interfaces.filter((iface) => {
      const s = filter.toLowerCase();
      return iface.name?.toLowerCase().includes(s) || iface.type?.toLowerCase().includes(s);
    });
    if (sortField) {
      filtered.sort((a, b) => {
        const c = (a[sortField] || '').toString().localeCompare((b[sortField] || '').toString());
        return sortDirection === 'asc' ? c : -c;
      });
    }
    return filtered;
  }, [interfaces, filter, sortField, sortDirection]);

  const totalItems = filteredAndSortedInterfaces.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInterfaces = filteredAndSortedInterfaces.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filter, sortField, sortDirection, itemsPerPage]);

  if (loading && interfaces.length === 0) {
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
          <h3 className="text-sm font-bold text-foreground">Interfaces de Rede</h3>
          <p className="text-[10px] text-muted-foreground">{totalItems} interfaces</p>
        </div>
        <div className="flex gap-1.5">
          <MikrotikExportActions data={interfaces} filteredData={filteredAndSortedInterfaces}
            columns={[
              { key: 'name', label: 'Nome' }, { key: 'type', label: 'Tipo' },
              { key: 'running', label: 'Status', formatter: (val) => val === 'true' ? 'Conectado' : 'Desconectado' },
              { key: 'rx-byte', label: 'RX', formatter: (val) => fmtBytes(parseInt(val || '0')) },
              { key: 'tx-byte', label: 'TX', formatter: (val) => fmtBytes(parseInt(val || '0')) },
            ]}
            gridTitle="Interfaces" getSummary={() => generateInterfacesSummary(filteredAndSortedInterfaces)}
          />
          <Button onClick={loadInterfaces} disabled={loading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar interfaces..." />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {[{ key: 'name', label: 'Nome' }, { key: 'type', label: 'Tipo' }].map(col => (
                <TableHead key={col.key} className="text-muted-foreground text-xs h-8 px-3">
                  <Button variant="ghost" size="sm" onClick={() => handleSort(col.key)} className="h-6 px-1 text-[10px] text-muted-foreground">
                    {col.label} <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">RX</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">TX</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3 w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInterfaces.map((iface) => (
              <TableRow key={iface['.id']} className="border-border hover:bg-muted/30 group">
                <TableCell className="py-1.5 px-3 text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Wifi className={cn("h-3 w-3", iface.running ? 'text-emerald-500' : 'text-muted-foreground')} />
                    {iface.name}
                  </div>
                </TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{iface.type}</TableCell>
                <TableCell className="py-1.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                    iface.disabled === "true" ? 'border-destructive/30 text-destructive bg-destructive/10'
                    : iface.running ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  }`}>
                    {iface.disabled === "true" ? 'Desativada' : iface.running ? 'UP' : 'DOWN'}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 px-3 text-[10px] text-muted-foreground">{fmtBytes(iface['rx-byte'])}</TableCell>
                <TableCell className="py-1.5 px-3 text-[10px] text-muted-foreground">{fmtBytes(iface['tx-byte'])}</TableCell>
                <TableCell className="py-1.5 px-3">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => toggleInterface(iface['.id'], iface.disabled === "true")}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                      {iface.disabled === "true" ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MikrotikPagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage}
        totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
        onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />

      {filteredAndSortedInterfaces.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs">
          {interfaces.length > 0 ? 'Nenhuma interface encontrada com o filtro aplicado' : 'Nenhuma interface encontrada'}
        </div>
      )}
    </div>
  );
};
