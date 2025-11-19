import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Pencil, Trash2, Power, PowerOff, ArrowUpDown, RefreshCw, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MikrotikPPPDialog } from "./MikrotikPPPDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generatePPPSummary } from '@/utils/mikrotikExportFormatters';

interface PPPSecret {
  ".id": string;
  name: string;
  password?: string;
  service?: string;
  "local-address"?: string;
  "remote-address"?: string;
  profile?: string;
  disabled?: string;
  comment?: string;
}

export const MikrotikPPP = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<PPPSecret | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [secretToDelete, setSecretToDelete] = useState<PPPSecret | null>(null);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: secrets = [], isLoading } = useQuery({
    queryKey: ["mikrotik-ppp-secrets"],
    queryFn: async () => {
      const result = await callAPI("/ppp/secret", "GET");
      return Array.isArray(result) ? result : [];
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await callAPI(`/ppp/secret/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mikrotik-ppp-secrets"] });
      toast({
        title: "Sucesso",
        description: "Usuário VPN excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário VPN",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
      await callAPI(`/ppp/secret/${id}`, "PATCH", { disabled: disabled ? "false" : "true" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mikrotik-ppp-secrets"] });
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (secret: PPPSecret) => {
    setEditingSecret(secret);
    setDialogOpen(true);
  };

  const handleDelete = (secret: PPPSecret) => {
    setSecretToDelete(secret);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (secretToDelete) {
      deleteMutation.mutate(secretToDelete[".id"]);
      setDeleteDialogOpen(false);
      setSecretToDelete(null);
    }
  };

  const handleToggle = (secret: PPPSecret) => {
    toggleMutation.mutate({
      id: secret[".id"],
      disabled: secret.disabled === "true",
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedSecrets = useMemo(() => {
    let filtered = secrets.filter((secret: PPPSecret) => {
      const searchTerm = filter.toLowerCase();
      return (
        secret.name?.toLowerCase().includes(searchTerm) ||
        secret.service?.toLowerCase().includes(searchTerm) ||
        secret['local-address']?.toLowerCase().includes(searchTerm) ||
        secret['remote-address']?.toLowerCase().includes(searchTerm) ||
        secret.comment?.toLowerCase().includes(searchTerm)
      );
    });

    if (sortField) {
      filtered.sort((a: any, b: any) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [secrets, filter, sortField, sortDirection]);

  const getServiceBadge = (service?: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pptp: { label: "PPTP", className: "bg-blue-600/80 text-white" },
      l2tp: { label: "L2TP", className: "bg-green-600/80 text-white" },
      sstp: { label: "SSTP", className: "bg-purple-600/80 text-white" },
      pppoe: { label: "PPPoE", className: "bg-orange-600/80 text-white" },
      ovpn: { label: "OpenVPN", className: "bg-cyan-600/80 text-white" },
    };

    const config = service && variants[service] 
      ? variants[service] 
      : { label: service || "N/A", className: "border-slate-600 text-slate-400" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between mb-4">
            <CardTitle>Usuários VPN (PPP Secrets)</CardTitle>
            <div className="flex gap-2">
              <MikrotikExportActions
                data={secrets}
                filteredData={filteredAndSortedSecrets}
                columns={[
                  { key: 'name', label: 'Nome' },
                  { key: 'service', label: 'Serviço' },
                  { key: 'caller-id', label: 'Caller ID' },
                  { key: 'local-address', label: 'IP Local' },
                  { key: 'remote-address', label: 'IP Remoto' },
                  { key: 'profile', label: 'Perfil' },
                  { key: 'comment', label: 'Comentário' },
                  { key: 'disabled', label: 'Status', formatter: (val) => val === 'true' ? '❌ Desabilitado' : '✅ Ativo' }
                ]}
                gridTitle="VPN (PPP)"
                getSummary={() => generatePPPSummary(filteredAndSortedSecrets)}
              />
              <Button onClick={() => { setEditingSecret(null); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["mikrotik-ppp-secrets"] })} disabled={isLoading} variant="outline">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar usuários VPN..." />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filteredAndSortedSecrets.length === 0 && secrets.length > 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado com o filtro aplicado</p>
          ) : secrets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum usuário VPN cadastrado</p>
          ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-slate-700/30">
              <TableHead className="text-slate-300">
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 px-2">
                  Nome
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-300">
                <Button variant="ghost" size="sm" onClick={() => handleSort('service')} className="h-8 px-2">
                  Serviço
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-300">IPs</TableHead>
              <TableHead className="text-slate-300">Perfil</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
              <TableBody>
                {secrets.map((secret) => (
                  <TableRow key={secret[".id"]}>
                    <TableCell className="font-medium">{secret.name}</TableCell>
                    <TableCell>{getServiceBadge(secret.service)}</TableCell>
                    <TableCell>{secret["local-address"] || "-"}</TableCell>
                    <TableCell>{secret["remote-address"] || "-"}</TableCell>
                    <TableCell>{secret.profile || "default"}</TableCell>
                    <TableCell>
                      {secret.disabled === "true" ? (
                        <Badge className="bg-red-600/80 text-white">Inativo</Badge>
                      ) : (
                        <Badge className="bg-green-600/80 text-white">Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleToggle(secret)}
                          disabled={loading}
                          className={secret.disabled === "true" ? "border-green-600/50 text-green-400 hover:bg-green-600/20" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                        >
                          {secret.disabled === "true" ? (
                            <Power className="h-3 w-3" />
                          ) : (
                            <PowerOff className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleEdit(secret)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleDelete(secret)}
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
          )}
        </CardContent>
      </Card>

      <MikrotikPPPDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        secret={editingSecret}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário VPN "{secretToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
