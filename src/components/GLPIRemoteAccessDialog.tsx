import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Server, Terminal, Search, AlertTriangle, Loader2, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';
import { useGuacamoleAPI } from '@/hooks/useGuacamoleAPI';
import { useRustDeskConnections } from '@/hooks/useRustDesk';
import { useCompanies } from '@/hooks/useCompanies';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GLPIRemoteAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  entityName?: string;
}

export const GLPIRemoteAccessDialog = ({ 
  open, 
  onOpenChange, 
  itemName,
  entityName 
}: GLPIRemoteAccessDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { useConnections, useConnectionGroups, integration, isConfigured } = useGuacamoleAPI();
  const { data: connections, isLoading, error, refetch } = useConnections();
  const { data: groups } = useConnectionGroups();
  const { data: rustdeskConnections = [], isLoading: rustdeskLoading } = useRustDeskConnections();
  const { data: companies = [] } = useCompanies();

  useEffect(() => {
    if (open && entityName && groups) {
      const matchingGroup = groups.find(g => 
        g.name.toLowerCase().includes(entityName.toLowerCase()) ||
        entityName.toLowerCase().includes(g.name.toLowerCase())
      );
      if (matchingGroup) {
        setSelectedGroup(matchingGroup.identifier);
      } else {
        setSelectedGroup('all');
      }
    }
  }, [open, entityName, groups]);

  const getProtocolIcon = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp':
      case 'vnc':
        return <Monitor className="h-3.5 w-3.5" />;
      case 'ssh':
        return <Terminal className="h-3.5 w-3.5" />;
      default:
        return <Server className="h-3.5 w-3.5" />;
    }
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'rdp': return 'bg-blue-600 text-white';
      case 'vnc': return 'bg-purple-600 text-white';
      case 'ssh': return 'bg-green-600 text-white';
      default: return 'bg-muted text-muted-foreground';
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
      toast({ title: "Erro", description: "URL base do Guacamole não configurada.", variant: "destructive" });
      return;
    }
    try {
      const { data: sessionData, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: { integrationId: integration.id, endpoint: `connect/${connection.identifier}`, method: 'POST' }
      });
      if (error) throw new Error(error.message);
      if (!sessionData?.result?.success || !sessionData?.result?.sessionUrl) {
        throw new Error(sessionData?.result?.warning || 'URL de sessão não fornecida');
      }
      window.open(sessionData.result.sessionUrl, '_blank', 'noopener,noreferrer');
      toast({ title: 'Conectando...', description: `Abrindo conexão "${connection.name}".` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao conectar", description: error.message, variant: "destructive" });
    }
  };

  const handleRustDeskConnect = (conn: any) => {
    const url = `rustdesk://connection/new/${conn.rustdesk_id}`;
    if (conn.password) {
      navigator.clipboard.writeText(conn.password);
      toast({ title: 'Senha copiada!', description: `Conectando a "${conn.name}" via RustDesk. Senha copiada para a área de transferência.` });
    } else {
      toast({ title: 'Conectando...', description: `Abrindo "${conn.name}" via RustDesk.` });
    }
    window.open(url, '_blank');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: `${label} copiado para a área de transferência.` });
  };

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return null;
    return companies.find(c => c.id === companyId)?.name || null;
  };

  const filteredGuacamole = connections?.filter(conn => {
    const matchesSearch = conn.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.protocol?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || conn.parentIdentifier === selectedGroup;
    return matchesSearch && matchesGroup;
  }) || [];

  const filteredRustDesk = rustdeskConnections.filter(conn => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return conn.name.toLowerCase().includes(s) ||
      conn.rustdesk_id.toLowerCase().includes(s) ||
      conn.alias?.toLowerCase().includes(s) ||
      conn.hostname?.toLowerCase().includes(s);
  });

  const hasGuacamole = isConfigured;
  const hasRustDesk = rustdeskConnections.length > 0 || rustdeskLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[75vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base">Conexões Remotas</DialogTitle>
          {itemName && (
            <DialogDescription className="text-muted-foreground text-xs">
              Acesso remoto para: {itemName}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar conexão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs bg-background border-border"
          />
        </div>

        <Tabs defaultValue={hasRustDesk ? "rustdesk" : "guacamole"} className="w-full">
          <TabsList className="w-full bg-muted/30 h-8">
            <TabsTrigger value="rustdesk" className="flex-1 text-xs h-7 gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              RustDesk ({filteredRustDesk.length})
            </TabsTrigger>
            {hasGuacamole && (
              <TabsTrigger value="guacamole" className="flex-1 text-xs h-7 gap-1.5">
                <Server className="h-3.5 w-3.5" />
                Guacamole ({filteredGuacamole.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* RustDesk Tab */}
          <TabsContent value="rustdesk" className="mt-2">
            <ScrollArea className="h-[380px] pr-2">
              {rustdeskLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-muted-foreground text-xs mt-2">Carregando...</p>
                </div>
              ) : filteredRustDesk.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Monitor className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-xs mt-2">
                    {searchTerm ? 'Nenhuma conexão encontrada' : 'Nenhuma conexão RustDesk cadastrada'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredRustDesk.map((conn) => {
                    const companyName = getCompanyName(conn.company_id);
                    const showPw = showPasswords[conn.id];
                    return (
                      <Card key={conn.id} className="bg-background border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className="w-8 h-8 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                              <Monitor className="h-4 w-4 text-orange-500" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold text-foreground truncate">{conn.name}</h4>
                                {conn.alias && (
                                  <span className="text-[10px] text-muted-foreground truncate">({conn.alias})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono border-orange-500/30 text-orange-400">
                                  ID: {conn.rustdesk_id}
                                </Badge>
                                {companyName && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Server className="h-2.5 w-2.5" /> {companyName}
                                  </span>
                                )}
                                {conn.hostname && (
                                  <span className="text-[10px] text-muted-foreground">{conn.hostname}</span>
                                )}
                                {conn.glpi_asset_name && (
                                  <span className="text-[10px] text-blue-400">GLPI: {conn.glpi_asset_name}</span>
                                )}
                              </div>
                              {/* Password row */}
                              {conn.password && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">Senha:</span>
                                  <code className="text-[10px] font-mono bg-muted/50 px-1 rounded text-foreground">
                                    {showPw ? conn.password : '••••••'}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0"
                                    onClick={() => setShowPasswords(p => ({ ...p, [conn.id]: !p[conn.id] }))}
                                  >
                                    {showPw ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0"
                                    onClick={() => copyToClipboard(conn.password!, 'Senha')}
                                  >
                                    <Copy className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(conn.rustdesk_id, 'ID')}
                                title="Copiar ID"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleRustDeskConnect(conn)}
                                size="sm"
                                className="h-7 text-[11px] bg-orange-600 hover:bg-orange-700 text-white px-2.5"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Conectar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Guacamole Tab */}
          {hasGuacamole && (
            <TabsContent value="guacamole" className="mt-2">
              {/* Group filter */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-muted-foreground">Grupo:</span>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="flex-1 h-7 text-xs bg-background border-border">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="all" className="text-xs">Todos os grupos</SelectItem>
                    {groups?.map((group) => (
                      <SelectItem key={group.identifier} value={group.identifier} className="text-xs">
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[340px] pr-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground text-xs mt-2">Carregando...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-destructive text-xs">Erro ao carregar conexões</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
                      Tentar Novamente
                    </Button>
                  </div>
                ) : filteredGuacamole.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Monitor className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-xs mt-2">
                      {searchTerm ? 'Nenhuma conexão encontrada' : 'Nenhuma conexão configurada'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredGuacamole.map((connection) => {
                      const status = getConnectionStatus(connection);
                      return (
                        <Card key={connection.identifier} className="bg-background border-border/50 hover:border-primary/30 transition-colors">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center flex-shrink-0 text-muted-foreground">
                                {getProtocolIcon(connection.protocol)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-foreground truncate">{connection.name}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge className={`text-[10px] px-1.5 py-0 ${getProtocolColor(connection.protocol)}`}>
                                    {connection.protocol?.toUpperCase()}
                                  </Badge>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${status.color}`}>
                                    {status.label}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleConnect(connection)}
                                size="sm"
                                className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
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
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
