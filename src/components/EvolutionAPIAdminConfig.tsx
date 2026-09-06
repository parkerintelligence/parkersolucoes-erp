import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, AlertTriangle, CheckCircle, QrCode, RefreshCw, Eye, EyeOff, Power, KeyRound, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type ConnState = 'unknown' | 'open' | 'connecting' | 'close';

export const EvolutionAPIAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();

  const evolutionIntegration = integrations?.find(integration => integration.type === 'evolution_api');

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [connState, setConnState] = useState<ConnState>('unknown');

  const [formData, setFormData] = useState({
    name: 'Evolution Go WhatsApp',
    base_url: '',
    api_token: '',
    instance_name: '',
    phone_number: '',
    is_active: true,
  });

  useEffect(() => {
    if (evolutionIntegration) {
      setFormData({
        name: evolutionIntegration.name || 'Evolution Go WhatsApp',
        base_url: evolutionIntegration.base_url || '',
        api_token: evolutionIntegration.api_token || '',
        instance_name: (evolutionIntegration as any).instance_name || '',
        phone_number: evolutionIntegration.phone_number || '',
        is_active: evolutionIntegration.is_active ?? true,
      });
    }
  }, [evolutionIntegration?.id]);

  const callProxy = async (endpoint: string, method = 'GET', body?: any) => {
    const { data, error } = await supabase.functions.invoke('evolution-proxy', {
      body: { integrationId: evolutionIntegration?.id, endpoint, method, data: body },
    });
    if (error) throw error;
    return data;
  };

  const handleSave = async () => {
    if (!formData.base_url || !formData.api_token || !formData.instance_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha URL Base, API Token e Nome da Instância.",
        variant: "destructive"
      });
      return;
    }

    const integrationData = {
      type: 'evolution_api' as const,
      name: formData.name,
      base_url: formData.base_url.replace(/\/$/, ''),
      api_token: formData.api_token,
      instance_name: formData.instance_name.trim(),
      phone_number: formData.phone_number || null,
      is_active: formData.is_active,
      is_global: true,
      username: null,
      password: null,
      webhook_url: null,
      region: null,
      bucket_name: null,
      port: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null,
    };

    try {
      if (evolutionIntegration) {
        await updateIntegration.mutateAsync({ id: evolutionIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }
      toast({ title: "Configuração salva", description: "Esta instância será usada em todos os envios do sistema." });
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({ title: "Erro ao salvar", description: "Ocorreu um erro ao salvar a configuração.", variant: "destructive" });
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const data = await callProxy('/instance/fetchInstances', 'GET');
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      toast({
        title: "✅ Conexão bem-sucedida!",
        description: `Servidor respondeu corretamente (${Array.isArray(list) ? list.length : 0} instância(s) no servidor).`,
      });
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      toast({ title: "❌ Erro na conexão", description: "Não foi possível conectar. Verifique URL e token.", variant: "destructive" });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const extractQr = (payload: any): string | null => {
    const raw = payload?.data ?? payload;
    const value = raw?.base64 || raw?.qrcode?.base64 || raw?.qr || raw?.code || raw?.qrcode || null;
    if (!value || typeof value !== 'string') return null;
    return value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
  };

  const handleCreateInstance = async () => {
    if (!evolutionIntegration) {
      toast({ title: "Salve primeiro", description: "Salve a configuração antes de gerar a instância.", variant: "destructive" });
      return;
    }
    setIsWorking(true);
    try {
      const payload = await callProxy('/instance/create', 'POST', { instanceName: formData.instance_name });
      const qr = extractQr(payload);
      setQrCode(qr);
      setConnState('connecting');
      toast({ title: "Instância criada", description: qr ? "Escaneie o QR Code no WhatsApp." : "Instância criada. Clique em Gerar QR Code." });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao criar instância", description: error?.message || 'Falha na criação.', variant: "destructive" });
    } finally {
      setIsWorking(false);
    }
  };

  const handleGetQr = async () => {
    setIsWorking(true);
    try {
      const payload = await callProxy(`/instance/connect/${formData.instance_name}`, 'GET');
      const qr = extractQr(payload);
      setQrCode(qr);
      if (!qr) toast({ title: "Sem QR Code", description: "A instância pode já estar conectada." });
    } catch (error: any) {
      toast({ title: "Erro ao gerar QR Code", description: error?.message || 'Falha.', variant: "destructive" });
    } finally {
      setIsWorking(false);
    }
  };

  const handleCheckState = async () => {
    setIsWorking(true);
    try {
      const payload = await callProxy(`/instance/connectionState/${formData.instance_name}`, 'GET');
      const raw = payload?.data ?? payload;
      const state = (raw?.state || raw?.instance?.state || raw?.status || 'unknown') as ConnState;
      setConnState(state);
      if (state === 'open') setQrCode(null);
      toast({ title: "Status da instância", description: `Estado: ${state}` });
    } catch (error: any) {
      toast({ title: "Erro ao consultar status", description: error?.message || 'Falha.', variant: "destructive" });
    } finally {
      setIsWorking(false);
    }
  };

  const handleLogout = async () => {
    setIsWorking(true);
    try {
      await callProxy(`/instance/logout/${formData.instance_name}`, 'DELETE');
      setConnState('close');
      setQrCode(null);
      toast({ title: "Desconectado", description: "A instância foi desconectada do WhatsApp." });
    } catch (error: any) {
      toast({ title: "Erro ao desconectar", description: error?.message || 'Falha.', variant: "destructive" });
    } finally {
      setIsWorking(false);
    }
  };

  const stateBadge = () => {
    if (connState === 'open') return <Badge className="bg-emerald-600 text-[10px]">Conectado</Badge>;
    if (connState === 'connecting') return <Badge className="bg-amber-500 text-[10px]">Aguardando QR</Badge>;
    if (connState === 'close') return <Badge variant="destructive" className="text-[10px]">Desconectado</Badge>;
    return <Badge variant="outline" className="text-[10px]">Desconhecido</Badge>;
  };

  const saving = createIntegration.isPending || updateIntegration.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-5 w-5" />
          WhatsApp (Evolution Go)
          {stateBadge()}
        </CardTitle>
        <CardDescription className="text-xs">
          Instância única usada por todo o sistema: relatórios agendados, FTP, Bacula, MikroTik, webhooks e alertas do Zabbix.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="name" className="text-xs">Nome da Integração</Label>
            <Input id="name" className="h-8 text-xs" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Evolution Go WhatsApp" />
          </div>

          <div>
            <Label htmlFor="base_url" className="text-xs">URL Base do Evolution Go *</Label>
            <Input id="base_url" className="h-8 text-xs" value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://evolution.seudominio.com" />
          </div>

          <div>
            <Label htmlFor="api_token" className="text-xs">API Token (global) *</Label>
            <div className="flex gap-1">
              <Input id="api_token" className="h-8 text-xs" type={showToken ? 'text' : 'password'}
                value={formData.api_token}
                onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                placeholder="••••••••••••••••" />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setShowToken(v => !v)}
                aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}>
                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="instance_name" className="text-xs">Nome da Instância *</Label>
            <Input id="instance_name" className="h-8 text-xs" value={formData.instance_name}
              onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
              placeholder="parker_principal" />
          </div>

          <div>
            <Label htmlFor="phone_number" className="text-xs">Número do WhatsApp</Label>
            <Input id="phone_number" className="h-8 text-xs" value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="5564999887766" />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3">
            <div>
              <Label htmlFor="is_active" className="text-xs">Integração Ativa</Label>
              <p className="text-[10px] text-muted-foreground">Habilita todos os envios por WhatsApp</p>
            </div>
            <Switch id="is_active" checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
            {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando...</>
              : evolutionIntegration ? 'Atualizar Configuração' : 'Salvar Configuração'}
          </Button>

          <Button size="sm" variant="outline" className="text-xs" onClick={testConnection}
            disabled={!evolutionIntegration || isTestingConnection}>
            {isTestingConnection ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Testando...</>
              : <><CheckCircle className="mr-2 h-3.5 w-3.5" />Testar Conexão</>}
          </Button>

          <Button size="sm" variant="outline" className="text-xs" onClick={handleCreateInstance}
            disabled={!evolutionIntegration || !formData.instance_name || isWorking}>
            <QrCode className="mr-2 h-3.5 w-3.5" />Gerar Instância
          </Button>

          <Button size="sm" variant="outline" className="text-xs" onClick={handleGetQr}
            disabled={!evolutionIntegration || !formData.instance_name || isWorking}>
            <QrCode className="mr-2 h-3.5 w-3.5" />Gerar QR Code
          </Button>

          <Button size="sm" variant="outline" className="text-xs" onClick={handleCheckState}
            disabled={!evolutionIntegration || !formData.instance_name || isWorking}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />Verificar Status
          </Button>

          <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={handleLogout}
            disabled={!evolutionIntegration || !formData.instance_name || isWorking}>
            <Power className="mr-2 h-3.5 w-3.5" />Desconectar
          </Button>
        </div>

        {qrCode && (
          <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Escaneie no WhatsApp: Aparelhos conectados → Conectar aparelho</p>
            <img src={qrCode} alt="QR Code para conectar a instância do WhatsApp" className="h-56 w-56 rounded bg-white p-2" />
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Instância única:</strong> todos os envios do sistema usam a instância configurada aqui.
            Salve a configuração, gere a instância, escaneie o QR Code e confirme o status como "Conectado".
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
