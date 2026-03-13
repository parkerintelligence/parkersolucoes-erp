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
  console.log(`[Evolution] Calling proxy: ${method} ${endpoint}`);

  const { data, error } = await supabase.functions.invoke('evolution-proxy', {
    body: { integrationId, endpoint, method, body }
  });

  if (error) {
    const response = (error as any)?.context;
    let details = '';

    try {
      if (response && typeof response.text === 'function') {
        details = await response.text();
      }
    } catch {
      // noop
    }

    let parsedMessage = '';
    if (details) {
      try {
        const parsed = JSON.parse(details);
        const responseMessage = parsed?.response?.message;
        parsedMessage = Array.isArray(responseMessage)
          ? responseMessage.join(', ')
          : responseMessage || parsed?.message || parsed?.error || '';
      } catch {
        // noop
      }
    }

    throw new Error(parsedMessage || details || (error as any)?.message || 'Erro ao chamar Evolution API');
  }

  console.log(`[Evolution] Response:`, data);
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
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

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
        status: inst.instance?.connectionStatus || inst.instance?.status || inst.connectionStatus || inst.status || 'unknown',
        owner: inst.instance?.owner || inst.owner || inst.ownerJid,
        profileName: inst.instance?.profileName || inst.profileName,
        profilePictureUrl: inst.instance?.profilePictureUrl || inst.profilePictureUrl || inst.profilePicUrl,
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

  // Auto-refresh QR Code every 10s while disconnected
  useEffect(() => {
    if (!autoRefreshEnabled || !activeInstanceName || !integrationId) return;

    const interval = setInterval(async () => {
      try {
        const result = await callEvolutionProxy(integrationId, `/instance/connect/${encodeURIComponent(activeInstanceName)}`);
        const state = result?.instance?.state || result?.state;
        
        if (state === 'open') {
          setAutoRefreshEnabled(false);
          setQrCode(null);
          toast({ title: '✅ Conectado!', description: `A instância "${activeInstanceName}" foi conectada com sucesso.` });
          await fetchInstances();
          return;
        }

        const qr = extractQrCode(result);
        if (qr) {
          setQrCode(qr);
        }
      } catch (error) {
        console.error('[Evolution] Auto-refresh QR failed:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, activeInstanceName, integrationId, fetchInstances]);

  const sanitizeInstanceName = (value: string) => {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const normalizeQrImage = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 50) return null;

    if (trimmed.startsWith('data:image/')) {
      return trimmed;
    }

    // PNG base64 geralmente começa com iVBOR
    if (trimmed.startsWith('iVBOR')) {
      return `data:image/png;base64,${trimmed}`;
    }

    return null;
  };

  const extractQrCode = (data: any): string | null => {
    if (!data || typeof data !== 'object') return null;

    const candidates = [
      data?.base64,
      data?.qrcode,
      data?.qrcode?.base64,
      data?.data?.base64,
      data?.data?.qrcode?.base64,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeQrImage(candidate);
      if (normalized) return normalized;
    }

    return null;
  };

  const fetchQrCodeForInstance = async (name: string, retries = 6, delayMs = 2500): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await callEvolutionProxy(integrationId, `/instance/connect/${encodeURIComponent(name)}`);
        console.log(`[Evolution] Connect "${name}" attempt ${attempt}/${retries}:`, result);

        const qr = extractQrCode(result);
        if (qr) {
          setQrCode(qr);
          setActiveInstanceName(name);
          return true;
        }

        const state = result?.instance?.state || result?.state;
        if (state === 'open') {
          toast({ title: 'Já conectado', description: `A instância "${name}" já está conectada.` });
          await fetchInstances();
          return false;
        }
      } catch (error) {
        console.error(`[Evolution] Connect attempt ${attempt} failed:`, error);
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return false;
  };

  const handleCreateInstance = async () => {
    const rawName = instanceName.trim();

    if (!rawName) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome da instância.', variant: 'destructive' });
      return;
    }

    if (!integrationId) {
      toast({ title: 'Configuração ausente', description: 'Configure a Evolution API no painel de Administração primeiro.', variant: 'destructive' });
      return;
    }

    const createdName = sanitizeInstanceName(rawName);

    if (!createdName) {
      toast({
        title: 'Nome inválido',
        description: 'Use pelo menos letras ou números no nome da instância.',
        variant: 'destructive',
      });
      return;
    }

    if (createdName !== rawName) {
      toast({
        title: 'Nome ajustado automaticamente',
        description: `Criando a instância como "${createdName}" para compatibilidade com a Evolution API.`,
      });
    }

    setLoading(true);
    setQrCode(null);

    try {
      const result = await callEvolutionProxy(integrationId, '/instance/create', 'POST', {
        instanceName: createdName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      console.log('[Evolution] Create response:', result);

      const qr = extractQrCode(result);
      if (qr) {
        setQrCode(qr);
        setActiveInstanceName(createdName);
        setInstanceName('');
        toast({ title: '✅ QR Code gerado', description: `Escaneie o QR Code para conectar "${createdName}".` });
        await fetchInstances();
        return;
      }

      toast({ title: 'Instância criada', description: 'Gerando QR Code...' });
      const qrGenerated = await fetchQrCodeForInstance(createdName, 8, 2500);

      if (qrGenerated) {
        setInstanceName('');
        toast({ title: '✅ QR Code gerado', description: `Escaneie o QR Code para conectar "${createdName}".` });
      } else {
        toast({
          title: 'QR Code indisponível',
          description: 'A instância foi criada, mas o QR não foi retornado. Clique em "Conectar" na lista abaixo.',
          variant: 'destructive',
        });
      }

      await fetchInstances();
    } catch (error: any) {
      const message = String(error?.message || '');
      const alreadyExists = /already in use|já está em uso|em uso/i.test(message);

      if (alreadyExists) {
        toast({ title: 'Instância já existe', description: 'Vou tentar gerar o QR dessa instância existente...' });
        const qrGenerated = await fetchQrCodeForInstance(createdName, 8, 2500);

        if (qrGenerated) {
          setInstanceName('');
          toast({ title: '✅ QR Code gerado', description: `Escaneie o QR Code para conectar "${createdName}".` });
          await fetchInstances();
          return;
        }
      }

      console.error('[Evolution] Create error:', error);
      toast({ title: 'Erro ao criar instância', description: message || 'Falha inesperada ao criar instância.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetQrCode = async (name: string) => {
    setLoadingAction(name);
    try {
      const qrGenerated = await fetchQrCodeForInstance(name, 6, 2000);

      if (qrGenerated) {
        toast({ title: '✅ QR Code gerado', description: `Escaneie o QR Code para conectar "${name}".` });
      } else {
        toast({
          title: 'QR Code indisponível',
          description: 'Não foi possível gerar o QR Code agora. Tente novamente em alguns segundos.',
          variant: 'destructive',
        });
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
      const encodedName = encodeURIComponent(name);
      const result = await callEvolutionProxy(integrationId, `/instance/connectionState/${encodedName}`);
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
      const encodedName = encodeURIComponent(name);
      await callEvolutionProxy(integrationId, `/instance/logout/${encodedName}`, 'DELETE');
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
      const encodedName = encodeURIComponent(name);
      await callEvolutionProxy(integrationId, `/instance/delete/${encodedName}`, 'DELETE');
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
                Pode usar nome livre; o sistema converte automaticamente para o formato da Evolution API
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
