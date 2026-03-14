import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Loader2, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMikrotikContext } from "@/contexts/MikrotikContext";

export const MikrotikClientSelector = () => {
  const { clients, loading, selectClient } = useMikrotikContext();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando dispositivos...</p>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.is_active);

  if (clients.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed border-2 border-border bg-card/50 max-w-md mx-auto mt-8">
        <CardContent className="flex flex-col items-center p-0">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Network className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum Cliente Configurado</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Configure um cliente MikroTik para começar
          </p>
          <Button onClick={() => navigate('/admin')} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Settings className="mr-2 h-3.5 w-3.5" />
            Configurar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (activeClients.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed border-2 border-border bg-card/50 max-w-md mx-auto mt-8">
        <CardContent className="flex flex-col items-center p-0">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Network className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum Cliente Ativo</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Ative pelo menos um cliente para conectar
          </p>
          <Button onClick={() => navigate('/admin')} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Settings className="mr-2 h-3.5 w-3.5" />
            Gerenciar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Selecione um Cliente
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Escolha o dispositivo MikroTik para gerenciar
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {activeClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Network className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground text-sm">{client.name}</h3>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {client.base_url}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => selectClient(client)}
                  size="sm"
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 ml-3 flex-shrink-0"
                >
                  Conectar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/admin')}
          className="h-8 text-xs"
        >
          <Settings className="mr-1.5 h-3.5 w-3.5" />
          Gerenciar Clientes
        </Button>
      </div>
    </div>
  );
};
