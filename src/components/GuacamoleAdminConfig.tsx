
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Monitor, Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

export const GuacamoleAdminConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  const [testing, setTesting] = useState(false);

  const guacamoleIntegration = integrations?.find(i => i.type === 'guacamole');

  const [config, setConfig] = useState({
    name: guacamoleIntegration?.name || 'Apache Guacamole',
    base_url: guacamoleIntegration?.base_url || '',
    username: guacamoleIntegration?.username || '',
    password: guacamoleIntegration?.password || '',
    is_active: guacamoleIntegration?.is_active ?? true,
  });

  const handleSave = async () => {
    try {
      const integrationData = {
        type: 'guacamole' as const,
        name: config.name,
        base_url: config.base_url,
        username: config.username,
        password: config.password,
        is_active: config.is_active,
        // Campos obrigatórios da interface Integration com valores padrão
        api_token: null,
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

      if (guacamoleIntegration) {
        await updateIntegration.mutateAsync({
          id: guacamoleIntegration.id,
          updates: config
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração Guacamole:', error);
    }
  };

  const handleTest = async () => {
    if (!config.base_url || !config.username || !config.password) {
      toast({
        title: "Configuração incompleta",
        description: "Preencha todos os campos obrigatórios antes de testar.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      // Teste básico de conectividade
      const response = await fetch(`${config.base_url.replace(/\/$/, '')}/api/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: config.username,
          password: config.password,
        }),
      });

      if (response.ok) {
        toast({
          title: "Conexão bem-sucedida!",
          description: "A conexão com o Apache Guacamole foi estabelecida com sucesso.",
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão Guacamole:', error);
      toast({
        title: "Erro na conexão",
        description: `Não foi possível conectar ao Guacamole: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Monitor className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Apache Guacamole
              {guacamoleIntegration && (
                <Badge variant={guacamoleIntegration.is_active ? 'default' : 'secondary'}>
                  {guacamoleIntegration.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure a integração com Apache Guacamole para acesso remoto
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guacamole-name">Nome da Integração</Label>
            <Input
              id="guacamole-name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="Apache Guacamole"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guacamole-url">URL Base *</Label>
            <Input
              id="guacamole-url"
              value={config.base_url}
              onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
              placeholder="https://guacamole.exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guacamole-username">Usuário *</Label>
            <Input
              id="guacamole-username"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guacamole-password">Senha *</Label>
            <Input
              id="guacamole-password"
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="guacamole-active"
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
            />
            <Label htmlFor="guacamole-active">Integração ativa</Label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !config.base_url || !config.username || !config.password}
            >
              <TestTube className="mr-2 h-4 w-4" />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>

            <Button 
              onClick={handleSave}
              disabled={createIntegration.isPending || updateIntegration.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuração
            </Button>
          </div>
        </div>

        {guacamoleIntegration && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              Integração configurada em {new Date(guacamoleIntegration.created_at).toLocaleString('pt-BR')}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">Configuração do Guacamole</p>
              <ul className="text-blue-700 space-y-1">
                <li>• A URL base deve apontar para sua instalação do Guacamole</li>
                <li>• Use credenciais de um usuário com permissões administrativas</li>
                <li>• Certifique-se de que a API REST esteja habilitada</li>
                <li>• Exemplo de URL: https://guacamole.exemplo.com</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
