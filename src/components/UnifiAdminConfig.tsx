import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, Wifi, AlertTriangle } from 'lucide-react';

export const UnifiAdminConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  
  const unifiIntegration = integrations?.find(integration => integration.type === 'unifi');

  const [formData, setFormData] = useState({
    name: unifiIntegration?.name || 'Controladora UNIFI',
    base_url: unifiIntegration?.base_url || '',
    username: unifiIntegration?.username || '',
    password: unifiIntegration?.password || '',
    api_token: unifiIntegration?.api_token || '',
    is_active: unifiIntegration?.is_active ?? true,
  });

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
      type: 'unifi' as const,
      name: formData.name,
      base_url: formData.base_url,
      username: formData.username,
      password: formData.password,
      api_token: formData.api_token || null,
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
      if (unifiIntegration) {
        await updateIntegration.mutateAsync({ id: unifiIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração da UNIFI foi salva com sucesso.",
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
          <Wifi className="h-6 w-6" />
          Configuração da Controladora UNIFI
        </CardTitle>
        <CardDescription>
          Configure a integração com a controladora UNIFI para gerenciamento de rede WiFi.
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
              placeholder="Ex: Controladora UNIFI"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL da Controladora *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://192.168.1.1:8443"
            />
            <p className="text-sm text-gray-500 mt-1">
              URL completa da controladora UNIFI (incluindo porta)
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

          <div>
            <Label htmlFor="api_token">Site ID</Label>
            <Input
              id="api_token"
              value={formData.api_token}
              onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              placeholder="default"
            />
            <p className="text-sm text-gray-500 mt-1">
              ID do site na controladora (geralmente "default")
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label htmlFor="is_active">Integração Ativa</Label>
              <p className="text-sm text-gray-500">
                Ative para habilitar o gerenciamento WiFi
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
          ) : unifiIntegration ? (
            'Atualizar Configuração'
          ) : (
            'Salvar Configuração'
          )}
        </Button>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuração necessária:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Acesse a controladora UNIFI</li>
              <li>• Crie um usuário com permissões administrativas</li>
              <li>• Configure certificado SSL se necessário</li>
              <li>• Identifique o Site ID correto</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};