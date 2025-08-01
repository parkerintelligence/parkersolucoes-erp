import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wrench, Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GLPIConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const [testing, setTesting] = useState(false);

  const glpiIntegration = integrations?.find(i => i.type === 'glpi');

  const [config, setConfig] = useState({
    name: glpiIntegration?.name || 'GLPI Principal',
    base_url: glpiIntegration?.base_url || '',
    api_token: glpiIntegration?.api_token || '',
    username: glpiIntegration?.username || '',
    password: glpiIntegration?.password || '',
    is_active: glpiIntegration?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!config.base_url || (!config.api_token && (!config.username || !config.password))) {
      toast({
        title: "Configuração incompleta",
        description: "Preencha todos os campos obrigatórios: URL Base e API Token ou usuário/senha.",
        variant: "destructive"
      });
      return;
    }

    try {
      const integrationData = {
        type: 'glpi' as const,
        name: config.name,
        base_url: config.base_url,
        api_token: config.api_token || null,
        username: config.username || null,
        password: config.password || null,
        is_active: config.is_active,
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

      if (glpiIntegration) {
        await updateIntegration.mutateAsync({
          id: glpiIntegration.id,
          updates: integrationData
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva!",
        description: "As configurações do GLPI foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração GLPI:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do GLPI.",
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    if (!config.base_url || (!config.api_token && (!config.username || !config.password))) {
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
      let testIntegrationId = glpiIntegration?.id;
      
      if (!testIntegrationId) {
        // Create temporary integration for testing
        const tempIntegrationData = {
          type: 'glpi' as const,
          name: config.name,
          base_url: config.base_url,
          api_token: config.api_token || null,
          username: config.username || null,
          password: config.password || null,
          is_active: true,
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
            api_token: config.api_token || null,
            username: config.username || null,
            password: config.password || null,
            is_active: true,
          }
        });
      }

      // Wait a moment to ensure integration was saved
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test using the Edge Function
      console.log('=== Testando conexão GLPI ===');
      console.log('Integration ID:', testIntegrationId);
      console.log('Base URL:', config.base_url);
      console.log('API Token present:', !!config.api_token);
      console.log('Username present:', !!config.username);

      const { data, error } = await supabase.functions.invoke('glpi-proxy', {
        body: {
          integrationId: testIntegrationId,
          endpoint: 'initSession',
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
        description: "A conexão com o GLPI foi estabelecida com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao testar conexão GLPI:', error);
      
      let errorMessage = 'Não foi possível conectar ao GLPI.';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conectividade: Verifique se a URL do GLPI está correta e acessível.\n\n• A URL inclui o protocolo (https:// ou http://)\n• O servidor GLPI está online\n• Não há bloqueios de firewall\n• A URL está no formato correto (ex: https://glpi.empresa.com/apirest.php)';
      } else if (error.message.includes('404')) {
        errorMessage = 'URL não encontrada: Verifique se a URL do GLPI está correta. Exemplo: https://glpi.empresa.com/apirest.php';
      } else if (error.message.includes('401') || error.message.includes('Credenciais inválidas')) {
        errorMessage = 'Credenciais inválidas: Verifique se o token de API ou usuário/senha estão corretos.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Acesso negado: O usuário não tem permissões suficientes. Certifique-se de usar um usuário com privilégios de API no GLPI.';
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

  const isFormValid = config.base_url && (config.api_token || (config.username && config.password));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              GLPI
              {glpiIntegration && (
                <Badge variant={glpiIntegration.is_active ? 'default' : 'secondary'}>
                  {glpiIntegration.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure a integração com GLPI para gestão de chamados
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="glpi-name">Nome da Integração</Label>
          <Input
            id="glpi-name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="GLPI Principal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="glpi-url">URL Base *</Label>
          <Input
            id="glpi-url"
            value={config.base_url}
            onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
            placeholder="https://glpi.exemplo.com/apirest.php"
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: https://glpi.empresa.com/apirest.php
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-base font-medium">Método de Autenticação</Label>
          
          <div className="space-y-2">
            <Label htmlFor="glpi-token">Token de API (recomendado)</Label>
            <Input
              id="glpi-token"
              type="password"
              value={config.api_token}
              onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••"
            />
            <p className="text-xs text-muted-foreground">
              Token gerado no GLPI: Configuração → API → Chaves de API
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">ou</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="glpi-username">Usuário</Label>
              <Input
                id="glpi-username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="glpi-password">Senha</Label>
              <Input
                id="glpi-password"
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
            <Label htmlFor="glpi-active">Integração Ativa</Label>
            <p className="text-sm text-muted-foreground">
              Ative para habilitar a integração com GLPI
            </p>
          </div>
          <Switch
            id="glpi-active"
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
            {glpiIntegration ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Como configurar:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Acesse o GLPI como administrador</li>
            <li>• Vá em Configuração → API → Configuração geral</li>
            <li>• Ative a API REST do GLPI</li>
            <li>• Crie um token de API ou use usuário/senha</li>
            <li>• Use o endpoint correto: /apirest.php</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
