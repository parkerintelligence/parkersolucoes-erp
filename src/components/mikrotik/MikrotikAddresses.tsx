import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Power, PowerOff, ArrowUpDown, RefreshCw } from "lucide-react";
import { MikrotikAddressDialog } from "./MikrotikAddressDialog";
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateAddressesSummary } from '@/utils/mikrotikExportFormatters';
import { MikrotikPagination } from './MikrotikPagination';

interface IPAddress {
  ".id": string; address: string; interface?: string; network?: string; disabled?: string; dynamic?: string; invalid?: string; comment?: string;
}

export const MikrotikAddresses = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IPAddress | null>(null);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: addresses = [], isLoading, refetch } = useQuery({
    queryKey: ["mikrotik-ip-addresses"],
    queryFn: async () => { const r = await callAPI("/ip/address", "GET"); return Array.isArray(r) ? r : []; },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await callAPI(`/ip/address/${id}`, "DELETE"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mikrotik-ip-addresses"] }); toast({ title: "Sucesso", description: "Endereço IP excluído" }); },
    onError: (error: any) => { toast({ title: "Erro", description: error.message, variant: "destructive" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
      await callAPI(`/ip/address/${id}`, "PATCH", { disabled: disabled ? "false" : "true" });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mikrotik-ip-addresses"] }); toast({ title: "Sucesso", description: "Status atualizado" }); },
    onError: (error: any) => { toast({ title: "Erro", description: error.message, variant: "destructive" }); },
  });

  const handleEdit = (address: IPAddress) => {
    if (address.dynamic === "true") { toast({ title: "Aviso", description: "Endereços dinâmicos não podem ser editados", variant: "destructive" }); return; }
    setEditingAddress(address); setDialogOpen(true);
  };

  const handleDelete = async (address: IPAddress) => {
    if (address.dynamic === "true") { toast({ title: "Aviso", description: "Endereços dinâmicos não podem ser excluídos", variant: "destructive" }); return; }
    const ok = await confirm({ title: 'Excluir endereço IP', description: `Excluir "${address.address}"?`, variant: 'destructive', icon: 'trash' });
    if (ok) deleteMutation.mutate(address[".id"]);
  };

  const handleToggle = (address: IPAddress) => {
    if (address.dynamic === "true") { toast({ title: "Aviso", description: "Endereços dinâmicos não podem ser desabilitados", variant: "destructive" }); return; }
    toggleMutation.mutate({ id: address[".id"], disabled: address.disabled === "true" });
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredAndSortedAddresses = useMemo(() => {
    let filtered = addresses.filter((a: IPAddress) => {
      const t = filter.toLowerCase();
      return a.address?.toLowerCase().includes(t) || a.interface?.toLowerCase().includes(t) || a.network?.toLowerCase().includes(t) || a.comment?.toLowerCase().includes(t);
    });
    if (sortField) {
      filtered.sort((a: any, b: any) => {
        const c = (a[sortField] || '').toString().localeCompare((b[sortField] || '').toString());
        return sortDirection === 'asc' ? c : -c;
      });
    }
    return filtered;
  }, [addresses, filter, sortField, sortDirection]);

  const totalItems = filteredAndSortedAddresses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAddresses = filteredAndSortedAddresses.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filter, sortField, sortDirection, itemsPerPage]);

  const getStatusBadge = (address: IPAddress) => {
    if (address.invalid === "true") return { label: 'Inválido', cls: 'border-amber-500/30 text-amber-400 bg-amber-500/10' };
    if (address.dynamic === "true") return { label: 'Dinâmico', cls: 'border-primary/30 text-primary bg-primary/10' };
    if (address.disabled === "true") return { label: 'Desabilitado', cls: 'border-destructive/30 text-destructive bg-destructive/10' };
    return { label: 'Ativo', cls: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Endereços IP</h3>
          <p className="text-[10px] text-muted-foreground">{totalItems} endereços</p>
        </div>
        <div className="flex gap-1.5">
          <MikrotikExportActions data={addresses || []} filteredData={filteredAndSortedAddresses}
            columns={[
              { key: 'address', label: 'Endereço' }, { key: 'interface', label: 'Interface' },
              { key: 'network', label: 'Rede' }, { key: 'comment', label: 'Comentário' },
              { key: 'disabled', label: 'Status', formatter: (val) => val === 'true' ? 'Desabilitado' : 'Ativo' },
            ]}
            gridTitle="Endereços IP" getSummary={() => generateAddressesSummary(filteredAndSortedAddresses)}
          />
          <Button onClick={() => { setEditingAddress(null); setDialogOpen(true); }} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo IP
          </Button>
          <Button onClick={() => refetch()} disabled={isLoading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar endereços IP..." />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs h-8 px-3">
                <Button variant="ghost" size="sm" onClick={() => handleSort('address')} className="h-6 px-1 text-[10px] text-muted-foreground">
                  Endereço <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
                </Button>
              </TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Interface</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Rede</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Comentário</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3 w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAddresses.map((address) => {
              const status = getStatusBadge(address);
              return (
                <TableRow key={address[".id"]} className="border-border hover:bg-muted/30 group">
                  <TableCell className="py-1.5 px-3 text-xs font-medium text-foreground">{address.address}</TableCell>
                  <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{address.interface || "-"}</TableCell>
                  <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{address.network || "-"}</TableCell>
                  <TableCell className="py-1.5 px-3">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${status.cls}`}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="py-1.5 px-3 text-[10px] text-muted-foreground">{address.comment || "-"}</TableCell>
                  <TableCell className="py-1.5 px-3">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(address)} disabled={address.dynamic === "true"}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                        {address.disabled === "true" ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(address)} disabled={address.dynamic === "true"}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(address)} disabled={address.dynamic === "true"}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <MikrotikPagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage}
        totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
        onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />

      {isLoading && addresses.length === 0 && (
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <MikrotikAddressDialog open={dialogOpen} onOpenChange={setDialogOpen} address={editingAddress} />
    </div>
  );
};
