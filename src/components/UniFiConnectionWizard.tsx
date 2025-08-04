import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Settings, 
  TestTube, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Network,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UniFiConnectionWizardProps {
  onConnectionSuccess: (config: any) => void;
}

const UniFiConnectionWizard: React.FC<UniFiConnectionWizardProps> = ({ onConnectionSuccess }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<'success' | 'error' | null>(null);
  
  const [config, setConfig] = useState({
    name: 'Controladora UniFi',
    base_url: '',
    username: '',
    password: '',
    port: 8443,
    use_ssl: true,
    ignore_ssl: false
  });

  const [detectedIssues, setDetectedIssues] = useState<string[]>([]);

  const testConnection = async (testConfig = config) => {
    setIsTestingConnection(true);
    setConnectionResult(null);
    setDetectedIssues([]);

    try {
      // Test multiple strategies
      const strategies = [
        { name: 'HTTPS Normal', ignore_ssl: false },
        { name: 'HTTPS (SSL Ignorado)', ignore_ssl: true },
      ];

      for (const strategy of strategies) {
        console.log(`Testando estratégia: ${strategy.name}`);
        
        try {
          const { data: response, error } = await supabase.functions.invoke('unifi-proxy', {
            body: {
              method: 'POST',
              endpoint: '/api/login',
              integrationId: 'test',
              ignore_ssl: strategy.ignore_ssl,
              test_config: {
                base_url: testConfig.base_url,
                username: testConfig.username,
                password: testConfig.password,
                use_ssl: testConfig.use_ssl
              }
            }
          });

          if (!error) {
            setConnectionResult('success');
            setConfig(prev => ({ ...prev, ignore_ssl: strategy.ignore_ssl }));
            toast({
              title: "Conexão bem-sucedida!",
              description: `Conectado usando: ${strategy.name}`,
            });
            return;
          }
        } catch (err) {
          console.log(`Falha na estratégia ${strategy.name}:`, err);
        }
      }

      // Se chegou aqui, todas as estratégias falharam
      setConnectionResult('error');
      setDetectedIssues([
        'Todas as estratégias de conexão falharam',
        'Verifique se a controladora está acessível',
        'Confirme as credenciais e URL'
      ]);

    } catch (error) {
      setConnectionResult('error');
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setDetectedIssues([errorMsg]);
      
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      await testConnection();
      if (connectionResult === 'success') {
        setStep(3);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    onConnectionSuccess(config);
  };

  const getConnectionStatusBadge = () => {
    if (isTestingConnection) {
      return <Badge variant="outline" className="text-blue-500 border-blue-500">
        <Activity className="h-3 w-3 mr-1 animate-spin" />
        Testando...
      </Badge>;
    }
    
    if (connectionResult === 'success') {
      return <Badge variant="outline" className="text-green-500 border-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Conectado
      </Badge>;
    }
    
    if (connectionResult === 'error') {
      return <Badge variant="outline" className="text-red-500 border-red-500">
        <XCircle className="h-3 w-3 mr-1" />
        Falha na Conexão
      </Badge>;
    }
    
    return <Badge variant="outline" className="text-gray-500 border-gray-500">
      <Globe className="h-3 w-3 mr-1" />
      Não Testado
    </Badge>;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Assistente de Configuração UniFi</CardTitle>
              <CardDescription>
                Configure sua controladora UniFi em {step === 1 ? '3 passos simples' : `passo ${step} de 3`}
              </CardDescription>
            </div>
          </div>
          {step > 1 && getConnectionStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Basic Configuration */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Settings className="h-5 w-5" />
              1. Configuração Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Controladora</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Ex: UniFi Principal"
                />
              </div>
              
              <div>
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 8443 })}
                  placeholder="8443"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="base_url">URL da Controladora *</Label>
              <Input
                id="base_url"
                value={config.base_url}
                onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                placeholder="https://192.168.1.1:8443 ou https://unifi.empresa.com:8443"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL completa da sua controladora UniFi local
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Usuário *</Label>
                <Input
                  id="username"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="admin"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Usar SSL/HTTPS</Label>
                <p className="text-sm text-muted-foreground">Conexão segura (recomendado)</p>
              </div>
              <Switch
                checked={config.use_ssl}
                onCheckedChange={(checked) => setConfig({ ...config, use_ssl: checked })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Connection Test */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              2. Teste de Conectividade
            </h3>
            
            <Alert>
              <Network className="h-4 w-4" />
              <AlertDescription>
                Vamos testar a conexão com sua controladora UniFi usando diferentes estratégias
                para garantir a melhor compatibilidade.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Configuração a ser testada:</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>URL:</strong> {config.base_url}</p>
                  <p><strong>Usuário:</strong> {config.username}</p>
                  <p><strong>SSL:</strong> {config.use_ssl ? 'Habilitado' : 'Desabilitado'}</p>
                  <p><strong>Porta:</strong> {config.port}</p>
                </div>
              </div>

              {detectedIssues.length > 0 && (
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Problemas detectados:</strong>
                    <ul className="mt-2 space-y-1">
                      {detectedIssues.map((issue, index) => (
                        <li key={index} className="text-sm">• {issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              3. Configuração Concluída
            </h3>
            
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Parabéns!</strong><br />
                Sua controladora UniFi foi configurada com sucesso e está respondendo normalmente.
                {config.ignore_ssl && (
                  <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Nota: A conexão está usando SSL com certificados ignorados para compatibilidade.
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Configuração final:</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><strong>Nome:</strong> {config.name}</p>
                <p><strong>URL:</strong> {config.base_url}</p>
                <p><strong>SSL Ignorado:</strong> {config.ignore_ssl ? 'Sim' : 'Não'}</p>
                <p><strong>Status:</strong> <span className="text-green-600">Conectado e funcionando</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || isTestingConnection}
          >
            Voltar
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={handleNext}
              disabled={isTestingConnection || (step === 1 && (!config.base_url || !config.username || !config.password))}
            >
              {step === 2 ? (
                isTestingConnection ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Testando Conexão...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )
              ) : (
                'Próximo'
              )}
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Configuração
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UniFiConnectionWizard;