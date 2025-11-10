import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, AlertTriangle, CheckCircle, Zap, ExternalLink, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useChatwootAPI } from '@/hooks/useChatwootAPI';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChatwootConnectionTest } from './ChatwootConnectionTest';

export const ChatwootAdminConfig = () => {
  console.log('🔷 ChatwootAdminConfig - Componente renderizado');
  
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const { testConnection } = useChatwootAPI();
  
  const chatwootIntegration = integrations?.find(integration => integration.type === 'chatwoot');
  
  console.log('🔷 ChatwootAdminConfig - Integrations:', integrations);
  console.log('🔷 ChatwootAdminConfig - Chatwoot Integration:', chatwootIntegration);

  const [formData, setFormData] = useState({
    name: 'Chatwoot Atendimento',
    base_url: '',
    api_token: '',
    webhook_url: '',
    is_active: true,
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<any>(null);

  // Sincronizar formData com dados carregados
  useEffect(() => {
    console.log('🔶 useEffect - Sincronizando formData com chatwootIntegration:', chatwootIntegration);
    if (chatwootIntegration) {
      const newFormData = {
        name: chatwootIntegration.name,
        base_url: chatwootIntegration.base_url || '',
        api_token: chatwootIntegration.api_token || '',
        webhook_url: chatwootIntegration.webhook_url || '',
        is_active: chatwootIntegration.is_active,
      };
      console.log('🔶 useEffect - Novo formData:', newFormData);
      setFormData(newFormData);
    }
  }, [chatwootIntegration]);

  const handleSave = async () => {
    console.log('🔵 handleSave - Iniciando...');
    console.log('🔵 handleSave - formData:', formData);
    
    // Toast imediato para confirmar que o botão foi clicado
    toast({
      title: "Processando...",
      description: "Salvando configuração do Chatwoot.",
    });
    
    // Verificar usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔵 handleSave - Usuário logado:', user?.id, user?.email);
    
    if (!formData.base_url || !formData.api_token) {
      console.log('🔴 handleSave - Validação falhou: campos obrigatórios vazios');
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ handleSave - Validação passou');

    const integrationData = {
      type: 'chatwoot' as const,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token,
      webhook_url: formData.webhook_url || null,
      is_active: formData.is_active,
      username: null,
      password: null,
      phone_number: null,
      region: null,
      bucket_name: null,
      port: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null,
    };

    try {
      console.log('🔵 handleSave - Tentando salvar...');
      console.log('🔵 handleSave - Existe integração?', !!chatwootIntegration);
      console.log('🔵 handleSave - Integration Data:', integrationData);
      
      if (chatwootIntegration) {
        console.log('🔵 handleSave - Atualizando integração existente ID:', chatwootIntegration.id);
        await updateIntegration.mutateAsync({ id: chatwootIntegration.id, updates: integrationData });
        console.log('✅ handleSave - Update concluído');
      } else {
        console.log('🔵 handleSave - Criando nova integração');
        await createIntegration.mutateAsync(integrationData);
        console.log('✅ handleSave - Create concluído');
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do Chatwoot foi salva com sucesso.",
      });
      console.log('✅ handleSave - Toast de sucesso exibido');
    } catch (error) {
      console.error('🔴 handleSave - Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive"
      });
    }
  };

  const handleTestConnection = async () => {
    if (!chatwootIntegration?.id) {
      toast({
        title: "Configuração necessária",
        description: "Salve a configuração antes de testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    setConnectionStatus('testing');
    setErrorDetails(null);
    
    try {
      const result = await testConnection.mutateAsync();
      setConnectionStatus('success');
      setErrorDetails(null);
      
      // Show which URL format worked
      const baseUrl = chatwootIntegration.base_url;
      const needsApp = baseUrl.includes('/app');
      const urlType = needsApp ? 'self-hosted com /app' : baseUrl.includes('app.chatwoot.com') ? 'cloud' : 'self-hosted';
      
      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado ao Chatwoot (${urlType}). Contas encontradas: ${result?.length || 0}`,
      });
      
      setTimeout(() => setConnectionStatus('idle'), 5000);
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorDetails(error.details || null);
      console.error('Erro no teste de conexão:', error);
      setTimeout(() => setConnectionStatus('idle'), 5000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Configuração do Chatwoot
            </CardTitle>
            <CardDescription>
              Configure a integração com o Chatwoot para atendimento ao cliente.
            </CardDescription>
          </div>
          {chatwootIntegration && (
            <Badge variant={chatwootIntegration.is_active ? "default" : "secondary"}>
              {chatwootIntegration.is_active ? "Ativa" : "Inativa"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="test">Testar Conexão Direta</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="mt-4">
            <ChatwootConnectionTest />
          </TabsContent>

          <TabsContent value="config" className="space-y-6 mt-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Integração</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Chatwoot Atendimento"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base do Chatwoot *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://chat.parkerintelligence.com.br/app"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              <strong>Exemplos:</strong>
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
              <li>• Self-hosted com /app: <code className="bg-muted px-1 py-0.5 rounded">https://chat.seudominio.com.br/app</code></li>
              <li>• Self-hosted sem /app: <code className="bg-muted px-1 py-0.5 rounded">https://chatwoot.seudominio.com.br</code></li>
              <li>• Cloud: <code className="bg-muted px-1 py-0.5 rounded">https://app.chatwoot.com</code></li>
            </ul>
          </div>

          <div>
            <Label htmlFor="api_token">API Token *</Label>
            <Input
              id="api_token"
              type="password"
              value={formData.api_token}
              onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••"
            />
          </div>

          <div>
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              placeholder="https://meusite.com/webhook/chatwoot"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label htmlFor="is_active">Integração Ativa</Label>
              <p className="text-sm text-gray-500">
                Ative para habilitar o atendimento
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={createIntegration.isPending || updateIntegration.isPending}
            className="flex-1"
          >
            {createIntegration.isPending || updateIntegration.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : chatwootIntegration ? (
              'Atualizar Configuração'
            ) : (
              'Salvar Configuração'
            )}
          </Button>

          {chatwootIntegration && (
            <Button
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              variant="outline"
              className="flex-1"
            >
              {connectionStatus === 'testing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Conectado!
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                  Erro na Conexão
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </Button>
          )}
        </div>

        {connectionStatus === 'error' && errorDetails && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{errorDetails.error || 'Erro ao conectar'}</p>
                <div className="text-sm space-y-1">
                  <p><strong>Status HTTP:</strong> {errorDetails.status}</p>
                  <p><strong>Content-Type:</strong> {errorDetails.contentType}</p>
                  
                  {errorDetails.triedUrls && errorDetails.triedUrls.length > 0 && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <p className="font-semibold mb-1">🔍 URLs testadas automaticamente:</p>
                      {errorDetails.triedUrls.map((url: string, idx: number) => (
                        <p key={idx} className="font-mono text-[10px] break-all">
                          {idx + 1}. {url}
                        </p>
                      ))}
                      {errorDetails.baseUrl && (
                        <p className="mt-1 text-muted-foreground">
                          Base: <span className="font-mono">{errorDetails.baseUrl}</span>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {!errorDetails.triedUrls && (
                    <>
                      <p><strong>URL:</strong> {errorDetails.url}</p>
                      <p><strong>Token:</strong> {errorDetails.tokenMasked}</p>
                    </>
                  )}
                </div>
                
                {errorDetails.possibleCauses && errorDetails.possibleCauses.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm mb-1">Possíveis Causas:</p>
                    <ul className="text-sm space-y-0.5 list-disc list-inside">
                      {errorDetails.possibleCauses.map((cause: string, idx: number) => (
                        <li key={idx}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {errorDetails.actionSteps && errorDetails.actionSteps.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">✅ Como Resolver:</p>
                    <ol className="text-sm space-y-1 list-none">
                      {errorDetails.actionSteps.map((step: string, idx: number) => (
                        <li key={idx} className="text-blue-800 dark:text-blue-200">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="diagnostics">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Diagnóstico e Soluções</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Resolvendo Erro 406 (Not Acceptable):</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Verifique o tipo de token:</strong>
                    <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                      <li>Acesse Chatwoot → Profile Settings → Access Token</li>
                      <li>Gere um novo "Access Token" (não use Platform App Token)</li>
                      <li>Copie e cole o token exatamente como gerado</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Verifique as permissões:</strong>
                    <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                      <li>Sua conta deve ter permissão "Administrator" ou "Agent"</li>
                      <li>Verifique se a conta não está bloqueada</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Teste manualmente a URL:</strong>
                    <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                      <li>Abra o terminal e teste: <code className="bg-muted px-1 py-0.5 rounded text-xs">curl -H "api_access_token: SEU_TOKEN" {chatwootIntegration?.base_url}/api/v1/accounts</code></li>
                      <li>Deve retornar JSON, não HTML</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Alternativas:</strong>
                    <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                      <li>Tente com /api/v2 em vez de /api/v1</li>
                      <li>Regenere o token de acesso</li>
                      <li>Verifique a versão do Chatwoot (requer ≥ 2.0)</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {errorDetails && errorDetails.preview && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-2">Resposta do Servidor (preview):</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {errorDetails.preview}
                  </pre>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>Como configurar:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Acesse o Chatwoot como administrador</li>
                  <li>• Vá em Profile Settings → Access Token</li>
                  <li>• Gere um novo token de acesso</li>
                  <li>• Configure webhooks se necessário</li>
                </ul>
              </div>
              
              <div className="pt-2 border-t">
                <strong>Verificação de Conectividade:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• A URL deve ser acessível publicamente pela internet</li>
                  <li>• Verifique se não há firewall bloqueando o acesso</li>
                  <li>• Use HTTPS com certificado válido quando possível</li>
                  <li>• Para ambientes internos, considere usar um túnel (Ngrok, Cloudflare Tunnel)</li>
                </ul>
              </div>

              <a 
                href="https://developers.chatwoot.com/api-reference/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                Ver Documentação da API do Chatwoot
              </a>
            </div>
          </AlertDescription>
        </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
