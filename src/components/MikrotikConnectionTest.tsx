import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export const MikrotikConnectionTest = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { data: integrations } = useIntegrations();
  const integration = integrations?.find((i) => i.type === 'mikrotik');
  
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const testConnection = async () => {
    setTestResult(null);
    try {
      const data = await callAPI('/system/identity');
      if (data) {
        setTestResult({
          success: true,
          message: 'Conexão estabelecida com sucesso!',
          details: `Dispositivo: ${data.name || 'MikroTik Router'}`,
        });
      }
    } catch (error: any) {
      const is401 = error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('autenticação');
      
      setTestResult({
        success: false,
        message: is401 ? 'Erro de Autenticação (401)' : 'Falha na conexão',
        details: is401 
          ? 'Credenciais inválidas ou API REST não habilitada. Verifique:\n• Usuário e senha estão corretos\n• API REST está habilitada em IP → Services → www-ssl (HTTPS) ou www (HTTP)\n• Usuário tem permissões de "api" ou "full"\n• Porta está correta (443 para HTTPS, 80 para HTTP)'
          : error.message || 'Verifique as credenciais e configurações de rede',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testar Conexão</CardTitle>
        <CardDescription>
          Verifique se as credenciais e configurações estão corretas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            'Testar Conexão'
          )}
        </Button>

        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="font-semibold">{testResult.message}</div>
              {testResult.details && (
                <div className="text-sm mt-1 whitespace-pre-line">{testResult.details}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!testResult && !loading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Requisitos para funcionamento:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>API REST habilitada no MikroTik (IP → Services → www-ssl ou www)</li>
                  <li>Porta configurada corretamente (sua configuração: 8999)</li>
                  <li>Usuário com permissões de <strong>api</strong> ou <strong>full</strong></li>
                  <li>URL no formato: http://ip:porta (sua URL: {integration?.base_url})</li>
                  <li>Firewall permitindo conexão do servidor Lovable</li>
                </ul>
                <div className="mt-3 p-2 bg-muted rounded text-xs">
                  <p className="font-semibold mb-1">Para habilitar API REST via terminal:</p>
                  <code className="block">/ip service set www-ssl disabled=no</code>
                  <code className="block">/ip service set www-ssl port=8999</code>
                  <p className="font-semibold mt-2 mb-1">Para criar usuário com permissões:</p>
                  <code className="block">/user group add name=api-users policy=api,read</code>
                  <code className="block">/user add name=apiuser group=api-users password=suasenha</code>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
