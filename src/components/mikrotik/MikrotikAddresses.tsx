import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { MikrotikAddressDialog } from "./MikrotikAddressDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface IPAddress {
  ".id": string;
  address: string;
  interface?: string;
  network?: string;
  disabled?: string;
  dynamic?: string;
  invalid?: string;
  comment?: string;
}

export const MikrotikAddresses = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IPAddress | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<IPAddress | null>(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["mikrotik-ip-addresses"],
    queryFn: async () => {
      const result = await callAPI("/ip/address", "GET");
      return Array.isArray(result) ? result : [];
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await callAPI(`/ip/address/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mikrotik-ip-addresses"] });
      toast({
        title: "Sucesso",
        description: "Endereço IP excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir endereço IP",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
      await callAPI(`/ip/address/${id}`, "PATCH", { disabled: disabled ? "false" : "true" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mikrotik-ip-addresses"] });
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

  const handleEdit = (address: IPAddress) => {
    if (address.dynamic === "true") {
      toast({
        title: "Aviso",
        description: "Endereços dinâmicos não podem ser editados",
        variant: "destructive",
      });
      return;
    }
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleDelete = (address: IPAddress) => {
    if (address.dynamic === "true") {
      toast({
        title: "Aviso",
        description: "Endereços dinâmicos não podem ser excluídos",
        variant: "destructive",
      });
      return;
    }
    setAddressToDelete(address);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (addressToDelete) {
      deleteMutation.mutate(addressToDelete[".id"]);
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleToggle = (address: IPAddress) => {
    if (address.dynamic === "true") {
      toast({
        title: "Aviso",
        description: "Endereços dinâmicos não podem ser desabilitados",
        variant: "destructive",
      });
      return;
    }
    toggleMutation.mutate({
      id: address[".id"],
      disabled: address.disabled === "true",
    });
  };

  const getStatusBadge = (address: IPAddress) => {
    if (address.invalid === "true") {
      return <Badge variant="destructive">Inválido</Badge>;
    }
    if (address.dynamic === "true") {
      return <Badge className="bg-blue-500 text-white">Dinâmico</Badge>;
    }
    if (address.disabled === "true") {
      return <Badge variant="secondary">Desabilitado</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Endereços IP</CardTitle>
          <Button onClick={() => { setEditingAddress(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo IP
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : addresses.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum endereço IP cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Interface</TableHead>
                  <TableHead>Rede</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address) => (
                  <TableRow key={address[".id"]}>
                    <TableCell className="font-medium">{address.address}</TableCell>
                    <TableCell>{address.interface || "-"}</TableCell>
                    <TableCell>{address.network || "-"}</TableCell>
                    <TableCell>{getStatusBadge(address)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{address.comment || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggle(address)}
                          disabled={loading || address.dynamic === "true"}
                        >
                          {address.disabled === "true" ? (
                            <Power className="h-4 w-4" />
                          ) : (
                            <PowerOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(address)}
                          disabled={address.dynamic === "true"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(address)}
                          disabled={address.dynamic === "true"}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <MikrotikAddressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        address={editingAddress}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o endereço IP "{addressToDelete?.address}"? Esta ação não pode ser desfeita.
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
