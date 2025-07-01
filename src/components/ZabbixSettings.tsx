
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/hooks/useIntegrations';
import { validateZabbixConnection } from '@/hooks/useZabbixValidation';
import { ZabbixErrorDialog } from './ZabbixErrorDialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, Settings, CheckCircle, AlertTriangle } from 'lucide-react';

export const ZabbixSettings = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  const [isValidating, setIsValidating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [zabbixError, setZabbixError] = useState<{ error: string; details: string } | null>(null);

  const zabbixIntegration = integrations?.find(integration => integration.type === 'zabbix');

  const [formData, setFormData] = useState({
    name: zabbixIntegration?.name || 'Zabbix Monitoramento',
    base_url: zabbixIntegration?.base_url || '',
    username: zabbixIntegration?.username || '',
    password: zabbixIntegration?.password || '',
    is_active: zabbixIntegration?.is_active ?? true,
  });

  const handleTestConnection = async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha URL Base, Nome de Usuário e Senha para testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setConnectionStatus('idle');

    const validation = await validateZabbixConnection(
      formData.base_url,
      formData.username,
      formData.password
    );

    setIsValidating(false);

    if (validation.isValid) {
      setConnectionStatus('success');
      toast({
        title: "Conexão bem-sucedida!",
        description: "A conexão com o Zabbix foi estabelecida com sucesso.",
      });
    } else {
      setConnectionStatus('error');
      if (validation.error && validation.details) {
        setZabbixError({
          error: validation.error,
          details: validation.details
        });
      }
      toast({
        title: `Erro de Conexão: ${validation.error}`,
        description: "Veja os detalhes no popup que foi aberto.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Test connection before saving
    setIsValidating(true);
    const validation = await validateZabbixConnection(
      formData.base_url,
      formData.username,
      formData.password
    );
    setIsValidating(false);

    if (!validation.isValid) {
      if (validation.error && validation.details) {
        setZabbixError({
          error: validation.error,
          details: validation.details
        });
      }
      toast({
        title: `Erro de Conexão: ${validation.error}`,
        description: "Corrija os erros antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    const integrationData = {
      type: 'zabbix' as const,
      name: formData.name,
      base_url: formData.base_url,
      username: formData.username,
      password: formData.password,
      is_active: formData.is_active,
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

    if (zabbixIntegration) {
      updateIntegration.mutate({ id: zabbixIntegration.id, updates: integrationData });
    } else {
      createIntegration.mutate(integrationData);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return { text: 'Conexão bem-sucedida', color: 'text-green-600' };
      case 'error':
        return { text: 'Falha na conexão', color: 'text-red-600' };
      default:
        return { text: 'Não testado', color: 'text-gray-500' };
    }
  };

  const statusInfo = getConnectionStatusText();

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configurações do Zabbix
            </CardTitle>
            <CardDescription>
              Configure a conexão com seu servidor Zabbix para monitoramento em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border">
              {getConnectionStatusIcon()}
              <div>
                <p className="font-medium">Status da Conexão</p>
                <p className={`text-sm ${statusInfo.color}`}>{statusInfo.text}</p>
              </div>
            </div>

            {/* Configuration Form */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nome de Usuário *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Admin"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
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

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleTestConnection}
                disabled={isValidating}
                variant="outline"
                className="flex-1"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isValidating || createIntegration.isPending || updateIntegration.isPending}
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

            {/* Help Information */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dicas importantes:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Certifique-se de que o usuário tem permissões de API no Zabbix</li>
                  <li>• A URL deve ser acessível pela rede onde este sistema está rodando</li>
                  <li>• Teste a conexão antes de salvar para evitar problemas</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Error Dialog */}
      <ZabbixErrorDialog
        isOpen={!!zabbixError}
        onClose={() => setZabbixError(null)}
        error={zabbixError?.error || ''}
        details={zabbixError?.details || ''}
      />
    </>
  );
};
