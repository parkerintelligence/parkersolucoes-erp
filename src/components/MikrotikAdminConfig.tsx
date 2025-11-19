import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { MikrotikClientsTable } from "./mikrotik/MikrotikClientsTable";
import { MikrotikClientDialog } from "./mikrotik/MikrotikClientDialog";
import { useMikrotikContext } from "@/contexts/MikrotikContext";

export const MikrotikAdminConfig = () => {
  const { clients, loading, refreshClients } = useMikrotikContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingClient(null);
    }
    setDialogOpen(open);
  };

  const handleSuccess = () => {
    refreshClients();
    setEditingClient(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gerenciar Clientes MikroTik</CardTitle>
            <CardDescription>
              Cadastre e gerencie múltiplos dispositivos MikroTik
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={refreshClients}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MikrotikClientsTable
          clients={clients}
          onEdit={handleEdit}
          onRefresh={refreshClients}
        />
      </CardContent>

      <MikrotikClientDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        client={editingClient}
        onSuccess={handleSuccess}
      />
    </Card>
  );
};
