import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, Save, TestTube, CheckCircle, XCircle, 
  AlertCircle, HeartPulse, Loader2
} from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { useWazuhAPI } from '@/hooks/useWazuhAPI';
import { useToast } from '@/hooks/use-toast';
import { WazuhSetupGuide } from './WazuhSetupGuide';
import { WazuhConnectionTroubleshoot } from './WazuhConnectionTroubleshoot';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  url: string;
  protocol: string;
  reachable: boolean;
  tlsValid: boolean;
  authOk: boolean;
  managerInfo: any | null;
  error: string | null;
  errorType: string | null;
}

interface HealthCheckResponse {
  success: boolean;
  results: HealthCheckResult[];
  summary: string;
  recommendation: string | null;
}

const WazuhAdminConfig = () => {
  const { toast } = useToast();
  const { testWazuhConnection } = useWazuhAPI();
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();
  
  const wazuhIntegration = integrations?.find(int => int.type === 'wazuh');

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResponse | null>(null);

  const [formData, setFormData] = useState({
    name: wazuhIntegration?.name || 'Wazuh Principal',
    base_url: wazuhIntegration?.base_url || 'http://',
    username: wazuhIntegration?.username || '',
    password: wazuhIntegration?.password || '',
    api_token: wazuhIntegration?.api_token || '',
    is_active: wazuhIntegration?.is_active ?? true,
  });

  React.useEffect(() => {
    if (wazuhIntegration) {
      setFormData({
        name: wazuhIntegration.name || 'Wazuh Principal',
        base_url: wazuhIntegration.base_url || '',
        username: wazuhIntegration.username || '',
        password: wazuhIntegration.password || '',
        api_token: wazuhIntegration.api_token || '',
        is_active: wazuhIntegration.is_active ?? true,
      });
    }
  }, [wazuhIntegration]);

  const handleHealthCheck = async () => {
    if (!formData.base_url) {
      toast({ title: "URL obrigatória", description: "Informe a URL do Wazuh.", variant: "destructive" });
      return;
    }
    if (!formData.api_token && (!formData.username || !formData.password)) {
      toast({ title: "Credenciais obrigatórias", description: "Informe usuário/senha ou API token.", variant: "destructive" });
      return;
    }

    setIsHealthChecking(true);
    setHealthCheck(null);
    setTestResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/wazuh-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'health-check',
            base_url: formData.base_url,
            username: formData.username,
            password: formData.password,
            api_token: formData.api_token || undefined,
          }),
        }
      );

      const data: HealthCheckResponse = await resp.json();
      setHealthCheck(data);

      if (data.success) {
        toast({ title: "✅ Health-check OK", description: data.summary });
      } else {
        toast({ title: "❌ Health-check falhou", description: data.summary.substring(0, 120), variant: "destructive" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setHealthCheck({ success: false, results: [], summary: msg, recommendation: null });
      toast({ title: "Erro no health-check", description: msg, variant: "destructive" });
    } finally {
      setIsHealthChecking(false);
    }
  };

  const handleSave = async () => {
    if (!formData.base_url) {
      toast({ title: "Erro de validação", description: "A URL do Wazuh é obrigatória.", variant: "destructive" });
      return;
    }
    if (!formData.api_token && (!formData.username || !formData.password)) {
      toast({ title: "Erro de validação", description: "Informe usuário e senha ou um API token do Wazuh.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const integrationData = {
        type: 'wazuh',
        name: formData.name,
        base_url: formData.base_url.replace(/\/$/, ''),
        username: formData.username,
        password: formData.password,
        api_token: formData.api_token || null,
        is_active: formData.is_active,
        is_global: true
      };

      if (wazuhIntegration) {
        await updateIntegration.mutateAsync({ id: wazuhIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({ title: "Configuração salva!", description: "As configurações do Wazuh foram salvas com sucesso." });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: "Erro ao salvar", description: "Ocorreu um erro ao salvar as configurações do Wazuh.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!wazuhIntegration) {
      toast({ title: "Configuração necessária", description: "Salve a configuração antes de testar a conexão", variant: "destructive" });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      await testWazuhConnection.mutateAsync(wazuhIntegration.id);
      setTestResult({ success: true, message: "Conexão com Wazuh estabelecida com sucesso!" });
    } catch (error) {
      setTestResult({ success: false, message: "Falha na conexão. Verifique URL, credenciais e conectividade." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!wazuhIntegration) return;
    if (confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await deleteIntegration.mutateAsync(wazuhIntegration.id);
        setFormData({ name: 'Wazuh Principal', base_url: '', username: '', password: '', api_token: '', is_active: true });
        toast({ title: "Integração excluída", description: "A integração Wazuh foi removida com sucesso." });
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              <div>
                <CardTitle className="text-white">Configuração Wazuh</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure a integração com o Wazuh SIEM para monitoramento de segurança
                </CardDescription>
              </div>
            </div>
            {wazuhIntegration && (
              <Badge variant={wazuhIntegration.is_active ? "default" : "secondary"}>
                {wazuhIntegration.is_active ? "Ativo" : "Inativo"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700">
              <TabsTrigger value="connection" className="text-white">Conexão</TabsTrigger>
              <TabsTrigger value="troubleshoot" className="text-white">Diagnóstico</TabsTrigger>
              <TabsTrigger value="guide" className="text-white">Guia de Setup</TabsTrigger>
              <TabsTrigger value="settings" className="text-white">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  <strong>Importante:</strong> Certificados SSL auto-assinados não são suportados. 
                  Use HTTPS com certificado válido (Let's Encrypt), reverse proxy, ou HTTP em rede interna.
                  <strong className="block mt-1">Use o Health-Check abaixo para validar antes de salvar.</strong>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nome da Integração</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Wazuh Principal"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_url" className="text-white">URL do Wazuh *</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://wazuh.empresa.com:55000"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Porta padrão: 55000. HTTPS com cert válido ou HTTP em rede interna.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Usuário</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="wazuh-user"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="api_token" className="text-white">API Token (alternativo)</Label>
                  <Input
                    id="api_token"
                    type="password"
                    value={formData.api_token}
                    onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                    placeholder="Token JWT do Wazuh (opcional, substitui usuário/senha)"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Se informado, será usado no lugar de usuário/senha para autenticação.
                  </p>
                </div>
              </div>

              <Separator className="bg-slate-600" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="text-white">Integração ativa</Label>
                </div>
              </div>

              {/* Health-Check Results */}
              {healthCheck && (
                <div className="space-y-3">
                  <Alert className={healthCheck.success ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}>
                    {healthCheck.success ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    <AlertDescription className="text-white text-sm">
                      {healthCheck.summary}
                    </AlertDescription>
                  </Alert>

                  {healthCheck.results.length > 0 && (
                    <div className="grid gap-2">
                      {healthCheck.results.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded bg-slate-700/50 text-xs text-slate-300">
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {r.protocol}
                          </Badge>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={r.reachable ? 'text-green-400' : 'text-red-400'}>
                              {r.reachable ? '✓ Alcançável' : '✗ Inalcançável'}
                            </span>
                            {r.protocol === 'HTTPS' && (
                              <span className={r.tlsValid ? 'text-green-400' : 'text-red-400'}>
                                {r.tlsValid ? '✓ TLS válido' : '✗ TLS inválido'}
                              </span>
                            )}
                            <span className={r.authOk ? 'text-green-400' : 'text-red-400'}>
                              {r.authOk ? '✓ Auth OK' : '✗ Auth falhou'}
                            </span>
                            {r.managerInfo?.version && (
                              <span className="text-blue-400">Wazuh {r.managerInfo.version}</span>
                            )}
                          </div>
                          {r.error && <span className="text-red-300 ml-auto truncate max-w-xs" title={r.error}>{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {healthCheck.recommendation && (
                    <Alert className="border-amber-500 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <AlertDescription className="text-amber-200 text-sm">
                        <strong>Recomendação:</strong> {healthCheck.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {testResult && (
                <Alert className={testResult.success ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-white">{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleHealthCheck}
                  disabled={isHealthChecking}
                  variant="outline"
                  className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white"
                >
                  {isHealthChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HeartPulse className="mr-2 h-4 w-4" />}
                  {isHealthChecking ? "Verificando..." : "Health-Check"}
                </Button>

                <Button 
                  onClick={handleTestConnection}
                  disabled={isTesting || !wazuhIntegration}
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {isTesting ? "Testando..." : "Testar Conexão"}
                </Button>

                <Button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>

                {wazuhIntegration && (
                  <Button 
                    onClick={handleDelete}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="troubleshoot" className="space-y-4">
              <WazuhConnectionTroubleshoot />
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <WazuhSetupGuide />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Alert className="border-blue-500 bg-blue-500/10">
                <Shield className="h-4 w-4" />
                 <AlertDescription className="text-white">
                   <strong>Sobre a API do Wazuh:</strong><br />
                   • Porta padrão: 55000<br />
                   • Autenticação JWT via Basic Auth<br />
                   • Endpoints oficiais da API REST<br />
                   • HTTPS com certificado válido recomendado<br />
                   • Cache de token para performance
                 </AlertDescription>
              </Alert>

              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Funcionalidades Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Monitoramento de agentes em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Visualização de alertas de segurança</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Estatísticas de conformidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Relatórios de vulnerabilidades</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Dashboard de segurança</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WazuhAdminConfig;