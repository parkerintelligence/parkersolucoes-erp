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
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.is_active);

  if (clients.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <Network className="h-10 w-10 mx-auto mb-3 text-blue-400" />
            <h3 className="text-base font-semibold mb-2 text-white">Nenhum Cliente Configurado</h3>
            <p className="text-slate-400 text-sm mb-4">
              Configure um cliente MikroTik para começar
            </p>
            <Button onClick={() => navigate('/admin')} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Settings className="mr-2 h-3 w-3" />
              Configurar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeClients.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <Network className="h-10 w-10 mx-auto mb-3 text-amber-400" />
            <h3 className="text-base font-semibold mb-2 text-white">Nenhum Cliente Ativo</h3>
            <p className="text-slate-400 text-sm mb-4">
              Ative pelo menos um cliente para conectar
            </p>
            <Button onClick={() => navigate('/admin')} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Settings className="mr-2 h-3 w-3" />
              Gerenciar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-400" />
          Selecione um Cliente
        </h2>
        <p className="text-slate-400 text-sm">
          Escolha o dispositivo MikroTik para gerenciar
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {activeClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Network className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white text-sm">{client.name}</h3>
                      <Badge variant="secondary" className="text-xs bg-green-900/30 text-green-400 border-green-700/30">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {client.base_url}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => selectClient(client)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white ml-3 flex-shrink-0"
                >
                  Conectar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/admin')}
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <Settings className="mr-2 h-3 w-3" />
          Gerenciar Clientes
        </Button>
      </div>
    </div>
  );
};
