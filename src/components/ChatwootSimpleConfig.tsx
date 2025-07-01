
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { useChatwootAPI } from '@/hooks/useChatwootAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface ChatwootConfig {
  base_url: string;
  api_token: string;
}

export const ChatwootSimpleConfig = () => {
  const [config, setConfig] = useState<ChatwootConfig>({
    base_url: '',
    api_token: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  
  const { testConnection } = useChatwootAPI(); 
  const { createIntegration, updateIntegration, data: integrations } = useIntegrations();
  
  const existingChatwoot = integrations?.find(int => int.type === 'chatwoot');

  const validateConfiguration = async () => {
    if (!config.base_url || !config.api_token) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a URL e o Token de API",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Clean URL - remove trailing slashes and common paths
      let cleanUrl = config.base_url.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Remove common suffixes that users might add
      cleanUrl = cleanUrl.replace(/\/(app|login|api.*)?$/, '');
      
      console.log('Testing Chatwoot connection with:', { cleanUrl, token: '***' });
      
      await testConnection.mutateAsync({
        base_url: cleanUrl,
        api_token: config.api_token
      });
      
      const result = {
        status: 'success',
        url: cleanUrl,
        message: 'Conexão estabelecida com sucesso!'
      };
      
      setValidationResult(result);
      setConfig(prev => ({ ...prev, base_url: cleanUrl }));
      
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult({
        status: 'error',
        message: error.message || 'Erro na validação'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveConfiguration = async () => {
    if (!validationResult || validationResult.status !== 'success') {
      toast({
        title: "Validação necessária",
        description: "Teste a conexão antes de salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      const integrationData = {
        type: 'chatwoot' as const,
        name: 'Chatwoot WhatsApp',
        base_url: config.base_url,
        api_token: config.api_token,
        is_active: true
      };

      if (existingChatwoot) {
        await updateIntegration.mutateAsync({
          id: existingChatwoot.id,
          updates: integrationData
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "✅ Configuração Salva",
        description: "Chatwoot configurado com sucesso!",
      });

    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao salvar configuração",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-green-600" />
          Configuração Simples do Chatwoot
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como configurar:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Cole a URL do seu Chatwoot (ex: https://app.chatwoot.com)</li>
                <li>Cole o Token de API (encontre em Configurações → Integrações → API)</li>
                <li>Clique em "Testar Conexão" para validar</li>
                <li>Se o teste passar, clique em "Salvar Configuração"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="chatwoot-url">URL do Chatwoot</Label>
            <Input
              id="chatwoot-url"
              placeholder="https://app.chatwoot.com ou https://seu-chatwoot.com"
              value={config.base_url}
              onChange={(e) => setConfig(prev => ({ ...prev, base_url: e.target.value }))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemplo: https://app.chatwoot.com (sem /app/login no final)
            </p>
          </div>

          <div>
            <Label htmlFor="chatwoot-token">Token de API</Label>
            <Input
              id="chatwoot-token"
              type="password"
              placeholder="Seu token de API do Chatwoot"
              value={config.api_token}
              onChange={(e) => setConfig(prev => ({ ...prev, api_token: e.target.value }))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Encontre em: Configurações → Integrações → API Access Token
            </p>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-4 rounded-lg border ${
            validationResult.status === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {validationResult.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                validationResult.status === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.message}
              </span>
            </div>
            {validationResult.url && (
              <p className="text-xs text-gray-600 mt-1">
                URL validada: {validationResult.url}
              </p>
            )}
          </div>
        )}

        {/* Current Status */}
        {existingChatwoot && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Configuração Atual</p>
                <p className="text-sm text-gray-600">{existingChatwoot.base_url}</p>
              </div>
              <Badge variant={existingChatwoot.is_active ? "default" : "secondary"}>
                {existingChatwoot.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={validateConfiguration}
            disabled={isValidating || !config.base_url || !config.api_token}
            variant="outline"
            className="flex-1"
          >
            {isValidating ? (
              <>Testando...</>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Testar Conexão
              </>
            )}
          </Button>

          <Button 
            onClick={saveConfiguration}
            disabled={!validationResult || validationResult.status !== 'success'}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
        </div>

        {/* Help Links */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Links úteis:</p>
          <div className="flex gap-4 text-xs">
            <a 
              href="https://www.chatwoot.com/docs/product/channels/api/client-apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              Documentação API <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href="https://app.chatwoot.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              Chatwoot.com <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
