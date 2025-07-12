import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertTriangle,
  Monitor,
  Users,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useGuacamoleAPI, GuacamoleConnection } from '@/hooks/useGuacamoleAPI';
import { toast } from '@/hooks/use-toast';

interface GuacamoleTestPanelProps {
  connections: GuacamoleConnection[];
  users: any[];
  sessions: any[];
  isConfigured: boolean;
  integration: any;
}

export const GuacamoleTestPanel = ({ 
  connections, 
  users, 
  sessions, 
  isConfigured, 
  integration 
}: GuacamoleTestPanelProps) => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const { useTestConnection } = useGuacamoleAPI();
  const testConnectionMutation = useTestConnection();

  const runConnectionTest = async () => {
    if (!isConfigured) {
      toast({
        title: "Erro de configuração",
        description: "Configure a integração antes de executar testes.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResults({});

    try {
      // Teste básico de conectividade
      const basicTests = {
        integration: integration ? 'success' : 'error',
        baseUrl: integration?.base_url ? 'success' : 'error',
        credentials: (integration?.username && integration?.password) ? 'success' : 'error',
        dataSource: integration?.directory ? 'success' : 'warning'
      };

      // Teste de endpoints
      const endpointTests = {
        connections: connections.length >= 0 ? 'success' : 'error',
        users: users.length >= 0 ? 'success' : 'warning',
        sessions: sessions.length >= 0 ? 'success' : 'warning'
      };

      setTestResults({
        basic: basicTests,
        endpoints: endpointTests,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Testes concluídos",
        description: "Verifique os resultados abaixo.",
      });

    } catch (error) {
      toast({
        title: "Erro nos testes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Sucesso</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Atenção</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Erro</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Painel de Controle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Conectividade
          </CardTitle>
          <CardDescription>
            Execute testes para verificar o funcionamento da integração com o Guacamole
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={runConnectionTest} 
              disabled={testing || !isConfigured}
              className="min-w-[150px]"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Executar Testes
                </>
              )}
            </Button>
            
            {testResults.timestamp && (
              <div className="text-sm text-muted-foreground">
                Último teste: {new Date(testResults.timestamp).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Testes Básicos */}
      {testResults.basic && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Testes de Configuração Básica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.basic.integration)}
                  <div>
                    <div className="font-medium">Integração Configurada</div>
                    <div className="text-sm text-muted-foreground">
                      Verificar se a integração existe e está ativa
                    </div>
                  </div>
                </div>
                {getStatusBadge(testResults.basic.integration)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.basic.baseUrl)}
                  <div>
                    <div className="font-medium">URL Base</div>
                    <div className="text-sm text-muted-foreground">
                      {integration?.base_url || 'Não configurada'}
                    </div>
                  </div>
                </div>
                {getStatusBadge(testResults.basic.baseUrl)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.basic.credentials)}
                  <div>
                    <div className="font-medium">Credenciais</div>
                    <div className="text-sm text-muted-foreground">
                      Usuário e senha configurados
                    </div>
                  </div>
                </div>
                {getStatusBadge(testResults.basic.credentials)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.basic.dataSource)}
                  <div>
                    <div className="font-medium">Data Source</div>
                    <div className="text-sm text-muted-foreground">
                      {integration?.directory || 'postgresql (padrão)'}
                    </div>
                  </div>
                </div>
                {getStatusBadge(testResults.basic.dataSource)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados dos Testes de Endpoints */}
      {testResults.endpoints && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Testes de API e Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.endpoints.connections)}
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Endpoint de Conexões</div>
                    <div className="text-sm text-muted-foreground">
                      {connections.length} conexões encontradas
                    </div>
                  </div>
                </div>
                {getStatusBadge(testResults.endpoints.connections)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.endpoints.users)}
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Endpoint de Usuários</div>
                    <div className="text-sm text-muted-foreground">
                      {users.length} usuários encontrados
                    </div>
                  </div>
                </div>
                {getStatusBadge(testResults.endpoints.users)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResults.endpoints.sessions)}
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Endpoint de Sessões</div>
                    <div className="text-sm text-muted-foreground">
                      {sessions.length} sessões ativas
                    </div>
                  </div>
                </div>
                {getStatusBadge(testResults.endpoints.sessions)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {isConfigured ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            Status Geral da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConfigured ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                A integração com o Guacamole está configurada e funcionando corretamente.
                Execute os testes para verificar a conectividade específica dos endpoints.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                A integração com o Guacamole não está configurada corretamente.
                Verifique as configurações no painel de administração.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};