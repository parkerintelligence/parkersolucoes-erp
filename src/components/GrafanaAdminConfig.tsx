import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

export const GrafanaAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  
  const grafanaIntegration = integrations?.find(integration => integration.type === 'grafana');

  const [formData, setFormData] = useState({
    name: grafanaIntegration?.name || 'Grafana Dashboards',
    base_url: grafanaIntegration?.base_url || '',
    api_token: grafanaIntegration?.api_token || '',
    username: grafanaIntegration?.username || '',
    password: grafanaIntegration?.password || '',
    is_active: grafanaIntegration?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!formData.base_url || (!formData.api_token && (!formData.username || !formData.password))) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha URL Base e API Token ou usuário/senha.",
        variant: "destructive"
      });
      return;
    }

    const integrationData = {
      type: 'grafana' as const,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token || null,
      username: formData.username || null,
      password: formData.password || null,
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

    try {
      if (grafanaIntegration) {
        await updateIntegration.mutateAsync({ id: grafanaIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do Grafana foi salva com sucesso.",
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
          <BarChart3 className="h-6 w-6" />
          Configuração do Grafana
        </CardTitle>
        <CardDescription>
          Configure a integração com o Grafana para visualização de dashboards.
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
              placeholder="Ex: Grafana Dashboards"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base do Grafana *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://grafana.exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="api_token">API Token</Label>
            <Input
              id="api_token"
              type="password"
              value={formData.api_token}
              onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••"
            />
            <p className="text-sm text-gray-500 mt-1">
              Token de API do Grafana (recomendado)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
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
                Ative para habilitar os dashboards
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
          ) : grafanaIntegration ? (
            'Atualizar Configuração'
          ) : (
            'Salvar Configuração'
          )}
        </Button>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Métodos de autenticação:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>API Token (recomendado):</strong> Mais seguro, gerado no Grafana</li>
              <li>• <strong>Usuário/Senha:</strong> Método alternativo</li>
              <li>• Configure no Grafana: Configuration → API Keys</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
