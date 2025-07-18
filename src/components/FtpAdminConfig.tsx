import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from 'sonner';
import { Loader2, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';

export const FtpAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  
  const ftpIntegration = integrations?.find(integration => integration.type === 'ftp');

  const [formData, setFormData] = useState({
    name: ftpIntegration?.name || 'Servidor FTP',
    base_url: ftpIntegration?.base_url || '',
    username: ftpIntegration?.username || '',
    password: ftpIntegration?.password || '',
    port: ftpIntegration?.port || 21,
    directory: ftpIntegration?.directory || '/',
    passive_mode: ftpIntegration?.passive_mode ?? true,
    use_ssl: ftpIntegration?.use_ssl ?? false,
    is_active: ftpIntegration?.is_active ?? true,
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
      type: 'ftp' as const,
      name: formData.name,
      base_url: formData.base_url,
      username: formData.username,
      password: formData.password,
      port: formData.port,
      directory: formData.directory,
      passive_mode: formData.passive_mode,
      use_ssl: formData.use_ssl,
      is_active: formData.is_active,
      api_token: null,
      webhook_url: null,
      phone_number: null,
      region: null,
      bucket_name: null,
      keep_logged: null,
    };

    try {
      if (ftpIntegration) {
        await updateIntegration.mutateAsync({ id: ftpIntegration.id, updates: integrationData });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva",
        description: "A configuração do FTP foi salva com sucesso.",
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
          <HardDrive className="h-6 w-6" />
          Configuração do FTP
        </CardTitle>
        <CardDescription>
          Configure a integração com servidor FTP para backup e transferência de arquivos.
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
              placeholder="Ex: Servidor FTP Backup"
            />
          </div>

          <div>
            <Label htmlFor="base_url">Servidor FTP *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="ftp.exemplo.com ou 192.168.1.100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Usuário *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario_ftp"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 21 })}
                placeholder="21"
              />
            </div>
            <div>
              <Label htmlFor="directory">Diretório Inicial</Label>
              <Input
                id="directory"
                value={formData.directory}
                onChange={(e) => setFormData({ ...formData, directory: e.target.value })}
                placeholder="/backups"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="passive_mode">Modo Passivo</Label>
                <p className="text-sm text-gray-500">
                  Recomendado para conexões através de firewall
                </p>
              </div>
              <Switch
                id="passive_mode"
                checked={formData.passive_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, passive_mode: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="use_ssl">Usar SSL/TLS</Label>
                <p className="text-sm text-gray-500">
                  Conexão segura via FTPS
                </p>
              </div>
              <Switch
                id="use_ssl"
                checked={formData.use_ssl}
                onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="is_active">Integração Ativa</Label>
                <p className="text-sm text-gray-500">
                  Ative para habilitar o FTP
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
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
          ) : ftpIntegration ? (
            'Atualizar Configuração'
          ) : (
            'Salvar Configuração'
          )}
        </Button>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Dicas de configuração:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Use modo passivo para conexões através de firewall</li>
              <li>• FTPS (SSL/TLS) é recomendado para segurança</li>
              <li>• Teste a conexão antes de ativar</li>
              <li>• Verifique permissões de escrita no diretório</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
