
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Headphones, ExternalLink } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useGLPI } from '@/hooks/useGLPI';
import { toast } from '@/hooks/use-toast';

interface GLPIConfig {
  name: string;
  base_url: string;
  api_token: string;
  username: string;
  password: string;
}

export const GLPIConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  const { initSession } = useGLPI();
  const [config, setConfig] = useState<GLPIConfig>({
    name: 'GLPI Integration',
    base_url: '',
    api_token: '',
    username: '',
    password: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const glpiIntegration = integrations?.find(int => int.type === 'glpi');

  // Load existing configuration
  useEffect(() => {
    if (glpiIntegration) {
      setConfig({
        name: glpiIntegration.name,
        base_url: glpiIntegration.base_url,
        api_token: glpiIntegration.api_token || '',
        username: glpiIntegration.username || '',
        password: glpiIntegration.password || ''
      });
    }
  }, [glpiIntegration]);

  const testConnection = async () => {
    if (!config.base_url || !config.api_token || !config.username || !config.password) {
      toast({
        title: "❌ Configuração Incompleta",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    
    try {
      const cleanUrl = config.base_url.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/apirest.php/initSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'App-Token': config.api_token,
          'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('success');
        toast({
          title: "✅ Conexão Bem-sucedida",
          description: "GLPI conectado com sucesso!",
        });
        
        // Kill session after test
        await fetch(`${cleanUrl}/apirest.php/killSession`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'App-Token': config.api_token,
            'Session-Token': data.session_token,
          },
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('GLPI connection test failed:', error);
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
        type: 'glpi' as const,
        name: config.name,
        base_url: config.base_url,
        api_token: config.api_token,
        username: config.username,
        password: config.password,
        webhook_url: null, // Will store session token after init
        phone_number: null,
        region: null,
        bucket_name: null,
        directory: null,
        port: null,
        passive_mode: null,
        use_ssl: null,
        keep_logged: null,
        is_active: true,
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
        title: "✅ Configuração Salva",
        description: "Integração GLPI configurada com sucesso!",
      });

      // Initialize session after saving
      setTimeout(() => {
        initSession.mutate();
      }, 1000);
    } catch (error) {
      console.error('Error saving GLPI configuration:', error);
      toast({
        title: "❌ Erro ao Salvar",
        description: "Erro ao salvar configuração do GLPI",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-blue-600" />
          Configuração GLPI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        {glpiIntegration && (
          <div className="flex items-center gap-2">
            <Badge className={glpiIntegration.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {glpiIntegration.is_active ? 'Ativo' : 'Inativo'}
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
              placeholder="GLPI Integration"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL do GLPI</Label>
            <Input
              id="base_url"
              value={config.base_url}
              onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
              placeholder="https://seu-glpi.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL base do seu servidor GLPI
            </p>
          </div>

          <div>
            <Label htmlFor="api_token">App Token</Label>
            <Input
              id="api_token"
              type="password"
              value={config.api_token}
              onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
              placeholder="Token da aplicação GLPI"
            />
            <p className="text-xs text-gray-500 mt-1">
              Token gerado em: Configurar → Geral → API
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="usuario@glpi"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="Senha do usuário"
              />
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isTestingConnection || !config.base_url || !config.api_token || !config.username || !config.password}
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
          disabled={!config.base_url || !config.api_token || !config.username || !config.password || createIntegration.isPending || updateIntegration.isPending}
          className="w-full"
        >
          {(createIntegration.isPending || updateIntegration.isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {glpiIntegration ? 'Atualizar Configuração' : 'Salvar Configuração'}
        </Button>

        {/* Help Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Como configurar:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Acesse o GLPI como administrador</li>
            <li>2. Vá em Configurar → Geral → API</li>
            <li>3. Ative a API REST e gere um App Token</li>
            <li>4. Configure um usuário com permissões adequadas</li>
            <li>5. Use as credenciais aqui e teste a conexão</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
