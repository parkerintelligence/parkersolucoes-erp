import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, AlertTriangle, CheckCircle } from 'lucide-react';

export const EvolutionAPIAdminConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  
  const evolutionIntegration = integrations?.find(integration => integration.type === 'evolution_api');

  const [formData, setFormData] = useState({
    name: evolutionIntegration?.name || 'Evolution API WhatsApp',
    base_url: evolutionIntegration?.base_url || '',
    api_token: evolutionIntegration?.api_token || '',
    phone_number: evolutionIntegration?.phone_number || '',
    is_active: evolutionIntegration?.is_active ?? true,
  });

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
      type: 'evolution_api' as const,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token,
      phone_number: formData.phone_number || null,
      is_active: formData.is_active,
      username: null,
      password: null,
      webhook_url: null,
      region: null,
      bucket_name: null,
      port: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null,
    };

    try {
      if (evolutionIntegration) {
        await updateIntegration.mutateAsync({ id: evolutionIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração da Evolution API foi salva com sucesso.",
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
          <MessageCircle className="h-6 w-6" />
          Configuração da Evolution API
        </CardTitle>
        <CardDescription>
          Configure a integração com a Evolution API para WhatsApp Business.
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
              placeholder="Ex: Evolution API WhatsApp"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base da API *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://api.evolutionapi.com"
            />
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
          </div>

          <div>
            <Label htmlFor="phone_number">Número do WhatsApp</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="5511999999999"
            />
            <p className="text-sm text-gray-500 mt-1">
              Número com código do país (sem símbolos)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label htmlFor="is_active">Integração Ativa</Label>
              <p className="text-sm text-gray-500">
                Ative para habilitar o WhatsApp
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
          ) : evolutionIntegration ? (
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
              <li>• Configure a instância da Evolution API</li>
              <li>• Obtenha o token de acesso</li>
              <li>• Configure webhooks para receber mensagens</li>
              <li>• Conecte o número do WhatsApp</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};