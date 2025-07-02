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

  // Detectar callback OAuth automaticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (authCode && state && googleDriveIntegration) {
      handleAuthCode(authCode);
      // Limpar URL
      window.history.replaceState(null, '', window.location.pathname);
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
    const redirectUri = window.location.origin; // Usar origem atual ao invés de OOB
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(JSON.stringify({ integrationId: googleDriveIntegration.id }))}`;

    // Verificar se já estamos processando um callback
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode) {
      // Já estamos em um callback, processar
      await handleAuthCode(authCode);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Redirecionar para autorização
    window.location.href = authUrl;
    
    toast({
      title: "Redirecionando...",
      description: "Você será redirecionado para autorizar o Google Drive.",
    });
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
          <p><strong>Instruções para Google Cloud Console:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
            <li>Crie um projeto ou selecione um existente</li>
            <li>Vá em "APIs e Serviços" → "Biblioteca" e ative a <strong>Google Drive API</strong></li>
            <li>Vá em "APIs e Serviços" → "Credenciais"</li>
            <li>Clique em "Criar credenciais" → "ID do cliente OAuth 2.0"</li>
            <li>Tipo de aplicação: <strong>Aplicação da Web</strong></li>
            <li>Nome: <strong>Gestão TI - Google Drive</strong></li>
            <li><strong>URLs de redirecionamento autorizados:</strong></li>
            <li className="ml-4 font-mono text-xs bg-gray-100 p-1 rounded">
              {window.location.origin}
            </li>
            <li className="ml-4 font-mono text-xs bg-gray-100 p-1 rounded">
              http://localhost:3000 (para desenvolvimento)
            </li>
            <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> e cole nos campos acima</li>
            <li>Clique em "Salvar Configuração" e depois "Autorizar Conta Google"</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-xs">
              <strong>⚠️ Importante:</strong> Se você receber "Acesso bloqueado", verifique se as URLs de redirecionamento 
              estão configuradas exatamente como mostrado acima no Google Cloud Console.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};