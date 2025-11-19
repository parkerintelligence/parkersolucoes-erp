import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Monitor, Server, Terminal, Search, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { useGuacamoleAPI } from '@/hooks/useGuacamoleAPI';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GLPIRemoteAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
}

export const GLPIRemoteAccessDialog = ({ 
  open, 
  onOpenChange, 
  itemName 
}: GLPIRemoteAccessDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { useConnections, integration, isConfigured } = useGuacamoleAPI();
  const { data: connections, isLoading, error, refetch } = useConnections();

  const getProtocolIcon = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp':
      case 'vnc':
        return <Monitor className="h-4 w-4" />;
      case 'ssh':
        return <Terminal className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp':
        return 'bg-blue-600 text-white';
      case 'vnc':
        return 'bg-purple-600 text-white';
      case 'ssh':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getConnectionStatus = (connection: any) => {
    if (connection.activeConnections > 0) {
      return { label: 'Ativo', color: 'bg-green-600 text-white' };
    }
    return { label: 'Disponível', color: 'bg-blue-600 text-white' };
  };

  const handleConnect = async (connection: any) => {
    if (!integration?.base_url) {
      toast({
        title: "Erro de configuração",
        description: "URL base do Guacamole não configurada.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: sessionData, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: {
          integrationId: integration.id,
          endpoint: `connect/${connection.identifier}`,
          method: 'POST'
        }
      });

      if (error) {
        console.error('Erro na função Edge:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (!sessionData?.result) {
        throw new Error('Resposta inválida do servidor');
      }

      const result = sessionData.result;
      
      if (!result.success || !result.sessionUrl) {
        throw new Error(result.warning || 'URL de sessão não fornecida');
      }

      window.open(result.sessionUrl, '_blank', 'noopener,noreferrer');

      let toastMessage = '';
      let toastDescription = '';
      
      switch (result.method) {
        case 'tunnel':
          toastMessage = 'Conectado com túnel!';
          toastDescription = `Conexão "${connection.name}" aberta com túnel direto. Autenticação automática ativa.`;
          break;
        case 'direct':
          toastMessage = result.hasCredentials ? 'Conectado com credenciais!' : 'Conectando...';
          toastDescription = result.hasCredentials 
            ? `Conexão "${connection.name}" aberta com credenciais incorporadas.`
            : `Conexão "${connection.name}" aberta. Pode ser necessário inserir credenciais.`;
          break;
        case 'fallback':
          toastMessage = 'Conectando (modo básico)';
          toastDescription = `Conexão "${connection.name}" aberta. Autenticação manual pode ser necessária.`;
          break;
        default:
          toastMessage = 'Conectando...';
          toastDescription = `Abrindo conexão "${connection.name}".`;
      }

      toast({
        title: toastMessage,
        description: toastDescription
      });

      if (result.warning) {
        setTimeout(() => {
          toast({
            title: "Atenção",
            description: result.warning,
            variant: "default"
          });
        }, 2000);
      }

      onOpenChange(false);

    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      toast({
        title: "Erro ao conectar",
        description: error.message || "Não foi possível estabelecer a conexão remota.",
        variant: "destructive"
      });
    }
  };

  const filteredConnections = connections?.filter(conn => 
    conn.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.protocol?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!isConfigured) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Acesso Remoto</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <p className="text-gray-300 text-center">
              Configure a integração do Guacamole primeiro
            </p>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/admin';
              }}
            >
              Ir para Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Conexões Remotas Disponíveis</DialogTitle>
          {itemName && (
            <DialogDescription className="text-gray-400">
              Selecione uma conexão remota para acessar: {itemName}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Content area */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-gray-400">Carregando conexões remotas...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <p className="text-red-400 text-center">Erro ao carregar conexões</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Monitor className="h-12 w-12 text-gray-500" />
              <p className="text-gray-400 text-center">
                {searchTerm ? 'Nenhuma conexão encontrada' : 'Nenhuma conexão remota configurada'}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    window.location.href = '/guacamole';
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Ir para Conexão Remota
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConnections.map((connection) => {
                const status = getConnectionStatus(connection);
                return (
                  <Card key={connection.identifier} className="bg-gray-900 border-gray-700 hover:bg-gray-850 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-300">
                            {getProtocolIcon(connection.protocol)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{connection.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getProtocolColor(connection.protocol)}`}>
                              {connection.protocol?.toUpperCase()}
                            </Badge>
                            <Badge className={`text-xs ${status.color}`}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Connect button */}
                        <Button
                          onClick={() => handleConnect(connection)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Conectar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
