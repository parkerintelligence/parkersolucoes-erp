import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Pencil, Trash2, Power, PowerOff, ArrowUpDown, RefreshCw } from "lucide-react";
import { MikrotikPPPDialog } from "./MikrotikPPPDialog";
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generatePPPSummary } from '@/utils/mikrotikExportFormatters';
import { MikrotikPagination } from './MikrotikPagination';

interface PPPSecret {
  ".id": string; name: string; password?: string; service?: string;
  "local-address"?: string; "remote-address"?: string; profile?: string; disabled?: string; comment?: string;
}

export const MikrotikPPP = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<PPPSecret | null>(null);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: secrets = [], isLoading } = useQuery({
    queryKey: ["mikrotik-ppp-secrets"],
    queryFn: async () => { const r = await callAPI("/ppp/secret", "GET"); return Array.isArray(r) ? r : []; },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await callAPI(`/ppp/secret/${id}`, "DELETE"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mikrotik-ppp-secrets"] }); toast({ title: "Sucesso", description: "Usuário VPN excluído" }); },
    onError: (error: any) => { toast({ title: "Erro", description: error.message, variant: "destructive" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
      await callAPI(`/ppp/secret/${id}`, "PATCH", { disabled: disabled ? "false" : "true" });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mikrotik-ppp-secrets"] }); toast({ title: "Sucesso", description: "Status atualizado" }); },
    onError: (error: any) => { toast({ title: "Erro", description: error.message, variant: "destructive" }); },
  });

  const handleDelete = async (secret: PPPSecret) => {
    const ok = await confirm({ title: 'Excluir usuário VPN', description: `Excluir "${secret.name}"? Esta ação não pode ser desfeita.`, variant: 'destructive', icon: 'trash' });
    if (ok) deleteMutation.mutate(secret[".id"]);
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredAndSortedSecrets = useMemo(() => {
    let filtered = secrets.filter((s: PPPSecret) => {
      const t = filter.toLowerCase();
      return s.name?.toLowerCase().includes(t) || s.service?.toLowerCase().includes(t) || s.comment?.toLowerCase().includes(t);
    });
    if (sortField) {
      filtered.sort((a: any, b: any) => {
        const c = (a[sortField] || '').toString().localeCompare((b[sortField] || '').toString());
        return sortDirection === 'asc' ? c : -c;
      });
    }
    return filtered;
  }, [secrets, filter, sortField, sortDirection]);

  const totalItems = filteredAndSortedSecrets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSecrets = filteredAndSortedSecrets.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filter, sortField, sortDirection, itemsPerPage]);

  const getServiceColor = (service?: string) => {
    const map: Record<string, string> = {
      pptp: 'border-primary/30 text-primary bg-primary/10',
      l2tp: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      sstp: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      pppoe: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      ovpn: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    };
    return map[service || ''] || 'border-border text-muted-foreground';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Usuários VPN (PPP)</h3>
          <p className="text-[10px] text-muted-foreground">{totalItems} usuários</p>
        </div>
        <div className="flex gap-1.5">
          <MikrotikExportActions data={secrets} filteredData={filteredAndSortedSecrets}
            columns={[
              { key: 'name', label: 'Nome' }, { key: 'service', label: 'Serviço' },
              { key: 'local-address', label: 'IP Local' }, { key: 'remote-address', label: 'IP Remoto' },
              { key: 'profile', label: 'Perfil' },
              { key: 'disabled', label: 'Status', formatter: (val) => val === 'true' ? 'Inativo' : 'Ativo' },
            ]}
            gridTitle="VPN (PPP)" getSummary={() => generatePPPSummary(filteredAndSortedSecrets)}
          />
          <Button onClick={() => { setEditingSecret(null); setDialogOpen(true); }} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo Usuário
          </Button>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["mikrotik-ppp-secrets"] })} disabled={isLoading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar usuários VPN..." />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {[{ key: 'name', label: 'Nome' }, { key: 'service', label: 'Serviço' }].map(col => (
                <TableHead key={col.key} className="text-muted-foreground text-xs h-8 px-3">
                  <Button variant="ghost" size="sm" onClick={() => handleSort(col.key)} className="h-6 px-1 text-[10px] text-muted-foreground">
                    {col.label} <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-muted-foreground text-xs h-8 px-3">IP Local</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">IP Remoto</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Perfil</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3 w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSecrets.map((secret) => (
              <TableRow key={secret[".id"]} className="border-border hover:bg-muted/30 group">
                <TableCell className="py-1.5 px-3 text-xs font-medium text-foreground">{secret.name}</TableCell>
                <TableCell className="py-1.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getServiceColor(secret.service)}`}>
                    {(secret.service || 'N/A').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{secret["local-address"] || "-"}</TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{secret["remote-address"] || "-"}</TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{secret.profile || "default"}</TableCell>
                <TableCell className="py-1.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                    secret.disabled === "true" ? 'border-destructive/30 text-destructive bg-destructive/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  }`}>{secret.disabled === "true" ? 'Inativo' : 'Ativo'}</Badge>
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate({ id: secret[".id"], disabled: secret.disabled === "true" })}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                      {secret.disabled === "true" ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingSecret(secret); setDialogOpen(true); }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(secret)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
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

      {isLoading && secrets.length === 0 && (
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <MikrotikPPPDialog open={dialogOpen} onOpenChange={setDialogOpen} secret={editingSecret} />
    </div>
  );
};
