import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, TestTube, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MikrotikConnectionTest } from "@/components/MikrotikConnectionTest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MikrotikClientsTableProps {
  clients: any[];
  onEdit: (client: any) => void;
  onRefresh: () => void;
}

export const MikrotikClientsTable = ({ clients, onEdit, onRefresh }: MikrotikClientsTableProps) => {
  const { toast } = useToast();
  const [testingClient, setTestingClient] = useState<any>(null);
  const [deleteClient, setDeleteClient] = useState<any>(null);

  const handleToggleActive = async (client: any) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ is_active: !client.is_active })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Cliente ${!client.is_active ? 'ativado' : 'desativado'} com sucesso`,
      });

      onRefresh();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do cliente',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteClient) return;

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', deleteClient.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cliente excluído com sucesso',
      });

      onRefresh();
      setDeleteClient(null);
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cliente',
        variant: 'destructive',
      });
    }
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum cliente cadastrado
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell className="text-sm">{client.base_url}</TableCell>
              <TableCell>{client.username}</TableCell>
              <TableCell>
                {client.is_active ? (
                  <Badge variant="default">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(client)}
                    title={client.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {client.is_active ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTestingClient(client)}
                    title="Testar Conexão"
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(client)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteClient(client)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {testingClient && (
        <div className="mt-4">
          <MikrotikConnectionTest />
          <Button
            variant="outline"
            onClick={() => setTestingClient(null)}
            className="mt-2"
          >
            Fechar Teste
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{deleteClient?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
