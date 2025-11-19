import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.is_active);

  if (clients.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-6 w-6" />
              Nenhum Cliente Configurado
            </CardTitle>
            <CardDescription>
              Você precisa configurar pelo menos um cliente MikroTik para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin')} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeClients.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Nenhum Cliente Ativo</CardTitle>
            <CardDescription>
              Todos os clientes estão inativos. Ative pelo menos um para conectar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin')} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Gerenciar Clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Selecione um Cliente MikroTik</h1>
        <p className="text-muted-foreground">
          Escolha qual dispositivo você deseja gerenciar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Network className="h-8 w-8 text-primary" />
                <Badge variant="secondary">Ativo</Badge>
              </div>
              <CardTitle className="text-xl">{client.name}</CardTitle>
              <CardDescription className="break-all">
                {client.base_url}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => selectClient(client)} 
                className="w-full"
                size="lg"
              >
                Conectar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <Settings className="mr-2 h-4 w-4" />
          Gerenciar Clientes
        </Button>
      </div>
    </div>
  );
};
