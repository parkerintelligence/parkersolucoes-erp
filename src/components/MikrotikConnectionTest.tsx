import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export const MikrotikConnectionTest = () => {
  const { callAPI, loading } = useMikrotikAPI();
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
      setTestResult({
        success: false,
        message: 'Falha na conexão',
        details: error.message || 'Verifique as credenciais e se a API REST está habilitada no MikroTik',
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
                <div className="text-sm mt-1">{testResult.details}</div>
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
                  <li>API REST habilitada no MikroTik (IP → Services → www-ssl)</li>
                  <li>Porta configurada corretamente (padrão 443 para HTTPS, 80 para HTTP)</li>
                  <li>Usuário com permissões de API ou full access</li>
                  <li>URL no formato: http://ip:porta ou https://ip:porta</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
