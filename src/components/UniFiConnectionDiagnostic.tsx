import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Activity, 
  AlertTriangle,
  Network,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UniFiConnectionDiagnosticProps {
  integrationId: string;
}

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'running';
  message: string;
  details?: string;
  duration?: number;
  troubleshooting?: string[];
}

const UniFiConnectionDiagnostic: React.FC<UniFiConnectionDiagnosticProps> = ({ integrationId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const diagnosticTests = [
      {
        name: 'Conectividade Básica',
        endpoint: '/api/self/sites',
        description: 'Teste de acesso básico à API'
      },
      {
        name: 'Teste com SSL Ignorado',
        endpoint: '/api/self/sites',
        description: 'Teste de acesso ignorando certificados SSL',
        ignoreSSL: true
      },
      {
        name: 'Listar Sites',
        endpoint: '/api/self/sites',
        description: 'Verificar se consegue listar sites'
      },
      {
        name: 'Status de Saúde',
        endpoint: '/api/stat/health',
        description: 'Verificar status de saúde do sistema'
      }
    ];

    for (const test of diagnosticTests) {
      const startTime = Date.now();
      
      setResults(prev => [...prev, {
        test: test.name,
        status: 'running',
        message: `Executando ${test.description}...`,
      }]);

      try {
        const { data: response, error } = await supabase.functions.invoke('unifi-proxy', {
          body: {
            method: 'GET',
            endpoint: test.endpoint,
            integrationId,
            ignore_ssl: test.ignoreSSL
          }
        });

        const duration = Date.now() - startTime;

        if (error) {
          const troubleshooting = generateTroubleshooting(error);
          
          setResults(prev => prev.map(r => 
            r.test === test.name ? {
              ...r,
              status: 'error' as const,
              message: `Falhou: ${error.message}`,
              details: error.details || JSON.stringify(error),
              duration,
              troubleshooting
            } : r
          ));
        } else {
          setResults(prev => prev.map(r => 
            r.test === test.name ? {
              ...r,
              status: 'success' as const,
              message: `Sucesso (${duration}ms)`,
              details: `Resposta recebida: ${response ? 'dados válidos' : 'sem dados'}`,
              duration
            } : r
          ));
        }
      } catch (err) {
        const duration = Date.now() - startTime;
        const error = err as Error;
        
        setResults(prev => prev.map(r => 
          r.test === test.name ? {
            ...r,
            status: 'error' as const,
            message: `Erro: ${error.message}`,
            details: error.stack || 'Erro desconhecido',
            duration,
            troubleshooting: ['Verifique a conectividade de rede', 'Confirme as credenciais', 'Teste acesso manual via navegador']
          } : r
        ));
      }
    }

    setIsRunning(false);
  };

  const generateTroubleshooting = (error: any): string[] => {
    const suggestions = [];
    const errorMsg = error.message?.toLowerCase() || '';
    
    if (errorMsg.includes('ssl') || errorMsg.includes('certificate') || errorMsg.includes('tls')) {
      suggestions.push('Problema de certificado SSL detectado');
      suggestions.push('Tente ativar "Ignorar certificados SSL inválidos" nas configurações');
      suggestions.push('Acesse a controladora pelo navegador e aceite o certificado');
    }
    
    if (errorMsg.includes('connection') || errorMsg.includes('network')) {
      suggestions.push('Problema de conectividade de rede');
      suggestions.push('Verifique se a controladora está acessível na rede');
      suggestions.push('Confirme se a URL e porta estão corretas');
    }
    
    if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('credentials')) {
      suggestions.push('Problema de autenticação');
      suggestions.push('Verifique se o usuário e senha estão corretos');
      suggestions.push('Confirme se o usuário tem permissões de administrador');
    }
    
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      suggestions.push('Endpoint não encontrado');
      suggestions.push('Verifique se a URL da controladora está correta');
      suggestions.push('Confirme se a controladora está rodando na porta especificada');
    }

    if (suggestions.length === 0) {
      suggestions.push('Erro desconhecido - verifique logs para mais detalhes');
    }

    return suggestions;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Diagnóstico de Conexão
            </CardTitle>
            <CardDescription>
              Execute testes de conectividade para diagnosticar problemas
            </CardDescription>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 && !isRunning && (
          <Alert>
            <Network className="h-4 w-4" />
            <AlertDescription>
              Clique em "Executar Diagnóstico" para testar a conectividade com a controladora UniFi.
            </AlertDescription>
          </Alert>
        )}

        {results.map((result, index) => (
          <Alert key={index} className={getStatusColor(result.status)}>
            <div className="flex items-start gap-3">
              {getStatusIcon(result.status)}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{result.test}</h4>
                  <Badge variant="outline" className="ml-2">
                    {result.status === 'running' ? 'Executando' : 
                     result.status === 'success' ? 'Sucesso' :
                     result.status === 'error' ? 'Erro' : 'Aviso'}
                  </Badge>
                </div>
                
                <p className="text-sm">{result.message}</p>
                
                {result.duration && (
                  <p className="text-xs text-muted-foreground">
                    Tempo de resposta: {result.duration}ms
                  </p>
                )}
                
                {result.troubleshooting && result.troubleshooting.length > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Solução de problemas:
                    </h5>
                    <ul className="text-xs space-y-1">
                      {result.troubleshooting.map((tip, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-muted-foreground">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                      Detalhes técnicos
                    </summary>
                    <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-32">
                      {result.details}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default UniFiConnectionDiagnostic;