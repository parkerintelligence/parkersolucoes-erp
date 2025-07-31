import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface ChatwootConfig {
  name: string;
  base_url: string;
  api_token: string;
}

export const ChatwootSimpleConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const [config, setConfig] = useState<ChatwootConfig>({
    name: 'Chatwoot WhatsApp',
    base_url: '',
    api_token: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const chatwootIntegration = integrations?.find(int => int.type === 'chatwoot');

  // Load existing configuration
  useState(() => {
    if (chatwootIntegration) {
      setConfig({
        name: chatwootIntegration.name,
        base_url: chatwootIntegration.base_url,
        api_token: chatwootIntegration.api_token || ''
      });
    }
  });

  const testConnection = async () => {
    if (!config.base_url || !config.api_token) {
      toast({
        title: "❌ Configuração Incompleta",
        description: "Preencha a URL e o Token da API",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    
    try {
      const cleanUrl = config.base_url.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/accounts`, {
        headers: {
          'api_access_token': config.api_token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: "✅ Conexão Bem-sucedida",
          description: "Chatwoot conectado com sucesso!",
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Chatwoot connection test failed:', error);
      setConnectionStatus('error');
      toast({
        title: "❌ Falha na Conexão",
        description: `Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const integrationData = {
        type: 'chatwoot' as const,
        name: config.name,
        base_url: config.base_url,
        api_token: config.api_token,
        username: null,
        password: null,
        port: null,
        bucket_name: null,
        directory: null,
        region: null,
        is_active: true,
        passive_mode: null,
        use_ssl: null,
        keep_logged: null,
        webhook_url: null,
        phone_number: null,
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
        title: "✅ Configuração Salva",
        description: "Integração Chatwoot configurada com sucesso!",
      });
    } catch (error) {
      console.error('Error saving Chatwoot configuration:', error);
      toast({
        title: "❌ Erro ao Salvar",
        description: "Erro ao salvar configuração do Chatwoot",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          Configuração Chatwoot (WhatsApp)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        {chatwootIntegration && (
          <div className="flex items-center gap-2">
            <Badge className={chatwootIntegration.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {chatwootIntegration.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            {connectionStatus === 'success' && (
              <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            )}
          </div>
        )}

        {/* Configuration Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Integração</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="Chatwoot WhatsApp"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL do Chatwoot</Label>
            <Input
              id="base_url"
              value={config.base_url}
              onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
              placeholder="https://app.chatwoot.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemplo: https://app.chatwoot.com ou https://seu-chatwoot.com
            </p>
          </div>

          <div>
            <Label htmlFor="api_token">Token da API</Label>
            <Input
              id="api_token"
              type="password"
              value={config.api_token}
              onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
              placeholder="Seu token da API do Chatwoot"
            />
            <p className="text-xs text-gray-500 mt-1">
              Encontre em: Configurações → Perfil → Tokens de Acesso
            </p>
          </div>
        </div>

        {/* Test Connection */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isTestingConnection || !config.base_url || !config.api_token}
          >
            {isTestingConnection ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Testar Conexão
          </Button>

          {connectionStatus === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Conectado
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Erro na conexão
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={saveConfiguration}
          disabled={!config.base_url || !config.api_token || createIntegration.isPending || updateIntegration.isPending}
          className="w-full"
        >
          {(createIntegration.isPending || updateIntegration.isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {chatwootIntegration ? 'Atualizar Configuração' : 'Salvar Configuração'}
        </Button>

        {/* Help Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Como configurar:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Acesse seu painel do Chatwoot</li>
            <li>2. Vá em Configurações → Perfil → Tokens de Acesso</li>
            <li>3. Gere um novo token de acesso</li>
            <li>4. Cole o token no campo acima</li>
            <li>5. Teste a conexão antes de salvar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
