import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, CheckCircle, XCircle, Wifi, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UniFiConnectionDiagnosticProps {
  integrationId: string;
}

const UniFiConnectionDiagnostic: React.FC<UniFiConnectionDiagnosticProps> = ({ integrationId }) => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    const tests = [
      {
        name: 'Teste de Sites',
        endpoint: '/api/self/sites',
        description: 'Verifica acesso aos sites da controladora'
      },
      {
        name: 'Teste de Status',
        endpoint: '/api/self',
        description: 'Verifica informações do usuário'
      }
    ];

    const testResults = [];
    
    for (const test of tests) {
      try {
        console.log(`Executando teste: ${test.name}`);
        const response = await supabase.functions.invoke('unifi-proxy', {
          body: {
            integrationId,
            endpoint: test.endpoint,
            method: 'GET'
          }
        });

        const result = {
          test: test.name,
          description: test.description,
          status: response.error ? 'error' : 'success',
          data: response.data,
          error: response.error?.message || response.error
        };

        testResults.push(result);
        console.log(`Resultado do teste ${test.name}:`, result);
      } catch (error) {
        const result = {
          test: test.name,
          description: test.description,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
        testResults.push(result);
        console.error(`Erro no teste ${test.name}:`, error);
      }
    }
    
    setResults(testResults);
    
    const hasSuccess = testResults.some(r => r.status === 'success');
    const hasError = testResults.some(r => r.status === 'error');
    
    toast({
      title: hasSuccess ? "Alguns testes bem-sucedidos" : "Erro na conexão",
      description: hasSuccess ? "Controladora UniFi parcialmente conectada!" : "Falha na conexão com a controladora",
      variant: hasSuccess && !hasError ? "default" : "destructive"
    });
    
    setIsRunning(false);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-blue-400" />
          <div>
            <CardTitle className="text-white">Diagnóstico UniFi</CardTitle>
            <CardDescription className="text-slate-400">
              Teste a conectividade com sua controladora local
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Testar Conexão
            </>
          )}
        </Button>

        {results.map((result, index) => (
          <Alert key={index} className="border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.status === 'success' ? 
                  <CheckCircle className="h-4 w-4 text-green-500" /> : 
                  <XCircle className="h-4 w-4 text-red-500" />
                }
                <div>
                  <div className="font-medium text-white">{result.test}</div>
                  <div className="text-sm text-slate-400">{result.description}</div>
                </div>
              </div>
              <Badge variant={result.status === 'success' ? "default" : "destructive"}>
                {result.status === 'success' ? 'Sucesso' : 'Erro'}
              </Badge>
            </div>
            {result.error && (
              <AlertDescription className="text-red-400 mt-2">
                <strong>Erro:</strong> {result.error}
                {result.error.includes('troubleshooting') && (
                  <div className="mt-2 text-xs text-yellow-400">
                    <strong>Dicas:</strong> {result.error.split('troubleshooting: ')[1]}
                  </div>
                )}
              </AlertDescription>
            )}
            {result.status === 'success' && result.data && (
              <AlertDescription className="text-green-400 mt-2">
                <strong>Sucesso:</strong> Dados recebidos da controladora
              </AlertDescription>
            )}
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default UniFiConnectionDiagnostic;