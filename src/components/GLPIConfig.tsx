import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Headphones, ExternalLink, Info, Shield, Key, Settings2, Save } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from '@/hooks/use-toast';

interface GLPIConfig {
  name: string;
  base_url: string;
  api_token: string;
  username: string;
  password: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export const GLPIConfig = () => {
  const { data: integrations, createIntegration, updateIntegration } = useIntegrations();
  const { initSession } = useGLPIExpanded();
  const [config, setConfig] = useState<GLPIConfig>({
    name: 'GLPI Integration',
    base_url: '',
    api_token: '',
    username: '',
    password: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [lastError, setLastError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const glpiIntegration = integrations?.find(int => int.type === 'glpi');

  // Load existing configuration
  useEffect(() => {
    if (glpiIntegration) {
      console.log('Loading GLPI integration config:', {
        id: glpiIntegration.id,
        name: glpiIntegration.name,
        base_url: glpiIntegration.base_url,
        hasApiToken: !!glpiIntegration.api_token,
        apiTokenLength: glpiIntegration.api_token?.length || 0,
        hasUsername: !!glpiIntegration.username,
        hasPassword: !!glpiIntegration.password,
        passwordLength: glpiIntegration.password?.length || 0
      });
      
      setConfig({
        name: glpiIntegration.name,
        base_url: glpiIntegration.base_url,
        api_token: glpiIntegration.api_token || '',
        username: glpiIntegration.username || '',
        password: glpiIntegration.password || ''
      });
    }
  }, [glpiIntegration]);

  // Validação em tempo real
  const validateConfig = (configToValidate: GLPIConfig): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!configToValidate.base_url) {
      errors.push({ field: 'base_url', message: 'URL do GLPI é obrigatória' });
    } else if (!configToValidate.base_url.match(/^https?:\/\/.+/)) {
      errors.push({ field: 'base_url', message: 'URL deve começar com http:// ou https://' });
    }

    if (!configToValidate.api_token) {
      errors.push({ field: 'api_token', message: 'App Token é obrigatório' });
    } else if (configToValidate.api_token.length < 16) {
      errors.push({ field: 'api_token', message: 'App Token parece inválido (muito curto)' });
    }

    if (!configToValidate.password) {
      errors.push({ field: 'password', message: 'User Token ou Senha é obrigatório' });
    }

    if (configToValidate.username && !configToValidate.password) {
      errors.push({ field: 'password', message: 'Senha é obrigatória quando usuário é informado' });
    }

    return errors;
  };

  // Atualizar validação quando config muda
  useEffect(() => {
    const errors = validateConfig(config);
    setValidationErrors(errors);
  }, [config]);

  const diagnoseError = (error: any, response?: Response): string => {
    const errorMessage = error.message || error.toString();
    
    // Diagnóstico específico para erro 400
    if (errorMessage.includes('400')) {
      if (!config.api_token) {
        return 'Erro 400: App Token não configurado. Configure o App Token no GLPI.';
      }
      if (config.api_token.length < 16) {
        return 'Erro 400: App Token parece inválido. Verifique se o token foi copiado corretamente.';
      }
      return 'Erro 400: Parâmetros inválidos. Verifique se a API REST está habilitada no GLPI e se o App Token está correto.';
    }

    // Diagnóstico específico para erro 401
    if (errorMessage.includes('401')) {
      if (!config.password) {
        return 'Erro 401: Credenciais não configuradas. Configure um User Token ou usuário/senha.';
      }
      return 'Erro 401: Credenciais inválidas. Verifique se o User Token ou usuário/senha estão corretos.';
    }

    // Diagnóstico para outros erros
    if (errorMessage.includes('404')) {
      return 'Erro 404: Endpoint não encontrado. Verifique se a URL do GLPI está correta e se a API REST está habilitada.';
    }

    if (errorMessage.includes('500')) {
      return 'Erro 500: Erro interno do servidor GLPI. Verifique os logs do GLPI.';
    }

    return `Erro: ${errorMessage}`;
  };

  const testConnection = async () => {
    // Validar antes de testar
    const errors = validateConfig(config);
    if (errors.length > 0) {
      toast({
        title: "❌ Configuração Inválida",
        description: errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    setLastError('');
    
    try {
      const cleanUrl = config.base_url.replace(/\/$/, '');
      console.log('🔍 Testando conexão GLPI:', {
        url: cleanUrl,
        hasAppToken: !!config.api_token,
        appTokenLength: config.api_token?.length || 0,
        hasUserToken: !!config.password && !config.username,
        hasBasicAuth: !!config.username && !!config.password,
        authMethod: config.password && !config.username ? 'User Token' : 'Basic Auth'
      });

      let response: Response;
      let authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'App-Token': config.api_token,
      };

      // Método 1: Tentar com User Token (recomendado)
      if (config.password && !config.username) {
        console.log('🔑 Tentando autenticação com User Token...');
        authHeaders['Authorization'] = `user_token ${config.password}`;
        
        response = await fetch(`${cleanUrl}/apirest.php/initSession`, {
          method: 'POST',
          headers: authHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Autenticação com User Token bem-sucedida');
          setConnectionStatus('success');
          toast({
            title: "✅ Conexão Bem-sucedida",
            description: "GLPI conectado com User Token!",
          });
          
          // Kill session after test
          await fetch(`${cleanUrl}/apirest.php/killSession`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'App-Token': config.api_token,
              'Session-Token': data.session_token,
            },
          });
          return;
        } else {
          const errorText = await response.text();
          console.log('❌ Falha com User Token:', response.status, errorText);
          throw new Error(`User Token falhou: ${response.status} - ${errorText}`);
        }
      }

      // Método 2: Tentar com Basic Auth (fallback)
      if (config.username && config.password) {
        console.log('🔑 Tentando autenticação com Basic Auth...');
        authHeaders['Authorization'] = `Basic ${btoa(`${config.username}:${config.password}`)}`;
        
        response = await fetch(`${cleanUrl}/apirest.php/initSession`, {
          method: 'POST',
          headers: authHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Autenticação com Basic Auth bem-sucedida');
          setConnectionStatus('success');
          toast({
            title: "✅ Conexão Bem-sucedida",
            description: "GLPI conectado com Basic Auth!",
          });
          
          // Kill session after test
          await fetch(`${cleanUrl}/apirest.php/killSession`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'App-Token': config.api_token,
              'Session-Token': data.session_token,
            },
          });
          return;
        } else {
          const errorText = await response.text();
          console.log('❌ Falha com Basic Auth:', response.status, errorText);
          throw new Error(`Basic Auth falhou: ${response.status} - ${errorText}`);
        }
      }

      throw new Error('Nenhum método de autenticação configurado corretamente');
    } catch (error) {
      console.error('❌ Erro no teste de conexão GLPI:', error);
      const diagnosticMessage = diagnoseError(error);
      setConnectionStatus('error');
      setLastError(diagnosticMessage);
      toast({
        title: "❌ Falha na Conexão",
        description: diagnosticMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    // Validar antes de salvar
    const errors = validateConfig(config);
    if (errors.length > 0) {
      toast({
        title: "❌ Configuração Inválida",
        description: errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('💾 Salvando configuração GLPI:', {
        hasIntegration: !!glpiIntegration,
        integrationId: glpiIntegration?.id,
        configToSave: {
          name: config.name,
          base_url: config.base_url,
          hasApiToken: !!config.api_token,
          apiTokenLength: config.api_token?.length || 0,
          hasUsername: !!config.username,
          hasPassword: !!config.password,
          passwordLength: config.password?.length || 0
        }
      });

      const integrationData = {
        type: 'glpi' as const,
        name: config.name,
        base_url: config.base_url,
        api_token: config.api_token,
        username: config.username || null,
        password: config.password,
        webhook_url: null,
        phone_number: null,
        region: null,
        bucket_name: null,
        directory: null,
        port: null,
        passive_mode: null,
        use_ssl: null,
        keep_logged: null,
        is_active: true,
      };

      if (glpiIntegration) {
        console.log('🔄 Atualizando integração existente...');
        await updateIntegration.mutateAsync({
          id: glpiIntegration.id,
          updates: integrationData
        });
      } else {
        console.log('➕ Criando nova integração...');
        await createIntegration.mutateAsync(integrationData);
      }

      console.log('✅ Configuração salva com sucesso!');
      toast({
        title: "✅ Configuração Salva",
        description: "Integração GLPI configurada com sucesso!",
      });

      // Initialize session after saving
      setTimeout(() => {
        console.log('🚀 Inicializando sessão GLPI...');
        initSession.mutate();
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao salvar configuração GLPI:', error);
      toast({
        title: "❌ Erro ao Salvar",
        description: error.message || "Erro ao salvar configuração do GLPI",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message;
  };

  const isConfigValid = validationErrors.length === 0 && config.base_url && config.api_token && config.password;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-blue-600" />
          Configuração GLPI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        {glpiIntegration && (
          <div className="flex items-center gap-2">
            <Badge className={glpiIntegration.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {glpiIntegration.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            {connectionStatus === 'success' && (
              <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Erro de Conexão
              </Badge>
            )}
            {glpiIntegration.api_token && (
              <Badge className="bg-gray-100 text-gray-800">
                <Save className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            )}
          </div>
        )}

        {/* Error Alert */}
        {lastError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Prerequisites Alert */}
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Pré-requisitos:</strong> Certifique-se de que a API REST está habilitada no GLPI (Configurar → Geral → API) e que você tem permissões adequadas.
          </AlertDescription>
        </Alert>

        {/* Authentication Method Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Métodos de Autenticação:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>🏆 Recomendado:</strong> Use apenas o campo "User Token" (deixe usuário vazio)</li>
                <li><strong>🔄 Alternativo:</strong> Use "Usuário" + "Senha" com credenciais normais</li>
                <li><strong>📋 Para obter User Token:</strong> Perfil do usuário → Chaves de acesso remoto → Gerar</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Integração</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="GLPI Integration"
            />
          </div>

          <div>
            <Label htmlFor="base_url" className="flex items-center gap-2">
              URL do GLPI *
              {getFieldError('base_url') && <AlertCircle className="h-4 w-4 text-red-500" />}
            </Label>
            <Input
              id="base_url"
              value={config.base_url}
              onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
              placeholder="https://seu-glpi.com"
              className={getFieldError('base_url') ? 'border-red-300' : ''}
            />
            {getFieldError('base_url') && (
              <p className="text-xs text-red-600 mt-1">{getFieldError('base_url')}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              URL base do seu servidor GLPI
            </p>
          </div>

          <div>
            <Label htmlFor="api_token" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              App Token *
              {getFieldError('api_token') && <AlertCircle className="h-4 w-4 text-red-500" />}
            </Label>
            <Input
              id="api_token"
              type="password"
              value={config.api_token}
              onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
              placeholder="Token da aplicação GLPI"
              className={getFieldError('api_token') ? 'border-red-300' : ''}
            />
            {getFieldError('api_token') && (
              <p className="text-xs text-red-600 mt-1">{getFieldError('api_token')}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Token gerado em: Configurar → Geral → API → Gerar App Token
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Usuário (opcional)</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="usuario@glpi"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio se usar User Token
              </p>
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                User Token / Senha *
                {getFieldError('password') && <AlertCircle className="h-4 w-4 text-red-500" />}
              </Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="User Token ou Senha"
                className={getFieldError('password') ? 'border-red-300' : ''}
              />
              {getFieldError('password') && (
                <p className="text-xs text-red-600 mt-1">{getFieldError('password')}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                User Token é mais seguro
              </p>
            </div>
          </div>
        </div>

        {/* Validation Summary */}
        {validationErrors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Corrija os seguintes erros:</strong>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Connection */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isTestingConnection || !isConfigValid}
            className="flex-1"
          >
            {isTestingConnection ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
          </Button>

          {connectionStatus === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Conectado
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Erro na conexão
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={saveConfiguration}
          disabled={!isConfigValid || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Settings2 className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Salvando...' : (glpiIntegration ? 'Atualizar Configuração' : 'Salvar Configuração')}
        </Button>

        {/* Enhanced Help Section */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Guia de Configuração Passo-a-Passo
          </h4>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="bg-white p-3 rounded border">
              <h5 className="font-medium text-gray-900 mb-2">1. Habilitar API REST no GLPI</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Acesse o GLPI como administrador</li>
                <li>Vá em <strong>Configurar → Geral → API</strong></li>
                <li>Ative a opção <strong>"Habilitar API REST"</strong></li>
                <li>Defina a URL da API (geralmente automática)</li>
              </ul>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h5 className="font-medium text-gray-900 mb-2">2. Gerar App Token</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Ainda em <strong>Configurar → Geral → API</strong></li>
                <li>Clique em <strong>"Gerar"</strong> na seção App Token</li>
                <li>Copie o token gerado (será usado no campo "App Token")</li>
              </ul>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h5 className="font-medium text-gray-900 mb-2">3. Gerar User Token (Recomendado)</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Vá no seu <strong>Perfil de usuário</strong></li>
                <li>Clique em <strong>"Chaves de acesso remoto"</strong></li>
                <li>Clique em <strong>"Gerar"</strong> para criar um User Token</li>
                <li>Copie o token e use no campo "User Token/Senha"</li>
                <li><strong>Deixe o campo "Usuário" vazio</strong></li>
              </ul>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h5 className="font-medium text-gray-900 mb-2">4. Alternativa: Usuário e Senha</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Se não usar User Token, informe usuário e senha</li>
                <li>Certifique-se de que o usuário tem permissões na API</li>
                <li>User Token é mais seguro que usuário/senha</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Soluções para Problemas Comuns
          </h4>
          <div className="space-y-2 text-sm text-red-800">
            <div><strong>Erro 400:</strong> Verifique se o App Token está correto e se a API REST está habilitada</div>
            <div><strong>Erro 401:</strong> Verifique suas credenciais (User Token ou usuário/senha)</div>
            <div><strong>Erro 404:</strong> Verifique se a URL do GLPI está correta</div>
            <div><strong>Erro 500:</strong> Problema no servidor GLPI - verifique os logs do servidor</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
