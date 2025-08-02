import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Server, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UniFiConnectionDiagnosticProps {
  integrationId: string;
}

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  duration?: number;
  troubleshooting?: string;
}

const UniFiConnectionDiagnostic: React.FC<UniFiConnectionDiagnosticProps> = ({ integrationId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults: DiagnosticResult[] = [];

    try {
      // Test 1: Teste de Sites (endpoint principal)
      const testsToRun = [
        {
          name: "Teste de Sites",
          endpoint: "/api/self/sites",
          description: "Verifica acesso aos sites da controladora"
        },
        {
          name: "Teste de Autenticação", 
          endpoint: "/api/self",
          description: "Verifica informações do usuário autenticado"
        }
      ];

      for (const test of testsToRun) {
        const startTime = Date.now();
        
        testResults.push({
          test: test.name,
          status: 'warning',
          message: `Executando ${test.name.toLowerCase()}...`,
          duration: 0
        });
        setResults([...testResults]);

        try {
          console.log(`=== EXECUTANDO ${test.name} ===`);
          console.log(`Endpoint: ${test.endpoint}`);
          console.log(`Integration ID: ${integrationId}`);

          const { data, error } = await supabase.functions.invoke('unifi-proxy', {
            body: {
              method: 'GET',
              endpoint: test.endpoint,
              integrationId: integrationId
            }
          });

          const duration = Date.now() - startTime;
          
          // Remove o resultado "em progresso"
          testResults.pop();

          console.log(`=== RESULTADO ${test.name} ===`);
          console.log('Error:', error);
          console.log('Data:', data);

          if (error) {
            console.error(`Edge Function Error for ${test.name}:`, error);
            
            // Analisar diferentes tipos de erro
            let troubleshooting = '';
            let errorMsg = error.message || 'Erro desconhecido';
            
            if (errorMsg.includes('Edge Function returned a non-2xx status code')) {
              troubleshooting = 'A edge function retornou erro. Verifique os logs da função para mais detalhes sobre problemas de conectividade ou autenticação.';
            } else if (errorMsg.includes('network')) {
              troubleshooting = 'Problema de rede. Verifique conectividade com a controladora.';
            } else if (errorMsg.includes('timeout')) {
              troubleshooting = 'Timeout na conexão. A controladora pode estar lenta ou inacessível.';
            }

            testResults.push({
              test: test.name,
              status: 'error',
              message: `Falhou: ${errorMsg}`,
              details: error,
              duration,
              troubleshooting
            });
          } else if (data?.error) {
            console.error(`Controller Error for ${test.name}:`, data.error);
            
            let troubleshooting = '';
            const controllerError = data.error;
            
            if (controllerError.includes('Authentication failed') || controllerError.includes('Credenciais')) {
              troubleshooting = 'Problema de autenticação. Verifique: 1) Usuário e senha corretos; 2) Usuário tem permissões de admin; 3) Controladora está acessível.';
            } else if (controllerError.includes('Conexão falhou') || controllerError.includes('SSL') || controllerError.includes('TLS')) {
              troubleshooting = 'Problema de conectividade SSL/TLS. Tente: 1) Aceitar certificado no navegador; 2) Verificar se URL está correta; 3) Testar HTTP em vez de HTTPS.';
            } else if (controllerError.includes('network') || controllerError.includes('timeout')) {
              troubleshooting = 'Problema de rede. Verifique: 1) Controladora está online; 2) Porta 8443 está aberta; 3) Firewall permite acesso.';
            }

            testResults.push({
              test: test.name,
              status: 'error',
              message: `Erro da Controladora: ${controllerError}`,
              details: data,
              duration,
              troubleshooting
            });
          } else {
            console.log(`Success for ${test.name}:`, data);
            
            testResults.push({
              test: test.name,
              status: 'success',
              message: `✅ Sucesso - ${test.description}`,
              details: data,
              duration
            });
          }
        } catch (testError: any) {
          console.error(`Unexpected error for ${test.name}:`, testError);
          
          const duration = Date.now() - startTime;
          testResults.pop(); // Remove resultado "em progresso"
          
          testResults.push({
            test: test.name,
            status: 'error',
            message: `Erro inesperado: ${testError.message}`,
            details: testError,
            duration,
            troubleshooting: 'Erro inesperado no teste. Verifique configuração da integração e tente novamente.'
          });
        }

        setResults([...testResults]);
        
        // Pequena pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mostrar resumo
      const successCount = testResults.filter(r => r.status === 'success').length;
      const errorCount = testResults.filter(r => r.status === 'error').length;
      
      if (errorCount === 0) {
        toast({
          title: "✅ Diagnóstico Concluído",
          description: `Todos os ${successCount} testes passaram com sucesso!`,
        });
      } else {
        toast({
          title: "⚠️ Problemas Detectados",
          description: `${errorCount} teste(s) falharam de ${testResults.length} total`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Critical diagnostic error:', error);
      testResults.push({
        test: "Diagnóstico Geral",
        status: 'error',
        message: `Erro crítico: ${error.message}`,
        details: error,
        duration: 0,
        troubleshooting: 'Erro crítico no sistema de diagnóstico. Verifique configuração e tente novamente.'
      });
      setResults(testResults);
      
      toast({
        title: "❌ Erro no Diagnóstico",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'error': return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-blue-400" />
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              Diagnóstico Avançado UniFi
            </CardTitle>
            <CardDescription className="text-slate-400">
              Execute um diagnóstico detalhado da conexão com sua controladora local
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executando Diagnósticos...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Executar Diagnóstico Completo
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-white">Resultados do Diagnóstico:</h3>
            {results.map((result, index) => (
              <Alert key={index} className={`${getStatusColor(result.status)} border-slate-600`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{result.test}</span>
                        {result.duration !== undefined && result.duration > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {result.duration}ms
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="mt-1 text-slate-300">
                        {result.message}
                      </AlertDescription>
                      
                      {result.troubleshooting && (
                        <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-800/30 rounded text-yellow-300 text-sm">
                          <strong>💡 Dicas de solução:</strong>
                          <div className="mt-1">{result.troubleshooting}</div>
                        </div>
                      )}
                      
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-200">
                            🔍 Ver detalhes técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-slate-900 text-slate-300 p-2 rounded border border-slate-600 overflow-auto max-h-32">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniFiConnectionDiagnostic;