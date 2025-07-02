import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useIntegrations, Integration } from '@/hooks/useIntegrations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Cloud, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export const GoogleDriveAdminConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  const [isLoading, setIsLoading] = useState(false);

  const googleDriveIntegration = integrations?.find(
    (integration) => integration.type === 'google_drive'
  );

  const [formData, setFormData] = useState({
    name: 'Google Drive Principal',
    client_id: '',
    client_secret: '',
    is_active: true,
  });

  // Atualizar o formulário quando a integração for carregada
  useEffect(() => {
    if (googleDriveIntegration) {
      setFormData({
        name: googleDriveIntegration.name || 'Google Drive Principal',
        client_id: googleDriveIntegration.api_token || '',
        client_secret: googleDriveIntegration.password || '',
        is_active: googleDriveIntegration.is_active ?? true,
      });
    }
  }, [googleDriveIntegration]);

  const handleSave = async () => {
    if (!formData.name || !formData.client_id || !formData.client_secret) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const integrationData = {
        type: 'google_drive' as const,
        name: formData.name,
        base_url: 'https://www.googleapis.com/drive/v3',
        api_token: formData.client_id, // Client ID público
        password: formData.client_secret, // Client Secret privado
        is_active: formData.is_active,
        webhook_url: null,
        phone_number: null,
        username: null,
        region: null,
        bucket_name: null,
        port: null,
        directory: null,
        passive_mode: null,
        use_ssl: null,
        keep_logged: null,
      };

      console.log('Saving Google Drive integration:', {
        type: integrationData.type,
        name: integrationData.name,
        hasApiToken: !!integrationData.api_token,
        hasPassword: !!integrationData.password,
        apiTokenLength: integrationData.api_token?.length || 0,
        passwordLength: integrationData.password?.length || 0
      });

      if (googleDriveIntegration) {
        console.log('Updating existing integration:', googleDriveIntegration.id);
        await updateIntegration.mutateAsync({
          id: googleDriveIntegration.id,
          updates: integrationData
        });
      } else {
        console.log('Creating new integration');
        await createIntegration.mutateAsync(integrationData);
      }
      
      console.log('Google Drive integration saved successfully');
    } catch (error) {
      console.error('Error saving Google Drive integration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!googleDriveIntegration) {
      toast({
        title: "Erro",
        description: "Salve a configuração primeiro antes de autorizar.",
        variant: "destructive"
      });
      return;
    }

    if (!googleDriveIntegration.api_token) {
      toast({
        title: "Erro",
        description: "Client ID não configurado. Configure primeiro no formulário acima.",
        variant: "destructive"
      });
      return;
    }

    // Generate OAuth URL usando o Client ID salvo na integração
    const clientId = googleDriveIntegration.api_token;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent('urn:ietf:wg:oauth:2.0:oob')}&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    // Open OAuth window
    const authWindow = window.open(authUrl, 'google-auth', 'width=500,height=600');
    
    toast({
      title: "Autorização necessária",
      description: "Uma nova janela foi aberta. Complete a autorização e cole o código aqui.",
    });

    // Prompt for authorization code
    setTimeout(() => {
      const authCode = prompt('Cole o código de autorização do Google aqui:');
      if (authCode) {
        handleAuthCode(authCode);
      }
      authWindow?.close();
    }, 5000);
  };

  const handleAuthCode = async (authCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: {
          action: 'authorize',
          authCode,
          integrationId: googleDriveIntegration?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Autorização realizada!",
        description: "Conta Google Drive conectada com sucesso.",
      });
    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: "Erro na autorização",
        description: "Falha ao conectar com o Google Drive. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = () => {
    if (!googleDriveIntegration) {
      return <Badge variant="secondary">Não configurado</Badge>;
    }
    if (!googleDriveIntegration.is_active) {
      return <Badge variant="destructive">Inativo</Badge>;
    }
    // Verificar se tem tokens de acesso
    if (googleDriveIntegration.webhook_url) {
      return <Badge variant="default" className="bg-green-600">Autorizado</Badge>;
    }
    return <Badge variant="outline">Configurado - Não autorizado</Badge>;
  };

  const getConnectionIcon = () => {
    if (!googleDriveIntegration || !googleDriveIntegration.is_active) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    // Verificar se tem access token
    if (googleDriveIntegration.webhook_url) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-orange-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          <CardTitle>Google Drive</CardTitle>
          {getConnectionIcon()}
          {getStatusBadge()}
        </div>
        <CardDescription>
          Configure a integração com Google Drive para upload e download de arquivos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Integração</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Google Drive Principal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              placeholder="Client ID do Google Cloud Console"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_secret">Client Secret</Label>
            <Input
              id="client_secret"
              type="password"
              value={formData.client_secret}
              onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
              placeholder="Client Secret do Google Cloud Console"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Integração ativa</Label>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configuração
          </Button>
          
          {googleDriveIntegration && (
            <Button variant="outline" onClick={handleAuthorize}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Autorizar Conta Google
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Instruções:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Acesse o Google Cloud Console</li>
            <li>Crie um projeto ou use um existente</li>
            <li>Ative a Google Drive API</li>
            <li>Crie credenciais OAuth 2.0</li>
            <li>Configure as URLs de redirect autorizadas</li>
            <li>Copie o Client ID e Client Secret aqui</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};