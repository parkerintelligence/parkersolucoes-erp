import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/hooks/useIntegrations';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';
import { toast } from '@/hooks/use-toast';
import { Loader2, Settings, Server, AlertTriangle, CheckCircle } from 'lucide-react';

export const ZabbixAdminConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  const { testConnection } = useZabbixIntegration();
  
  const zabbixIntegration = integrations?.find(integration => integration.type === 'zabbix');

  const [formData, setFormData] = useState({
    name: zabbixIntegration?.name || 'Zabbix Monitoramento',
    base_url: zabbixIntegration?.base_url || '',
    api_token: zabbixIntegration?.api_token || '',
    is_active: zabbixIntegration?.is_active ?? true,
  });

  const handleTestConnection = () => {
    if (!formData.base_url || !formData.api_token) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha URL Base e API Token para testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    // Primeiro salvar temporariamente para testar
    if (!zabbixIntegration) {
      toast({
        title: "Salve primeiro",
        description: "Salve a configuração antes de testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    console.log('Testando conexão com:', { 
      base_url: formData.base_url, 
      api_token: formData.api_token.substring(0, 10) + '...' 
    });

    testConnection.mutate({
      base_url: formData.base_url,
      api_token: formData.api_token
    });
  };

  const handleSave = async () => {
    if (!formData.base_url || !formData.api_token) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const integrationData = {
      type: 'zabbix' as const,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token,
      username: null,
      password: null,
      is_active: formData.is_active,
      webhook_url: null,
      phone_number: null,
      region: null,
      bucket_name: null,
      port: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null,
    };

    console.log('Saving integration data:', { ...integrationData, api_token: '***' });

    try {
      if (zabbixIntegration) {
        await updateIntegration.mutateAsync({ id: zabbixIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do Zabbix foi salva com sucesso.",
      });
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-6 w-6" />
          Configuração do Zabbix
        </CardTitle>
        <CardDescription>
          Configure a conexão com seu servidor Zabbix usando API Token.
          <br />
          <strong>Nova implementação:</strong> Agora usa proxy para resolver problemas de CORS.
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
              placeholder="Ex: Zabbix Monitoramento"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base do Zabbix *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="http://monitoramento.exemplo.com.br/zabbix"
            />
            <p className="text-sm text-gray-500 mt-1">
              Digite apenas a URL base (sem /api_jsonrpc.php no final)
            </p>
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
            <p className="text-sm text-gray-500 mt-1">
              Token de API gerado no Zabbix (Administration → General → API tokens)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label htmlFor="is_active">Integração Ativa</Label>
              <p className="text-sm text-gray-500">
                Ative para habilitar o monitoramento
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={testConnection.isPending || !zabbixIntegration}
            variant="outline"
            className="flex-1"
          >
            {testConnection.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Testar Conexão
              </>
            )}
          </Button>
          
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
            ) : zabbixIntegration ? (
              'Atualizar Configuração'
            ) : (
              'Salvar Configuração'
            )}
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problemas de CORS:</strong>
            Se você receber erros de conexão, pode ser um problema de CORS. A implementação atual faz requisições diretas ao Zabbix.
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Verifique se o Zabbix aceita conexões HTTPS</li>
              <li>• Configure CORS no servidor web (Apache/Nginx)</li>
              <li>• Use HTTPS tanto no app quanto no Zabbix</li>
              <li>• Se continuar com erro, entre em contato com o suporte</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como obter um API Token:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Acesse o Zabbix como administrador</li>
              <li>• Vá em Administration → General → API tokens</li>
              <li>• Clique em "Create API token"</li>
              <li>• Configure as permissões necessárias</li>
              <li>• Copie o token gerado e cole aqui</li>
            </ul>
          </AlertDescription>
        </Alert>

        {zabbixIntegration && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> Configuração encontrada e {zabbixIntegration.is_active ? 'ativa' : 'inativa'}.
              <br />
              <strong>URL:</strong> {zabbixIntegration.base_url}
              <br />
              <strong>Proxy:</strong> Ativo via Supabase Edge Function
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
