import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Monitor, Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GuacamoleAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
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
    if (!config.base_url || !config.username || !config.password) {
      toast({
        title: "Configuração incompleta",
        description: "Preencha todos os campos obrigatórios: URL Base, Usuário e Senha.",
        variant: "destructive"
      });
      return;
    }

    try {
      const integrationData = {
        type: 'guacamole' as const,
        name: config.name,
        base_url: config.base_url,
        username: config.username,
        password: config.password,
        is_active: config.is_active,
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
          updates: {
            name: config.name,
            base_url: config.base_url,
            username: config.username,
            password: config.password,
            is_active: config.is_active,
          }
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva!",
        description: "As configurações do Guacamole foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração Guacamole:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do Guacamole.",
        variant: "destructive"
      });
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
      // First save/update the integration to ensure it exists
      let testIntegrationId = guacamoleIntegration?.id;
      
      if (!testIntegrationId) {
        // Create temporary integration for testing
        const tempIntegrationData = {
          type: 'guacamole' as const,
          name: config.name,
          base_url: config.base_url,
          username: config.username,
          password: config.password,
          is_active: true,
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
        
        const createdIntegration = await createIntegration.mutateAsync(tempIntegrationData);
        testIntegrationId = createdIntegration.id;
      } else {
        // Update existing integration
        await updateIntegration.mutateAsync({
          id: testIntegrationId,
          updates: {
            name: config.name,
            base_url: config.base_url,
            username: config.username,
            password: config.password,
            is_active: true,
          }
        });
      }

      // Wait a moment to ensure integration was saved
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test using the Edge Function
      console.log('=== Testando conexão Guacamole ===');
      console.log('Integration ID:', testIntegrationId);
      console.log('Base URL:', config.base_url);
      console.log('Username:', config.username);

      const { data, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: {
          integrationId: testIntegrationId,
          endpoint: 'connections',
          method: 'GET'
        }
      });

      console.log('Teste - Data:', data);
      console.log('Teste - Error:', error);

      if (error) {
        throw new Error(`Erro na comunicação: ${error.message || 'Erro desconhecido'}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Conexão bem-sucedida!",
        description: "A conexão com o Apache Guacamole foi estabelecida com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao testar conexão Guacamole:', error);
      
      let errorMessage = 'Não foi possível conectar ao Guacamole.';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conectividade: Verifique se a URL do Guacamole está correta e acessível.\n\n• A URL inclui o protocolo (https:// ou http://)\n• O servidor Guacamole está online\n• Não há bloqueios de firewall\n• A URL está no formato correto (ex: https://seu-servidor.com/guacamole)';
      } else if (error.message.includes('404')) {
        errorMessage = 'URL não encontrada: Verifique se a URL do Guacamole está correta. Exemplo: https://seu-servidor.com/guacamole';
      } else if (error.message.includes('401') || error.message.includes('Credenciais inválidas')) {
        errorMessage = 'Credenciais inválidas: Verifique se o usuário e senha estão corretos e se o usuário tem permissões administrativas.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Acesso negado: O usuário não tem permissões suficientes. Certifique-se de usar um usuário com privilégios administrativos no Guacamole.';
      } else {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro na conexão",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const isFormValid = config.base_url && config.username && config.password;

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
            placeholder="https://guacamole.exemplo.com/guacamole"
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: https://seu-servidor.com/guacamole (inclua /guacamole se necessário)
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-base font-medium">Credenciais de Acesso</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guacamole-username">Usuário *</Label>
              <Input
                id="guacamole-username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="guacadmin"
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
        </div>

        <Separator />

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label htmlFor="guacamole-active">Integração Ativa</Label>
            <p className="text-sm text-muted-foreground">
              Ative para habilitar o acesso remoto
            </p>
          </div>
          <Switch
            id="guacamole-active"
            checked={config.is_active}
            onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleTest}
            disabled={testing || !isFormValid}
            variant="outline"
            className="flex items-center gap-2"
          >
            {testing ? (
              <TestTube className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>

          <Button
            onClick={handleSave}
            disabled={createIntegration.isPending || updateIntegration.isPending || !isFormValid}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {guacamoleIntegration ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">Configuração:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Use um usuário com privilégios administrativos</li>
            <li>• Certifique-se de que o Guacamole está acessível</li>
            <li>• A URL deve incluir o contexto (/guacamole)</li>
            <li>• Teste a conexão antes de ativar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
