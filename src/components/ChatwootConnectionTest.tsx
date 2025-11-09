import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export function ChatwootConnectionTest() {
  const [baseUrl, setBaseUrl] = useState("https://chat.parkerintelligence.com.br/app");
  const [apiToken, setApiToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async (method: 'api_access_token' | 'bearer') => {
    setTesting(true);
    setResult(null);

    try {
      const url = `${baseUrl}/api/v1/accounts`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (method === 'api_access_token') {
        headers['api_access_token'] = apiToken;
      } else {
        headers['Authorization'] = `Bearer ${apiToken}`;
      }

      console.log('🔍 Testing connection:', { url, headers, method });

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType,
        data,
        method,
        url,
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        method,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Teste de Conexão Chatwoot</CardTitle>
        <CardDescription>
          Teste diferentes métodos de autenticação para diagnosticar problemas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-semibold">Como obter o Access Token correto:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Faça login no Chatwoot</li>
              <li>Vá em <strong>Profile Settings</strong> (canto superior direito)</li>
              <li>Clique em <strong>Access Token</strong></li>
              <li>Copie o token (NÃO use Platform App Token)</li>
              <li>Cole o token abaixo</li>
            </ol>
            <p className="text-muted-foreground mt-2">
              ⚠️ O token deve ter permissões de <strong>Administrator</strong> ou <strong>Agent</strong>
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">URL Base do Chatwoot</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://chat.example.com/app"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiToken">Access Token</Label>
            <Input
              id="apiToken"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Cole seu Access Token aqui"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => testConnection('api_access_token')}
              disabled={!apiToken || testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar com api_access_token'
              )}
            </Button>
            <Button
              onClick={() => testConnection('bearer')}
              disabled={!apiToken || testing}
              variant="secondary"
              className="flex-1"
            >
              Testar com Bearer
            </Button>
          </div>
        </div>

        {result && (
          <Card className={result.success ? "border-green-500" : "border-destructive"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Conexão Bem-sucedida
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    Falha na Conexão
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Resumo</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-semibold">Status:</p>
                    <p>{result.status} {result.statusText}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Método:</p>
                    <p>{result.method}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Content-Type:</p>
                    <p>{result.contentType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">URL:</p>
                    <p className="truncate">{result.url}</p>
                  </div>
                </div>

                {!result.success && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {result.status === 406 && (
                        <div className="space-y-1">
                          <p className="font-semibold">Erro 406: Possíveis causas</p>
                          <ul className="list-disc list-inside text-sm">
                            <li>Token inválido ou expirado</li>
                            <li>Token sem permissões adequadas (precisa ser Administrator ou Agent)</li>
                            <li>Token do tipo incorreto (use Access Token, não Platform App)</li>
                          </ul>
                        </div>
                      )}
                      {result.status === 401 && (
                        <p>Token não autorizado. Verifique se o token está correto.</p>
                      )}
                      {result.error && (
                        <p>Erro de rede: {result.error}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Detalhes Técnicos</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
