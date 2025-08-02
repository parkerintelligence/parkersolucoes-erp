import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export const BomControleAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  
  const bomControleIntegration = integrations?.find(integration => integration.type === 'bomcontrole');

  const [formData, setFormData] = React.useState({
    name: bomControleIntegration?.name || 'Bom Controle',
    base_url: bomControleIntegration?.base_url || '',
    api_token: bomControleIntegration?.api_token || '',
    username: bomControleIntegration?.username || '',
    password: bomControleIntegration?.password || '',
    is_active: bomControleIntegration?.is_active ?? true,
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
      type: 'bomcontrole' as const,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token,
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
      if (bomControleIntegration) {
        await updateIntegration.mutateAsync({ id: bomControleIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do Bom Controle foi salva com sucesso.",
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
          <FileText className="h-6 w-6" />
          Configuração do Bom Controle
        </CardTitle>
        <CardDescription>
          Configure a integração com o sistema Bom Controle para gestão empresarial.
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
              placeholder="Ex: Bom Controle"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base do Sistema *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://sistema.bomcontrole.com.br"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario@empresa.com"
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
                Ative para habilitar a sincronização
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
          ) : bomControleIntegration ? (
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
              <li>• Obtenha as credenciais de API no Bom Controle</li>
              <li>• Configure as permissões de acesso necessárias</li>
              <li>• Teste a conexão antes de ativar</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
