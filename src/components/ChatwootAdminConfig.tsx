import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, AlertTriangle, CheckCircle, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ChatwootAdminConfig = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  const { data: integrations, error: integrationsError } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  
  const chatwootIntegration = integrations?.find(integration => integration.type === 'chatwoot');

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log('🔍 ChatwootAdmin:', logMessage);
    setDebugLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        addDebugLog('Iniciando verificação de autenticação...');
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          addDebugLog(`❌ Erro ao verificar usuário: ${error.message}`);
          setAuthError(error.message);
          setIsAuthenticated(false);
        } else if (user) {
          addDebugLog(`✅ Usuário autenticado: ${user.id} (${user.email})`);
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          addDebugLog('⚠️ Nenhum usuário autenticado encontrado');
          setIsAuthenticated(false);
          setAuthError('Nenhum usuário autenticado');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        addDebugLog(`💥 Exceção ao verificar autenticação: ${errorMessage}`);
        setAuthError(errorMessage);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
        addDebugLog('Verificação de autenticação concluída');
      }
    };
    checkAuth();
  }, []);

  const [formData, setFormData] = useState({
    name: chatwootIntegration?.name || 'Chatwoot Atendimento',
    base_url: chatwootIntegration?.base_url || '',
    api_token: chatwootIntegration?.api_token || '',
    webhook_url: chatwootIntegration?.webhook_url || '',
    is_active: chatwootIntegration?.is_active ?? true,
  });

  const handleSave = async () => {
    try {
      addDebugLog('📝 Iniciando processo de salvamento...');
      
      // Validação de campos obrigatórios
      if (!formData.base_url || !formData.api_token) {
        addDebugLog('❌ Validação falhou: campos obrigatórios vazios');
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios (URL Base e API Token).",
          variant: "destructive"
        });
        return;
      }

      // Validação de formato de URL
      try {
        new URL(formData.base_url);
        addDebugLog(`✅ URL válida: ${formData.base_url}`);
      } catch (urlError) {
        addDebugLog(`❌ URL inválida: ${formData.base_url}`);
        toast({
          title: "URL inválida",
          description: "Por favor, insira uma URL válida no formato: https://exemplo.com",
          variant: "destructive"
        });
        return;
      }

      // Verificar autenticação antes de salvar
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addDebugLog('❌ Usuário não autenticado ao tentar salvar');
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para salvar. Por favor, faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      addDebugLog(`✅ Usuário verificado: ${user.id}`);

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

      addDebugLog(`📦 Dados da integração preparados: ${JSON.stringify({ ...integrationData, api_token: '***HIDDEN***' })}`);

      if (chatwootIntegration) {
        addDebugLog(`🔄 Atualizando integração existente: ${chatwootIntegration.id}`);
        await updateIntegration.mutateAsync({ 
          id: chatwootIntegration.id, 
          updates: integrationData 
        });
        addDebugLog('✅ Integração atualizada com sucesso');
      } else {
        addDebugLog('➕ Criando nova integração');
        const result = await createIntegration.mutateAsync(integrationData);
        addDebugLog(`✅ Integração criada com sucesso: ${result?.id || 'ID não disponível'}`);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do Chatwoot foi salva com sucesso.",
      });
      
      addDebugLog('🎉 Processo de salvamento concluído com sucesso');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      addDebugLog(`💥 ERRO ao salvar: ${errorMessage}`);
      if (errorStack) {
        addDebugLog(`Stack trace: ${errorStack}`);
      }
      
      console.error('❌ Error saving integration:', error);
      
      toast({
        title: "Erro ao salvar",
        description: `Ocorreu um erro ao salvar a configuração: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  if (isCheckingAuth) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Configuração do Chatwoot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Autenticação Necessária</AlertTitle>
            <AlertDescription>
              Você precisa estar autenticado para configurar integrações. Por favor, faça login.
              {authError && (
                <div className="mt-2 text-sm font-mono bg-destructive/10 p-2 rounded">
                  Erro: {authError}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Debug Logs */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="w-full"
            >
              <Bug className="h-4 w-4 mr-2" />
              {showDebug ? 'Ocultar' : 'Mostrar'} Logs de Debug
            </Button>
            
            {showDebug && debugLogs.length > 0 && (
              <div className="bg-slate-950 text-green-400 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                {debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Configuração do Chatwoot
        </CardTitle>
        <CardDescription>
          Configure a integração com o Chatwoot para atendimento ao cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
              placeholder="https://app.chatwoot.com"
            />
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

        <Button
          onClick={handleSave}
          disabled={createIntegration.isPending || updateIntegration.isPending}
          className="w-full"
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

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como configurar:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Acesse o Chatwoot como administrador</li>
              <li>• Vá em Profile Settings → Access Token</li>
              <li>• Gere um novo token de acesso</li>
              <li>• Configure webhooks se necessário</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Informações de status */}
        {(integrationsError || createIntegration.error || updateIntegration.error) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro Detectado</AlertTitle>
            <AlertDescription className="space-y-2">
              {integrationsError && (
                <div className="text-sm">
                  <strong>Erro ao carregar integrações:</strong>
                  <div className="font-mono mt-1 bg-destructive/10 p-2 rounded">
                    {integrationsError.message}
                  </div>
                </div>
              )}
              {createIntegration.error && (
                <div className="text-sm">
                  <strong>Erro ao criar integração:</strong>
                  <div className="font-mono mt-1 bg-destructive/10 p-2 rounded">
                    {createIntegration.error.message}
                  </div>
                </div>
              )}
              {updateIntegration.error && (
                <div className="text-sm">
                  <strong>Erro ao atualizar integração:</strong>
                  <div className="font-mono mt-1 bg-destructive/10 p-2 rounded">
                    {updateIntegration.error.message}
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Logs */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="w-full"
          >
            <Bug className="h-4 w-4 mr-2" />
            {showDebug ? 'Ocultar' : 'Mostrar'} Logs de Debug ({debugLogs.length})
          </Button>
          
          {showDebug && debugLogs.length > 0 && (
            <div className="bg-slate-950 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
              {debugLogs.map((log, index) => (
                <div key={index} className="mb-1 hover:bg-slate-900 px-1">{log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Status Info */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm space-y-1">
              <div><strong>Status da Autenticação:</strong> {isAuthenticated ? '✅ Autenticado' : '❌ Não autenticado'}</div>
              <div><strong>Integração Existente:</strong> {chatwootIntegration ? `✅ Sim (ID: ${chatwootIntegration.id})` : '⚠️ Não'}</div>
              <div><strong>Total de Logs:</strong> {debugLogs.length}</div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
