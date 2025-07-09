
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Globe,
  Key,
  Database
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface GuacamoleConnectionTestProps {
  onLog: (type: 'info' | 'error' | 'request' | 'response', message: string, options?: any) => void;
}

export const GuacamoleConnectionTest = ({ onLog }: GuacamoleConnectionTestProps) => {
  const { data: integrations } = useIntegrations();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    baseUrl?: { success: boolean; message: string };
    authentication?: { success: boolean; message: string; token?: string };
    dataSource?: { success: boolean; message: string };
    connections?: { success: boolean; message: string; count?: number };
  }>({});

  const integration = integrations?.find(i => i.type === 'guacamole' && i.is_active);

  const normalizeBaseUrl = (url: string): string => {
    let normalizedUrl = url.trim();
    
    // Remove trailing slashes
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    
    // Add /guacamole if not present and not ending with it
    if (!normalizedUrl.endsWith('/guacamole')) {
      normalizedUrl += '/guacamole';
    }
    
    return normalizedUrl;
  };

  const testConnection = async () => {
    if (!integration) {
      toast({
        title: "Erro",
        description: "Integração do Guacamole não configurada",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResults({});
    
    try {
      const baseUrl = normalizeBaseUrl(integration.base_url);
      const dataSource = integration.directory || 'postgresql';
      
      onLog('info', 'Iniciando testes de conectividade', {
        baseUrl,
        dataSource,
        username: integration.username
      });

      // Test 1: Base URL connectivity
      onLog('request', 'Testando conectividade da URL base', { url: baseUrl });
      
      try {
        const pingResponse = await fetch(`${baseUrl}/`, { method: 'HEAD' });
        const baseUrlSuccess = pingResponse.status < 500;
        
        setTestResults(prev => ({
          ...prev,
          baseUrl: {
            success: baseUrlSuccess,
            message: baseUrlSuccess 
              ? `URL acessível (Status: ${pingResponse.status})`
              : `URL inacessível (Status: ${pingResponse.status})`
          }
        }));
        
        onLog(baseUrlSuccess ? 'response' : 'error', 
          baseUrlSuccess ? 'URL base acessível' : 'URL base inacessível', {
          status: pingResponse.status,
          url: baseUrl
        });
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          baseUrl: {
            success: false,
            message: `Erro de conectividade: ${error.message}`
          }
        }));
        onLog('error', 'Erro ao conectar com URL base', { error: error.message });
      }

      // Test 2: Authentication
      const tokenUrl = `${baseUrl}/api/tokens`;
      onLog('request', 'Testando autenticação', { url: tokenUrl, method: 'POST' });
      
      try {
        const authResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: integration.username || '',
            password: integration.password || '',
          }),
        });

        const authSuccess = authResponse.ok;
        let authToken = '';
        
        if (authSuccess) {
          authToken = await authResponse.text();
        }
        
        setTestResults(prev => ({
          ...prev,
          authentication: {
            success: authSuccess,
            message: authSuccess 
              ? `Autenticação bem-sucedida (Token: ${authToken.substring(0, 20)}...)`
              : `Falha na autenticação (Status: ${authResponse.status})`,
            token: authToken
          }
        }));
        
        onLog(authSuccess ? 'response' : 'error', 
          authSuccess ? 'Autenticação bem-sucedida' : 'Falha na autenticação', {
          status: authResponse.status,
          tokenLength: authToken.length
        });

        // Test 3: Data Source validation
        if (authSuccess && authToken) {
          const dataSourceUrl = `${baseUrl}/api/session/data/${dataSource}`;
          onLog('request', 'Testando data source', { 
            url: dataSourceUrl, 
            dataSource 
          });
          
          try {
            const dsResponse = await fetch(`${dataSourceUrl}?token=${encodeURIComponent(authToken)}`);
            const dsSuccess = dsResponse.ok;
            
            setTestResults(prev => ({
              ...prev,
              dataSource: {
                success: dsSuccess,
                message: dsSuccess 
                  ? `Data source '${dataSource}' válido`
                  : `Data source '${dataSource}' inválido (Status: ${dsResponse.status})`
              }
            }));
            
            onLog(dsSuccess ? 'response' : 'error', 
              dsSuccess ? 'Data source válido' : 'Data source inválido', {
              status: dsResponse.status,
              dataSource
            });

            // Test 4: Connections endpoint
            if (dsSuccess) {
              const connectionsUrl = `${baseUrl}/api/session/data/${dataSource}/connections`;
              onLog('request', 'Testando endpoint de conexões', { 
                url: connectionsUrl,
                dataSource 
              });
              
              try {
                const connResponse = await fetch(`${connectionsUrl}?token=${encodeURIComponent(authToken)}`);
                const connSuccess = connResponse.ok;
                let connectionCount = 0;
                
                if (connSuccess) {
                  const connData = await connResponse.json();
                  connectionCount = Object.keys(connData || {}).length;
                }
                
                setTestResults(prev => ({
                  ...prev,
                  connections: {
                    success: connSuccess,
                    message: connSuccess 
                      ? `${connectionCount} conexões encontradas`
                      : `Erro ao buscar conexões (Status: ${connResponse.status})`,
                    count: connectionCount
                  }
                }));
                
                onLog(connSuccess ? 'response' : 'error', 
                  connSuccess ? 'Conexões carregadas com sucesso' : 'Erro ao carregar conexões', {
                  status: connResponse.status,
                  count: connectionCount
                });
              } catch (error) {
                setTestResults(prev => ({
                  ...prev,
                  connections: {
                    success: false,
                    message: `Erro ao testar conexões: ${error.message}`
                  }
                }));
                onLog('error', 'Erro ao testar endpoint de conexões', { error: error.message });
              }
            }
          } catch (error) {
            setTestResults(prev => ({
              ...prev,
              dataSource: {
                success: false,
                message: `Erro ao testar data source: ${error.message}`
              }
            }));
            onLog('error', 'Erro ao testar data source', { error: error.message });
          }
        }
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          authentication: {
            success: false,
            message: `Erro de autenticação: ${error.message}`
          }
        }));
        onLog('error', 'Erro durante autenticação', { error: error.message });
      }
      
    } catch (error) {
      onLog('error', 'Erro geral nos testes', { error: error.message });
      toast({
        title: "Erro nos testes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
      onLog('info', 'Testes de conectividade finalizados');
    }
  };

  const TestResult = ({ result, icon: Icon, title }) => {
    if (!result) return null;
    
    return (
      <div className={`flex items-center gap-3 p-3 rounded border ${
        result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}>
        <Icon className={`h-5 w-5 ${result.success ? 'text-green-600' : 'text-red-600'}`} />
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{result.message}</p>
        </div>
        <Badge variant={result.success ? 'default' : 'destructive'}>
          {result.success ? 'OK' : 'ERRO'}
        </Badge>
      </div>
    );
  };

  if (!integration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Conectividade
          </CardTitle>
          <CardDescription>
            Configure primeiro uma integração do Guacamole
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste de Conectividade
        </CardTitle>
        <CardDescription>
          Teste cada componente da conexão individualmente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label>URL Base (normalizada)</Label>
            <Input value={normalizeBaseUrl(integration.base_url)} readOnly />
          </div>
          <div>
            <Label>Data Source</Label>
            <Input value={integration.directory || 'postgresql'} readOnly />
          </div>
        </div>

        <Button onClick={testConnection} disabled={testing} className="w-full">
          {testing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          {testing ? 'Testando...' : 'Executar Testes'}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Resultados dos Testes:</h4>
            
            <TestResult 
              result={testResults.baseUrl} 
              icon={Globe}
              title="Conectividade da URL Base"
            />
            
            <TestResult 
              result={testResults.authentication} 
              icon={Key}
              title="Autenticação"
            />
            
            <TestResult 
              result={testResults.dataSource} 
              icon={Database}
              title="Validação do Data Source"
            />
            
            <TestResult 
              result={testResults.connections} 
              icon={CheckCircle}
              title="Endpoint de Conexões"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
