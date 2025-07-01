import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/hooks/useIntegrations';
import { useMikrotikIntegration } from '@/hooks/useMikrotikIntegration';
import { toast } from '@/hooks/use-toast';
import { Loader2, Router, CheckCircle, AlertTriangle } from 'lucide-react';

export const MikrotikAdminConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  const { testConnection } = useMikrotikIntegration();
  
  const mikrotikIntegration = integrations?.find(integration => integration.type === 'mikrotik' as any);

  const [formData, setFormData] = useState({
    name: mikrotikIntegration?.name || 'Mikrotik RouterOS',
    base_url: mikrotikIntegration?.base_url || '',
    username: mikrotikIntegration?.username || '',
    password: mikrotikIntegration?.password || '',
    port: mikrotikIntegration?.port || 8728,
    is_active: mikrotikIntegration?.is_active ?? true,
  });

  const handleTestConnection = () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha URL, usuário e senha para testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    if (!mikrotikIntegration) {
      toast({
        title: "Salve primeiro",
        description: "Salve a configuração antes de testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    testConnection.mutate({
      base_url: formData.base_url,
      username: formData.username,
      password: formData.password,
      port: formData.port
    });
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

    const integrationData = {
      type: 'mikrotik' as any,
      name: formData.name,
      base_url: formData.base_url,
      username: formData.username,
      password: formData.password,
      port: formData.port,
      is_active: formData.is_active,
      api_token: null,
      webhook_url: null,
      phone_number: null,
      region: null,
      bucket_name: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null,
    };

    try {
      if (mikrotikIntegration) {
        await updateIntegration.mutateAsync({ id: mikrotikIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do Mikrotik foi salva com sucesso.",
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
          <Router className="h-6 w-6" />
          Configuração do Mikrotik
        </CardTitle>
        <CardDescription>
          Configure a conexão com seu RouterOS via API REST.
          Permite monitoramento e gerenciamento de interfaces, recursos e configurações.
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
              placeholder="Ex: Mikrotik RouterOS"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base do RouterOS *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="http://192.168.1.1 ou https://mikrotik.exemplo.com"
            />
            <p className="text-sm text-gray-500 mt-1">
              URL do seu RouterOS (sem /rest no final)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Usuário *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin"
              />
            </div>

            <div>
              <Label htmlFor="port">Porta API</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                placeholder="8728"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••••••••••"
            />
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
            disabled={testConnection.isPending || !mikrotikIntegration}
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
            ) : mikrotikIntegration ? (
              'Atualizar Configuração'
            ) : (
              'Salvar Configuração'
            )}
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Requisitos para API REST:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• RouterOS versão 7.1 ou superior</li>
              <li>• API REST habilitada em System → Users → WWW</li>
              <li>• Usuário com permissões adequadas</li>
              <li>• Porta 80/443 acessível (padrão da API REST)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert>
          <Router className="h-4 w-4" />
          <AlertDescription>
            <strong>Funcionalidades disponíveis:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Monitoramento de interfaces e tráfego</li>
              <li>• Status de recursos (CPU, memória, uptime)</li>
              <li>• Configuração de QoS e firewall</li>
              <li>• Backup automático de configurações</li>
            </ul>
          </AlertDescription>
        </Alert>

        {mikrotikIntegration && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> Configuração encontrada e {mikrotikIntegration.is_active ? 'ativa' : 'inativa'}.
              <br />
              <strong>URL:</strong> {mikrotikIntegration.base_url}
              <br />
              <strong>Usuário:</strong> {mikrotikIntegration.username}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};