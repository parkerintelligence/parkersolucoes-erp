import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Shield, RefreshCw, Plus, Trash2, Power, ArrowUpDown } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MikrotikFirewallDialog } from './MikrotikFirewallDialog';
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateFirewallSummary } from '@/utils/mikrotikExportFormatters';
import { MikrotikPagination } from './MikrotikPagination';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export const MikrotikFirewall = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();
  const [rules, setRules] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const data = await callAPI('/ip/firewall/filter');
      if (data) setRules(data);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    }
  };

  const toggleRule = async (id: string, currentDisabled: boolean) => {
    try {
      await callAPI(`/ip/firewall/filter/${id}`, 'PATCH', { disabled: !currentDisabled });
      toast({ title: 'Sucesso', description: currentDisabled ? 'Regra ativada' : 'Regra desativada' });
      loadRules();
    } catch (error) {
      console.error('Erro ao alternar regra:', error);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await callAPI(`/ip/firewall/filter/${id}`, 'DELETE');
      toast({ title: 'Sucesso', description: 'Regra removida' });
      loadRules();
    } catch (error) {
      console.error('Erro ao remover regra:', error);
    }
  };

  const handleDelete = async (rule: any) => {
    const ok = await confirm({
      title: 'Excluir regra de firewall',
      description: 'Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.',
      variant: 'destructive',
      icon: 'trash',
    });
    if (ok) deleteRule(rule['.id']);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRules = useMemo(() => {
    let filtered = rules.filter((rule) => {
      const s = filter.toLowerCase();
      return (
        rule.chain?.toLowerCase().includes(s) ||
        rule.action?.toLowerCase().includes(s) ||
        rule.protocol?.toLowerCase().includes(s) ||
        rule['src-address']?.toLowerCase().includes(s) ||
        rule['dst-address']?.toLowerCase().includes(s) ||
        rule['in-interface']?.toLowerCase().includes(s) ||
        rule['out-interface']?.toLowerCase().includes(s) ||
        rule.comment?.toLowerCase().includes(s)
      );
    });
    if (sortField) {
      filtered.sort((a, b) => {
        const comparison = (a[sortField] || '').toString().localeCompare((b[sortField] || '').toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return filtered;
  }, [rules, filter, sortField, sortDirection]);

  const totalItems = filteredAndSortedRules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRules = filteredAndSortedRules.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filter, sortField, sortDirection, itemsPerPage]);

  if (loading && rules.length === 0) {
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
          <h3 className="text-sm font-bold text-foreground">Regras de Firewall</h3>
          <p className="text-[10px] text-muted-foreground">{totalItems} regras encontradas</p>
        </div>
        <div className="flex gap-1.5">
          <MikrotikExportActions
            data={rules}
            filteredData={filteredAndSortedRules}
            columns={[
              { key: 'chain', label: 'Chain' },
              { key: 'action', label: 'Ação' },
              { key: 'protocol', label: 'Protocolo' },
              { key: 'src-address', label: 'Origem' },
              { key: 'dst-address', label: 'Destino' },
              { key: 'dst-port', label: 'Porta' },
              { key: 'comment', label: 'Comentário' },
              { key: 'disabled', label: 'Status', formatter: (val) => val === 'true' ? 'Desativada' : 'Ativa' },
            ]}
            gridTitle="Firewall"
            getSummary={() => generateFirewallSummary(filteredAndSortedRules)}
          />
          <Button onClick={() => setDialogOpen(true)} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova Regra
          </Button>
          <Button onClick={loadRules} disabled={loading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar regras..." />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {[
                { key: 'chain', label: 'Chain' },
                { key: 'action', label: 'Ação' },
                { key: 'protocol', label: 'Proto' },
              ].map(col => (
                <TableHead key={col.key} className="text-muted-foreground text-xs h-8 px-3">
                  <Button variant="ghost" size="sm" onClick={() => handleSort(col.key)} className="h-6 px-1 text-[10px] text-muted-foreground">
                    {col.label} <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Origem</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Destino</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Porta</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Interface</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Comentário</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3 w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRules.map((rule) => (
              <TableRow key={rule['.id']} className="border-border hover:bg-muted/30 group">
                <TableCell className="py-1.5 px-3 text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-primary" />
                    {rule.chain}
                  </div>
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                    rule.action === 'accept' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : rule.action === 'drop' ? 'border-destructive/30 text-destructive bg-destructive/10'
                    : 'border-border text-muted-foreground'
                  }`}>
                    {rule.action}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-foreground">{rule.protocol || 'all'}</TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground max-w-[120px] truncate">{rule['src-address'] || 'any'}</TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground max-w-[120px] truncate">{rule['dst-address'] || 'any'}</TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{rule['dst-port'] || '-'}</TableCell>
                <TableCell className="py-1.5 px-3 text-[10px] text-muted-foreground">{rule['in-interface'] || rule['out-interface'] || '-'}</TableCell>
                <TableCell className="py-1.5 px-3 text-[10px] text-muted-foreground max-w-[120px] truncate">{rule.comment || '-'}</TableCell>
                <TableCell className="py-1.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                    rule.disabled === "true" ? 'border-destructive/30 text-destructive bg-destructive/10'
                    : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  }`}>
                    {rule.disabled === "true" ? 'Off' : 'On'}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => toggleRule(rule['.id'], rule.disabled === "true")} className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                      <Power className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MikrotikPagination
        currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage}
        totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
        onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage}
      />

      {filteredAndSortedRules.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs">
          {rules.length > 0 ? 'Nenhuma regra encontrada com o filtro aplicado' : 'Nenhuma regra de firewall configurada'}
        </div>
      )}

      <MikrotikFirewallDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadRules} />
    </div>
  );
};
