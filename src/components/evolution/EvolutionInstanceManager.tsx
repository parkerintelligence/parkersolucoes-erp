import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Plus, QrCode, RefreshCw, Wifi, LogOut, Trash2, Loader2 } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InstanceInfo {
  instanceName: string;
  instanceId?: string;
  status?: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  createdAt?: string;
}

const callEvolutionProxy = async (integrationId: string, endpoint: string, method = 'GET', body?: any) => {
  const { data, error } = await supabase.functions.invoke('evolution-proxy', {
    body: { integrationId, endpoint, method, body }
  });
  if (error) throw error;
  return data;
};

interface EvolutionInstanceManagerProps {
  onInstancesChange?: (instances: InstanceInfo[]) => void;
}

export const EvolutionInstanceManager = ({ onInstancesChange }: EvolutionInstanceManagerProps = {}) => {
  const { data: integrations } = useIntegrations();
  const evolutionConfig = integrations?.find(i => i.type === 'evolution_api');

  const [instanceName, setInstanceName] = useState('');
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [activeInstanceName, setActiveInstanceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loadingInstances, setLoadingInstances] = useState(false);

  const integrationId = evolutionConfig?.id || '';

  const fetchInstances = useCallback(async () => {
    if (!integrationId) return;
    setLoadingInstances(true);
    try {
      const data = await callEvolutionProxy(integrationId, '/instance/fetchInstances');
      const list = Array.isArray(data) ? data : [];
      const mapped: InstanceInfo[] = list.map((inst: any) => ({
        instanceName: inst.instance?.instanceName || inst.instanceName || inst.name || 'Sem nome',
        instanceId: inst.instance?.instanceId || inst.id,
        status: inst.instance?.status || inst.status || 'unknown',
        owner: inst.instance?.owner || inst.owner,
        profileName: inst.instance?.profileName || inst.profileName,
        profilePictureUrl: inst.instance?.profilePictureUrl || inst.profilePictureUrl,
        createdAt: inst.instance?.createdAt || inst.createdAt,
      }));
      setInstances(mapped);
      onInstancesChange?.(mapped);
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    } finally {
      setLoadingInstances(false);
    }
  }, [integrationId]);

  useEffect(() => {
    if (integrationId) {
      fetchInstances();
    }
  }, [integrationId, fetchInstances]);

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome da instância.', variant: 'destructive' });
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(instanceName)) {
      toast({ title: 'Nome inválido', description: 'Use apenas letras, números e hífens (sem espaços).', variant: 'destructive' });
      return;
    }

    if (!integrationId) {
      toast({ title: 'Configuração ausente', description: 'Configure a Evolution API no painel de Administração primeiro.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setQrCode(null);
    try {
      const result = await callEvolutionProxy(integrationId, '/instance/create', 'POST', {
        instanceName,
        qrcode: true,
        markMessagesRead: false,
        delayMessage: 1000,
        integration: 'WHATSAPP-BAILEYS'
      });

      const qr = result?.qrcode?.base64 || result?.qrcode;
      if (qr) {
        toast({ title: '✅ Instância criada!', description: `Instância "${instanceName}" criada com sucesso.` });
        setQrCode(qr);
        setActiveInstanceName(instanceName);
        setInstanceName('');
        await fetchInstances();
      } else if (result?.instance) {
        toast({ title: '✅ Instância criada!', description: `Instância "${instanceName}" criada. Clique em Conectar para gerar o QR Code.` });
        setInstanceName('');
        await fetchInstances();
      } else {
        toast({ title: 'Erro ao criar instância', description: JSON.stringify(result), variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetQrCode = async (name: string) => {
    setLoadingAction(name);
    try {
      const result = await callEvolutionProxy(integrationId, `/instance/connect/${name}`);
      const qr = result?.base64 || result?.qrcode?.base64 || result?.qrcode;
      if (qr) {
        setQrCode(qr);
        setActiveInstanceName(name);
      } else {
        toast({ title: 'QR Code indisponível', description: 'Instância pode já estar conectada.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCheckStatus = async (name: string) => {
    setLoadingAction(`status-${name}`);
    try {
      const result = await callEvolutionProxy(integrationId, `/instance/connectionState/${name}`);
      const state = result?.instance?.state || result?.state || 'unknown';
      const stateMap: Record<string, string> = {
        open: 'Conectado',
        close: 'Desconectado',
        connecting: 'Conectando...',
      };
      toast({ title: `Status: ${stateMap[state] || state}`, description: `Instância "${name}"` });
      await fetchInstances();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogout = async (name: string) => {
    setLoadingAction(`logout-${name}`);
    try {
      await callEvolutionProxy(integrationId, `/instance/logout/${name}`, 'DELETE');
      toast({ title: '✅ Desconectado', description: `Instância "${name}" desconectada.` });
      await fetchInstances();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a instância "${name}"?`)) return;
    setLoadingAction(`delete-${name}`);
    try {
      await callEvolutionProxy(integrationId, `/instance/delete/${name}`, 'DELETE');
      toast({ title: '✅ Excluída', description: `Instância "${name}" excluída.` });
      if (activeInstanceName === name) {
        setQrCode(null);
        setActiveInstanceName(null);
      }
      await fetchInstances();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSetActive = (name: string) => {
    setActiveInstanceName(name);
    toast({ title: '✅ Ativa para envio', description: `Instância "${name}" definida como ativa.` });
  };

  const getStatusColor = (status?: string) => {
    if (status === 'open') return 'bg-green-500';
    if (status === 'close') return 'bg-red-400';
    if (status === 'connecting') return 'bg-yellow-400';
    return 'bg-muted-foreground/40';
  };

  const getStatusLabel = (status?: string) => {
    if (status === 'open') return 'Conectado';
    if (status === 'close') return 'Não conectado';
    if (status === 'connecting') return 'Conectando...';
    return 'Desconhecido';
  };

  if (!evolutionConfig) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">Evolution API não configurada.</p>
          <p className="text-sm text-muted-foreground">Configure a Evolution API no painel de Administração primeiro.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              Nova Instância
            </CardTitle>
            <CardDescription>Crie uma instância e escaneie o QR Code para conectar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instance-name" className="font-semibold">Nome da Instância</Label>
              <Input
                id="instance-name"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ex: empresa-principal"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use apenas letras, números e hífens (sem espaços)
              </p>
            </div>
            <Button
              onClick={handleCreateInstance}
              disabled={loading || !instanceName.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</>
              ) : (
                <><QrCode className="mr-2 h-4 w-4" />Criar e Gerar QR Code</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[200px]">
            {qrCode ? (
              <div className="text-center space-y-2">
                <img
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="mx-auto max-w-[250px] rounded-lg border"
                />
                <p className="text-sm text-muted-foreground">
                  Escaneie com o WhatsApp: <strong>{activeInstanceName}</strong>
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum QR Code ativo</p>
                <p className="text-sm">Crie uma instância para gerar o QR Code</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Instâncias Cadastradas
            </CardTitle>
            <CardDescription>
              {instances.length} instância(s) — selecione a ativa para envio de mensagens
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInstances} disabled={loadingInstances}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingInstances ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhuma instância cadastrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((inst) => (
                <div
                  key={inst.instanceName}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    activeInstanceName === inst.instanceName ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(inst.status)}`} />
                    <div>
                      <p className="font-semibold">{inst.instanceName}</p>
                      <p className="text-sm text-muted-foreground">{getStatusLabel(inst.status)}</p>
                      {inst.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Conectado em: {new Date(inst.createdAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeInstanceName === inst.instanceName ? (
                      <Badge className="bg-green-600 text-white">✓ Ativa para envio</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleSetActive(inst.instanceName)}>
                        Ativar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCheckStatus(inst.instanceName)}
                      disabled={loadingAction === `status-${inst.instanceName}`}
                    >
                      {loadingAction === `status-${inst.instanceName}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Wifi className="mr-1 h-4 w-4" />Status</>
                      )}
                    </Button>
                    {inst.status !== 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGetQrCode(inst.instanceName)}
                        disabled={loadingAction === inst.instanceName}
                      >
                        {loadingAction === inst.instanceName ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><QrCode className="mr-1 h-4 w-4" />Conectar</>
                        )}
                      </Button>
                    )}
                    {inst.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLogout(inst.instanceName)}
                        disabled={loadingAction === `logout-${inst.instanceName}`}
                      >
                        {loadingAction === `logout-${inst.instanceName}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><LogOut className="mr-1 h-4 w-4" />Desconectar</>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(inst.instanceName)}
                      disabled={loadingAction === `delete-${inst.instanceName}`}
                    >
                      {loadingAction === `delete-${inst.instanceName}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
