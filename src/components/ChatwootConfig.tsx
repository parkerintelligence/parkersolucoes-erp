import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { useChatwootAPI } from '@/hooks/useChatwootAPI';
import { toast } from '@/hooks/use-toast';

export const ChatwootConfig = () => {
  const { data: integrations = [] } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const { testConnection } = useChatwootAPI();
  
  const chatwootIntegration = integrations.find(integration => integration.type === 'chatwoot');
  
  const [config, setConfig] = React.useState({
    name: chatwootIntegration?.name || 'Chatwoot Principal',
    base_url: chatwootIntegration?.base_url || '',
    api_token: chatwootIntegration?.api_token || '',
    webhook_url: chatwootIntegration?.webhook_url || '',
    is_active: chatwootIntegration?.is_active ?? true,
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTestConnection = async () => {
    if (!config.base_url || !config.api_token) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a URL base e o token da API para testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    setTestStatus('testing');
    try {
      await testConnection.mutateAsync({
        base_url: config.base_url,
        api_token: config.api_token
      });
      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
    }
  };

  const handleSave = async () => {
    if (!config.name || !config.base_url || !config.api_token) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const integrationData = {
        type: 'chatwoot' as const,
        name: config.name,
        base_url: config.base_url,
        api_token: config.api_token,
        webhook_url: config.webhook_url || null,
        phone_number: null,
        username: null,
        password: null,
        region: null,
        bucket_name: null,
        port: null,
        directory: null,
        passive_mode: null,
        use_ssl: null,
        keep_logged: null,
        is_active: config.is_active,
      };

      if (chatwootIntegration) {
        await updateIntegration.mutateAsync({
          id: chatwootIntegration.id,
          updates: integrationData
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva!",
        description: "A configuração do Chatwoot foi salva com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTestStatusIcon = () => {
    switch (testStatus) {
      case 'testing':
        return <TestTube className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Configuração do Chatwoot
        </CardTitle>
        <CardDescription>
          Configure a integração com sua instância do Chatwoot para gerenciar conversas de WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Integração *</Label>
            <Input
              id="name"
              placeholder="Ex: Chatwoot Principal"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_url">URL Base do Chatwoot *</Label>
            <Input
              id="base_url"
              placeholder="https://chatwoot.suaempresa.com.br"
              value={config.base_url}
              onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Digite apenas a URL base (ex: https://chatwoot.suaempresa.com.br)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_token">Token de API *</Label>
            <Input
              id="api_token"
              type="password"
              placeholder="••••••••••••••••••••••••••••••••"
              value={config.api_token}
              onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Obtenha o token em: Configurações → Integrações → API ou Perfil → Token de Acesso
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">URL do Webhook (Opcional)</Label>
            <Textarea
              id="webhook_url"
              placeholder="https://seu-webhook.com/chatwoot"
              value={config.webhook_url}
              onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
              rows={2}
            />
            <p className="text-sm text-gray-500">
              URL para receber notificações de eventos do Chatwoot
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Integração Ativa</Label>
              <p className="text-sm text-gray-500">
                Ative para começar a usar a integração
              </p>
            </div>
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testConnection.isPending || !config.base_url || !config.api_token}
            className="flex items-center gap-2"
          >
            {getTestStatusIcon()}
            {testConnection.isPending ? 'Testando...' : 'Testar Conexão'}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isLoading || createIntegration.isPending || updateIntegration.isPending}
            className="flex-1"
          >
            {isLoading ? 'Salvando...' : chatwootIntegration ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>

        {testStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">Conexão bem-sucedida!</p>
            </div>
            <p className="text-green-700 text-sm mt-1">
              A conexão com o Chatwoot foi estabelecida com sucesso.
            </p>
          </div>
        )}

        {testStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Erro na conexão</p>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Verifique a URL e o token de API. Certifique-se de que o Chatwoot está acessível.
            </p>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Dicas de Configuração:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use apenas a URL base (sem /api/v1 no final)</li>
            <li>• O token deve ter permissões de leitura e escrita</li>
            <li>• Teste a conexão antes de salvar</li>
            <li>• Para HTTP, certifique-se de que não há bloqueios de CORS</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
