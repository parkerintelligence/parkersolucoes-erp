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
    console.log('GoogleDrive integration changed:', googleDriveIntegration);
    if (googleDriveIntegration) {
      console.log('Updating form with integration data:', {
        name: googleDriveIntegration.name,
        api_token: googleDriveIntegration.api_token,
        password: googleDriveIntegration.password,
        is_active: googleDriveIntegration.is_active
      });
      setFormData({
        name: googleDriveIntegration.name || 'Google Drive Principal',
        client_id: googleDriveIntegration.api_token || '',
        client_secret: googleDriveIntegration.password || '',
        is_active: googleDriveIntegration.is_active ?? true,
      });
    } else {
      console.log('No GoogleDrive integration found, resetting form');
      setFormData({
        name: 'Google Drive Principal',
        client_id: '',
        client_secret: '',
        is_active: true,
      });
    }
  }, [googleDriveIntegration]);

  const handleAuthCode = async (authCode: string) => {
    setIsLoading(true);
    try {
      console.log('Processing authorization code:', authCode.substring(0, 10) + '...');
      
      // Buscar a integração atualizada
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get('state');
      const targetIntegration = integrations?.find(i => i.id === state && i.type === 'google_drive');
      
      if (!targetIntegration) {
        throw new Error('Integração não encontrada');
      }

      console.log('Invoking google-drive-proxy for authorization...');
      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: {
          action: 'authorize',
          authCode,
          integrationId: targetIntegration.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro na função de autorização');
      }

      if (data?.error) {
        console.error('Authorization error from function:', data.error);
        throw new Error(data.error);
      }

      console.log('Authorization successful:', data);
      
      toast({
        title: "Autorização realizada!",
        description: "Conta Google Drive conectada com sucesso.",
      });
      
      // Aguardar um pouco antes de recarregar para garantir que os dados foram salvos
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: "Erro na autorização",
        description: error.message || "Falha ao conectar com o Google Drive. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Detectar callback OAuth automaticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    console.log('OAuth callback detection:', { authCode: !!authCode, state, error });
    
    if (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Erro na autorização",
        description: "A autorização foi cancelada ou falhou. Tente novamente.",
        variant: "destructive"
      });
      // Limpar URL
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }
    
    if (authCode && state) {
      console.log('Processing OAuth callback with state:', state);
      // Verificar se state corresponde a alguma integração
      const targetIntegration = integrations?.find(i => i.id === state && i.type === 'google_drive');
      
      if (targetIntegration) {
        console.log('Found matching integration for state:', targetIntegration.id);
        handleAuthCode(authCode);
        // Limpar URL
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        console.warn('No matching integration found for state:', state);
      }
    }
  }, [integrations]);

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

  const validateCredentials = () => {
    if (!formData.client_id) {
      toast({
        title: "Client ID necessário",
        description: "Configure o Client ID antes de autorizar.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.client_secret) {
      toast({
        title: "Client Secret necessário", 
        description: "Configure o Client Secret antes de autorizar.",
        variant: "destructive"
      });
      return false;
    }

    // Validate Client ID format (Google Client IDs typically end with .googleusercontent.com)
    if (!formData.client_id.includes('.googleusercontent.com')) {
      toast({
        title: "Client ID inválido",
        description: "O Client ID deve ter o formato correto do Google Cloud Console (termina com .googleusercontent.com).",
        variant: "destructive"
      });
      return false;
    }

    return true;
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

    // Validate credentials before attempting authorization
    if (!validateCredentials()) {
      return;
    }

    try {
      const clientId = googleDriveIntegration.api_token;
      const redirectUri = `${window.location.origin}/admin`;
      
      console.log('Starting OAuth flow with:', {
        clientId: clientId?.substring(0, 10) + '...',
        redirectUri,
        integrationId: googleDriveIntegration.id
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(googleDriveIntegration.id)}`;

      console.log('Redirecting to Google OAuth URL');
      
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para autorizar o Google Drive.",
      });

      // Small delay to show the toast before redirect
      setTimeout(() => {
        window.location.href = authUrl;
      }, 500);

    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      toast({
        title: "Erro na autorização",
        description: "Erro ao iniciar o processo de autorização. Verifique as credenciais.",
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
    // Verificar se tem configuração básica (Client ID e Secret)
    if (!googleDriveIntegration.api_token || !googleDriveIntegration.password) {
      return <Badge variant="outline">Configuração incompleta</Badge>;
    }
    // Verificar se tem tokens de acesso
    if (googleDriveIntegration.webhook_url) {
      return <Badge variant="default" className="bg-green-600">Autorizado</Badge>;
    }
    return <Badge variant="outline">Configurado - Aguardando autorização</Badge>;
  };

  const getConnectionIcon = () => {
    if (!googleDriveIntegration || !googleDriveIntegration.is_active) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    // Verificar se tem configuração básica
    if (!googleDriveIntegration.api_token || !googleDriveIntegration.password) {
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
            <Button 
              variant="outline" 
              onClick={handleAuthorize} 
              disabled={isLoading}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {googleDriveIntegration.webhook_url ? 'Re-autorizar Conta Google' : 'Autorizar Conta Google'}
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>🔧 Instruções para corrigir o erro "deleted_client":</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
            <li><strong>CRIE UM NOVO PROJETO</strong> (não reutilize projetos antigos)</li>
            <li>Vá em "APIs e Serviços" → "Biblioteca" e ative a <strong>Google Drive API</strong></li>
            <li>Configure a <strong>Tela de Consentimento OAuth</strong>:</li>
            <li className="ml-4">• Tipo de usuário: <strong>Externo</strong></li>
            <li className="ml-4">• Adicione domínios autorizados: <code>lovableproject.com</code> e <code>lovable.app</code></li>
            <li className="ml-4">• Escopos: <code>https://www.googleapis.com/auth/drive</code></li>
            <li>Vá em "APIs e Serviços" → "Credenciais"</li>
            <li>Clique em "Criar credenciais" → "ID do cliente OAuth 2.0"</li>
            <li>Tipo de aplicação: <strong>Aplicação da Web</strong></li>
            <li>Nome: <strong>Gestão TI - Google Drive</strong></li>
            <li><strong>URLs de redirecionamento autorizados (COPIE EXATAMENTE):</strong></li>
            <li className="ml-4 font-mono text-xs bg-gray-100 p-1 rounded">
              https://f4440219-dd51-4101-bb5d-8216b89db483.lovableproject.com/admin
            </li>
            <li className="ml-4 font-mono text-xs bg-gray-100 p-1 rounded">
              https://id-preview--f4440219-dd51-4101-bb5d-8216b89db483.lovable.app/admin
            </li>
            <li className="ml-4 font-mono text-xs bg-gray-100 p-1 rounded">
              http://localhost:3000/admin
            </li>
            <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> e cole nos campos acima</li>
            <li><strong>Aguarde 5-10 minutos</strong> para as configurações se propagarem</li>
            <li>Clique em "Salvar Configuração" e depois "Autorizar Conta Google"</li>
          </ol>
          
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-xs">
              <strong>🚨 Erro "deleted_client":</strong> Isso acontece quando:
              <br />• O Client ID está incorreto ou foi deletado
              <br />• O projeto no Google Cloud foi removido
              <br />• As URLs de redirecionamento não estão configuradas corretamente
              <br /><strong>Solução:</strong> Crie um NOVO projeto no Google Cloud Console seguindo as instruções acima.
            </p>
          </div>
          
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-xs">
              <strong>💡 Dica:</strong> O Client ID deve terminar com <code>.googleusercontent.com</code> 
              (ex: 123456789-abc123.apps.googleusercontent.com)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};