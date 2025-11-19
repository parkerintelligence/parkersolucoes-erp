import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, RefreshCw, Plus, Trash2, Power, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MikrotikFirewallDialog } from './MikrotikFirewallDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateFirewallSummary } from '@/utils/mikrotikExportFormatters';

const getChainColor = (chain: string) => {
  switch (chain) {
    case 'input':
      return 'bg-blue-900/30 dark:bg-blue-900/50 hover:bg-blue-900/40 dark:hover:bg-blue-900/60';
    case 'forward':
      return 'bg-green-900/30 dark:bg-green-900/50 hover:bg-green-900/40 dark:hover:bg-green-900/60';
    case 'output':
      return 'bg-yellow-900/30 dark:bg-yellow-900/50 hover:bg-yellow-900/40 dark:hover:bg-yellow-900/60';
    default:
      return 'hover:bg-muted/50';
  }
};

export const MikrotikFirewall = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await callAPI('/ip/firewall/filter');
      if (data) {
        setRules(data);
      }
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    }
  };

  const toggleRule = async (id: string, currentDisabled: boolean) => {
    try {
      await callAPI(`/ip/firewall/filter/${id}`, 'PATCH', { disabled: !currentDisabled });
      toast({
        title: 'Sucesso',
        description: currentDisabled ? 'Regra ativada com sucesso' : 'Regra desativada com sucesso',
      });
      loadRules();
    } catch (error) {
      console.error('Erro ao alternar regra:', error);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await callAPI(`/ip/firewall/filter/${id}`, 'DELETE');
      toast({
        title: 'Sucesso',
        description: 'Regra removida com sucesso',
      });
      loadRules();
    } catch (error) {
      console.error('Erro ao remover regra:', error);
    }
  };

  const handleDelete = (rule: any) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete['.id']);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
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

  const filteredAndSortedRules = useMemo(() => {
    let filtered = rules.filter((rule) => {
      const searchTerm = filter.toLowerCase();
      return (
        rule.chain?.toLowerCase().includes(searchTerm) ||
        rule.action?.toLowerCase().includes(searchTerm) ||
        rule.protocol?.toLowerCase().includes(searchTerm) ||
        rule['src-address']?.toLowerCase().includes(searchTerm) ||
        rule['dst-address']?.toLowerCase().includes(searchTerm) ||
        rule['in-interface']?.toLowerCase().includes(searchTerm) ||
        rule['out-interface']?.toLowerCase().includes(searchTerm) ||
        rule.comment?.toLowerCase().includes(searchTerm)
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
  }, [rules, filter, sortField, sortDirection]);

  const getStatusBadge = (rule: any) => {
    if (rule.disabled === "true" || rule.disabled === true) {
      return <Badge className="bg-red-600/80 text-white">Desativada</Badge>;
    }
    if (rule.invalid === "true" || rule.invalid === true) {
      return <Badge className="bg-yellow-600/80 text-white">Inválida</Badge>;
    }
    return <Badge className="bg-green-600/80 text-white">Ativa</Badge>;
  };

  if (loading && rules.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Regras de Firewall</CardTitle>
            <CardDescription>Gerenciar regras de firewall do MikroTik</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
            <Button onClick={loadRules} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
        <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar regras de firewall..." />
      </CardHeader>
      <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-slate-700/30">
              <TableHead className="text-slate-300">
                <Button variant="ghost" size="sm" onClick={() => handleSort('chain')} className="h-8 px-2">
                  Chain
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-300">
                <Button variant="ghost" size="sm" onClick={() => handleSort('action')} className="h-8 px-2">
                  Ação
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-300">
                <Button variant="ghost" size="sm" onClick={() => handleSort('protocol')} className="h-8 px-2">
                  Protocolo
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-300">Origem</TableHead>
              <TableHead className="text-slate-300">Porta Origem</TableHead>
              <TableHead className="text-slate-300">Destino</TableHead>
              <TableHead className="text-slate-300">Porta Destino</TableHead>
              <TableHead className="text-slate-300">Interface</TableHead>
              <TableHead className="text-slate-300">Comentário</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRules.map((rule) => (
              <TableRow key={rule['.id']} className={`hover:bg-slate-700/50 ${getChainColor(rule.chain)}`}>
                <TableCell className="font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    {rule.chain}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={rule.action === 'accept' ? 'default' : 'destructive'}>
                    {rule.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-200">{rule.protocol || 'all'}</TableCell>
                <TableCell className="max-w-[150px] truncate text-slate-200">
                  {rule['src-address'] || 'any'}
                </TableCell>
                <TableCell className="text-slate-200">{rule['src-port'] || '-'}</TableCell>
                <TableCell className="max-w-[150px] truncate text-slate-200">
                  {rule['dst-address'] || 'any'}
                </TableCell>
                <TableCell className="text-slate-200">{rule['dst-port'] || '-'}</TableCell>
                <TableCell className="text-xs text-slate-200">
                  {rule['in-interface'] || rule['out-interface'] || '-'}
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-slate-400 text-xs">
                  {rule.comment || '-'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(rule)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => toggleRule(rule['.id'], rule.disabled)}
                      className={rule.disabled ? "border-green-600/50 text-green-400 hover:bg-green-600/20" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                    >
                      <Power className="h-3 w-3" />
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleDelete(rule)}
                      className="border-red-600/50 text-red-400 hover:bg-red-600/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAndSortedRules.length === 0 && rules.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma regra encontrada com o filtro aplicado
          </div>
        )}

        {rules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma regra de firewall configurada
          </div>
        )}
      </CardContent>
      
      <MikrotikFirewallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadRules}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra de firewall? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
