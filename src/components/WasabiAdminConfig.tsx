import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { Loader2, Cloud, AlertTriangle, CheckCircle } from 'lucide-react';

export const WasabiAdminConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  
  const wasabiIntegration = integrations?.find(integration => integration.type === 'wasabi');

  const [formData, setFormData] = useState({
    name: wasabiIntegration?.name || 'Wasabi Cloud Storage',
    base_url: wasabiIntegration?.base_url || 'https://s3.wasabisys.com',
    api_token: wasabiIntegration?.api_token || '',
    password: wasabiIntegration?.password || '',
    region: wasabiIntegration?.region || 'us-east-1',
    bucket_name: wasabiIntegration?.bucket_name || '',
    is_active: wasabiIntegration?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!formData.api_token || !formData.password || !formData.bucket_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const integrationData = {
      type: 'wasabi' as const,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token, // Access Key
      password: formData.password, // Secret Key
      region: formData.region,
      bucket_name: formData.bucket_name,
      is_active: formData.is_active,
      username: null,
      webhook_url: null,
      phone_number: null,
      port: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null,
    };

    try {
      if (wasabiIntegration) {
        await updateIntegration.mutateAsync({ id: wasabiIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do Wasabi foi salva com sucesso.",
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
          <Cloud className="h-6 w-6" />
          Configuração do Wasabi
        </CardTitle>
        <CardDescription>
          Configure a integração com o Wasabi Cloud Storage para armazenamento de arquivos.
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
              placeholder="Ex: Wasabi Cloud Storage"
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base do Serviço</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://s3.wasabisys.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="api_token">Access Key *</Label>
              <Input
                id="api_token"
                type="password"
                value={formData.api_token}
                onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                placeholder="••••••••••••••••••••"
              />
            </div>
            <div>
              <Label htmlFor="password">Secret Key *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="region">Região</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="us-east-1"
              />
            </div>
            <div>
              <Label htmlFor="bucket_name">Nome do Bucket *</Label>
              <Input
                id="bucket_name"
                value={formData.bucket_name}
                onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                placeholder="meu-bucket-backup"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label htmlFor="is_active">Integração Ativa</Label>
              <p className="text-sm text-gray-500">
                Ative para habilitar o armazenamento
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
          ) : wasabiIntegration ? (
            'Atualizar Configuração'
          ) : (
            'Salvar Configuração'
          )}
        </Button>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como configurar:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Acesse o Wasabi Console</li>
              <li>• Vá em Access Keys e crie uma nova chave</li>
              <li>• Configure permissões adequadas para o bucket</li>
              <li>• Use a região correta do seu bucket</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};