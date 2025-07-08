
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Info,
  Network,
  Shield,
  Clock,
  Server,
  Settings,
  Wifi,
  Globe,
  Lock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface DiagnosticTest {
  name: string;
  success: boolean;
  details: string;
}

interface ConnectionDiagnosis {
  timestamp: string;
  tests: DiagnosticTest[];
}

interface UniFiConnectionDiagnosticProps {
  onRunDiagnosis: () => void;
  diagnosisLoading?: boolean;
  diagnosis?: ConnectionDiagnosis | null;
  connectionUrl?: string;
  integration?: any;
  onUpdateIntegration?: (updates: any) => void;
}

interface QuickTestResult {
  type: 'ping' | 'ssl' | 'auth' | 'api';
  name: string;
  success: boolean;
  details: string;
  suggestion?: string;
}

export const UniFiConnectionDiagnostic: React.FC<UniFiConnectionDiagnosticProps> = ({
  onRunDiagnosis,
  diagnosisLoading = false,
  diagnosis,
  connectionUrl,
  integration,
  onUpdateIntegration
}) => {
  const [quickTestLoading, setQuickTestLoading] = useState(false);
  const [quickTestResults, setQuickTestResults] = useState<QuickTestResult[]>([]);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [tempConfig, setTempConfig] = useState({
    base_url: integration?.base_url || '',
    username: integration?.username || '',
    password: integration?.password || '',
    ignore_ssl: true
  });
  const [showPassword, setShowPassword] = useState(false);

  const runQuickTests = async () => {
    setQuickTestLoading(true);
    setQuickTestResults([]);
    
    const tests: QuickTestResult[] = [];
    
    try {
      // Test 1: Basic URL validation
      try {
        new URL(tempConfig.base_url);
        tests.push({
          type: 'ping',
          name: 'URL Format',
          success: true,
          details: 'URL format is valid'
        });
      } catch {
        tests.push({
          type: 'ping',
          name: 'URL Format',
          success: false,
          details: 'Invalid URL format',
          suggestion: 'Use format: https://controller-ip:8443 or http://controller-ip:8080'
        });
        setQuickTestResults(tests);
        setQuickTestLoading(false);
        return;
      }

      // Test 2: SSL/Certificate check
      const isHttps = tempConfig.base_url.startsWith('https');
      if (isHttps) {
        tests.push({
          type: 'ssl',
          name: 'SSL Configuration',
          success: tempConfig.ignore_ssl,
          details: tempConfig.ignore_ssl ? 'SSL verification disabled (recommended for local controllers)' : 'SSL verification enabled',
          suggestion: !tempConfig.ignore_ssl ? 'Consider disabling SSL verification for self-signed certificates' : undefined
        });
      } else {
        tests.push({
          type: 'ssl',
          name: 'SSL Configuration',
          success: true,
          details: 'Using HTTP (no SSL verification needed)',
          suggestion: 'Consider using HTTPS for better security if your controller supports it'
        });
      }

      // Test 3: Connectivity test
      try {
        const response = await fetch('https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/unifi-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E`,
          },
          body: JSON.stringify({
            action: 'pingController',
            baseUrl: tempConfig.base_url
          })
        });

        const result = await response.json();
        
        if (result.success) {
          tests.push({
            type: 'ping',
            name: 'Controller Connectivity',
            success: true,
            details: 'Controller is reachable'
          });
        } else {
          tests.push({
            type: 'ping',
            name: 'Controller Connectivity',
            success: false,
            details: result.details || 'Controller unreachable',
            suggestion: 'Check if the controller is running and accessible from your network'
          });
        }
      } catch (error) {
        tests.push({
          type: 'ping',
          name: 'Controller Connectivity',
          success: false,
          details: 'Network error or controller unreachable',
          suggestion: 'Verify the controller URL and network connectivity'
        });
      }

      // Test 4: Authentication test (if connectivity passed)
      const connectivityPassed = tests.find(t => t.type === 'ping' && t.name === 'Controller Connectivity')?.success;
      
      if (connectivityPassed && tempConfig.username && tempConfig.password) {
        try {
          const response = await fetch('https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/unifi-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E`,
            },
            body: JSON.stringify({
              action: 'login',
              baseUrl: tempConfig.base_url,
              username: tempConfig.username,
              password: tempConfig.password
            })
          });

          const result = await response.json();
          
          if (result.success) {
            tests.push({
              type: 'auth',
              name: 'Authentication',
              success: true,
              details: 'Login successful'
            });
          } else {
            tests.push({
              type: 'auth',
              name: 'Authentication',
              success: false,
              details: result.error || 'Login failed',
              suggestion: 'Verify username and password are correct'
            });
          }
        } catch (error) {
          tests.push({
            type: 'auth',
            name: 'Authentication',
            success: false,
            details: 'Authentication test failed',
            suggestion: 'Check credentials and try again'
          });
        }
      } else if (!connectivityPassed) {
        tests.push({
          type: 'auth',
          name: 'Authentication',
          success: false,
          details: 'Skipped due to connectivity issues',
          suggestion: 'Fix connectivity first'
        });
      } else {
        tests.push({
          type: 'auth',
          name: 'Authentication',
          success: false,
          details: 'Username or password missing',
          suggestion: 'Enter username and password to test authentication'
        });
      }

      setQuickTestResults(tests);
    } catch (error) {
      console.error('Quick test failed:', error);
      setQuickTestResults([{
        type: 'ping',
        name: 'Quick Test',
        success: false,
        details: 'Quick test failed to run',
        suggestion: 'Try running the full diagnosis instead'
      }]);
    } finally {
      setQuickTestLoading(false);
    }
  };

  const getTestIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-400" />
    ) : (
      <XCircle className="h-4 w-4 text-red-400" />
    );
  };

  const getTestBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-900/20 text-green-400 border-green-600">
        Sucesso
      </Badge>
    ) : (
      <Badge className="bg-red-900/20 text-red-400 border-red-600">
        Falha
      </Badge>
    );
  };

  const getOverallStatus = () => {
    if (!diagnosis) return null;
    
    const failedTests = diagnosis.tests.filter(test => !test.success);
    const successfulTests = diagnosis.tests.filter(test => test.success);
    
    if (failedTests.length === 0) {
      return {
        status: 'success',
        message: 'Todos os testes passaram com sucesso',
        color: 'text-green-400'
      };
    } else if (successfulTests.length === 0) {
      return {
        status: 'error',
        message: 'Todos os testes falharam',
        color: 'text-red-400'
      };
    } else {
      return {
        status: 'warning',
        message: `${failedTests.length} de ${diagnosis.tests.length} testes falharam`,
        color: 'text-yellow-400'
      };
    }
  };

  const handleSaveConfig = () => {
    if (onUpdateIntegration) {
      onUpdateIntegration(tempConfig);
    }
    setConfigExpanded(false);
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-400" />
          Diagnóstico e Configuração UniFi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Testes
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="font-medium text-white">Controladora UniFi</div>
                  <div className="text-sm text-gray-400">{connectionUrl || 'Não configurado'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={runQuickTests}
                  disabled={quickTestLoading || !tempConfig.base_url}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {quickTestLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Teste Rápido
                </Button>
                <Button
                  onClick={onRunDiagnosis}
                  disabled={diagnosisLoading}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-200 hover:bg-gray-700"
                >
                  {diagnosisLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Diagnóstico Completo
                </Button>
              </div>
            </div>

            {quickTestResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Resultados do Teste Rápido:</h4>
                {quickTestResults.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTestIcon(test.success)}
                      <div>
                        <div className="font-medium text-white">{test.name}</div>
                        <div className="text-sm text-gray-400">{test.details}</div>
                        {test.suggestion && (
                          <div className="text-xs text-yellow-400 mt-1">💡 {test.suggestion}</div>
                        )}
                      </div>
                    </div>
                    {getTestBadge(test.success)}
                  </div>
                ))}
              </div>
            )}

            {overallStatus && (
              <Alert className={
                overallStatus.status === 'success' ? 'bg-green-900/20 border-green-600' :
                overallStatus.status === 'error' ? 'bg-red-900/20 border-red-600' :
                'bg-yellow-900/20 border-yellow-600'
              }>
                {overallStatus.status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : overallStatus.status === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                )}
                <AlertDescription className={overallStatus.color}>
                  {overallStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            {diagnosisLoading && (
              <Alert className="bg-blue-900/20 border-blue-600">
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                <AlertDescription className="text-blue-300">
                  Executando diagnóstico completo da conectividade...
                </AlertDescription>
              </Alert>
            )}

            {diagnosis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  Executado em: {new Date(diagnosis.timestamp).toLocaleString('pt-BR')}
                </div>
                
                <div className="space-y-2">
                  {diagnosis.tests.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTestIcon(test.success)}
                        <div>
                          <div className="font-medium text-white">{test.name}</div>
                          <div className="text-sm text-gray-400">{test.details}</div>
                        </div>
                      </div>
                      {getTestBadge(test.success)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!diagnosis && !diagnosisLoading && (
              <div className="text-center py-6">
                <TestTube className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 mb-2">Clique em "Diagnóstico Completo" para testar a conectividade</p>
                <p className="text-sm text-gray-500">
                  O diagnóstico verificará URL, conectividade, SSL e autenticação
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="base_url" className="text-white">URL da Controladora</Label>
                <Input
                  id="base_url"
                  value={tempConfig.base_url}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, base_url: e.target.value }))}
                  placeholder="https://controladora:8443 ou http://controladora:8080"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Use HTTPS (porta 8443) para Cloud Key/UDM ou HTTP (porta 8080) para controladora auto-hospedada
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Usuário</Label>
                  <Input
                    id="username"
                    value={tempConfig.username}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="admin"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={tempConfig.password}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="senha"
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ignore_ssl"
                  checked={tempConfig.ignore_ssl}
                  onCheckedChange={(checked) => setTempConfig(prev => ({ ...prev, ignore_ssl: checked }))}
                />
                <Label htmlFor="ignore_ssl" className="text-white">
                  Ignorar verificação SSL (recomendado para controladoras locais)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveConfig}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salvar Configuração
                </Button>
                <Button
                  onClick={runQuickTests}
                  disabled={quickTestLoading || !tempConfig.base_url}
                  variant="outline"
                  className="border-gray-600 text-gray-200 hover:bg-gray-700"
                >
                  {quickTestLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Testar Configuração
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-2">Dicas para resolução de problemas:</p>
              <ul className="space-y-1 text-xs">
                <li>• Para controladoras locais, use HTTP ao invés de HTTPS se houver problemas de certificado</li>
                <li>• Cloud Keys e UDMs normalmente usam HTTPS na porta 8443</li>
                <li>• Controladoras auto-hospedadas podem usar HTTP na porta 8080</li>
                <li>• Verifique se a controladora está acessível na rede</li>
                <li>• Confirme que as credenciais estão corretas</li>
                <li>• Certifique-se que a controladora UniFi está em execução</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
