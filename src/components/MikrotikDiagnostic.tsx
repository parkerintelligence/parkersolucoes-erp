import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MikrotikDiagnostic = () => {
  const { data: integrations } = useIntegrations();
  const integration = integrations?.find((i) => i.type === 'mikrotik');
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    step: string;
    success: boolean;
    details: string;
  }[]>([]);

  const runDiagnostics = async () => {
    if (!integration) return;
    
    setTesting(true);
    setDiagnosticResult([]);
    const results: typeof diagnosticResult = [];

    // Step 1: Verificar configuração básica
    results.push({
      step: '1. Verificação de Configuração',
      success: !!(integration.base_url && integration.username && integration.password),
      details: `URL: ${integration.base_url}\nUsuário: ${integration.username}\nSenha: ${integration.password ? '****' + integration.password.slice(-3) : 'não configurada'}`
    });
    setDiagnosticResult([...results]);

    // Step 2: Testar conexão básica (sem autenticação)
    try {
      const pingUrl = `${integration.base_url}`;
      const pingResponse = await fetch(pingUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // Apenas para testar conectividade
      });
      
      results.push({
        step: '2. Teste de Conectividade',
        success: true,
        details: `Servidor MikroTik respondeu em ${pingUrl}`
      });
    } catch (error: any) {
      results.push({
        step: '2. Teste de Conectividade',
        success: false,
        details: `Erro: ${error.message}. O servidor pode estar inacessível.`
      });
    }
    setDiagnosticResult([...results]);

    // Step 3: Testar autenticação Basic manualmente
    try {
      const testUrl = `${integration.base_url}/rest/system/identity`;
      const credentials = btoa(`${integration.username}:${integration.password}`);
      
      results.push({
        step: '3. Credenciais Geradas',
        success: true,
        details: `Authorization: Basic ${credentials.slice(0, 20)}...`
      });
      setDiagnosticResult([...results]);

      const authResponse = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (authResponse.ok) {
        const data = await authResponse.json();
        results.push({
          step: '4. Teste de Autenticação Direto',
          success: true,
          details: `Autenticação OK! Dispositivo: ${data.name || 'MikroTik'}`
        });
      } else {
        const errorText = await authResponse.text();
        results.push({
          step: '4. Teste de Autenticação Direto',
          success: false,
          details: `Status ${authResponse.status}: ${errorText || authResponse.statusText}\n\nPossíveis causas:\n• Usuário ou senha incorretos\n• Usuário sem permissões de API\n• API REST desabilitada no serviço www/www-ssl`
        });
      }
    } catch (error: any) {
      results.push({
        step: '4. Teste de Autenticação Direto',
        success: false,
        details: `Erro: ${error.message}`
      });
    }
    setDiagnosticResult([...results]);

    setTesting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Informações copiadas para a área de transferência',
    });
  };

  if (!integration) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma integração MikroTik configurada. Configure primeiro em Admin → Winbox.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico de Conexão MikroTik</CardTitle>
        <CardDescription>
          Teste detalhado da conexão e autenticação com o MikroTik
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              'Executar Diagnóstico Completo'
            )}
          </Button>
          
          {diagnosticResult.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const text = diagnosticResult
                  .map(r => `${r.step}\n${r.success ? '✓' : '✗'} ${r.details}\n`)
                  .join('\n');
                copyToClipboard(text);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Resultado
            </Button>
          )}
        </div>

        {diagnosticResult.length > 0 && (
          <div className="space-y-3">
            {diagnosticResult.map((result, index) => (
              <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="font-semibold">{result.step}</div>
                  <pre className="text-xs mt-2 whitespace-pre-wrap font-mono">
                    {result.details}
                  </pre>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {diagnosticResult.length === 0 && !testing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Este diagnóstico irá testar:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Validação da configuração (URL, usuário, senha)</li>
                  <li>Conectividade de rede com o servidor MikroTik</li>
                  <li>Geração das credenciais de autenticação</li>
                  <li>Autenticação direta com a API REST</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Para corrigir erro 401:</p>
              <div className="text-xs space-y-1">
                <p><strong>1. Verifique no terminal SSH do MikroTik:</strong></p>
                <code className="block bg-muted p-2 rounded">/ip service print</code>
                <p className="mt-2">Certifique-se que o serviço <strong>www</strong> ou <strong>www-ssl</strong> está com:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>disabled: <strong>no</strong></li>
                  <li>port: <strong>8999</strong> (ou a porta que você configurou)</li>
                </ul>
                
                <p className="mt-3"><strong>2. Verifique as permissões do usuário:</strong></p>
                <code className="block bg-muted p-2 rounded">/user print detail where name={integration.username}</code>
                <p className="mt-1">O grupo deve ter policy contendo <strong>api</strong> ou <strong>full</strong></p>
                
                <p className="mt-3"><strong>3. Teste a senha diretamente:</strong></p>
                <code className="block bg-muted p-2 rounded">/user set {integration.username} password=novasenha</code>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
