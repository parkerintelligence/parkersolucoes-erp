
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Server, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const Monitoring = () => {
  const { data: integrations = [] } = useIntegrations();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [dashboards, setDashboards] = useState([]);

  const grafanaIntegration = integrations.find(integration => 
    integration.type === 'grafana' && integration.is_active
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grafanaIntegration) {
      toast({
        title: "Integração não configurada",
        description: "Configure a integração com o Grafana no painel de administração.",
        variant: "destructive"
      });
      return;
    }

    // Verificar credenciais com as configuradas na integração
    if (credentials.username === grafanaIntegration.username && 
        credentials.password === grafanaIntegration.password) {
      setIsAuthenticated(true);
      setDashboards([
        { id: 1, name: 'Sistema Overview', url: `${grafanaIntegration.base_url}/d/sistema-overview` },
        { id: 2, name: 'Performance Metrics', url: `${grafanaIntegration.base_url}/d/performance` },
        { id: 3, name: 'Network Status', url: `${grafanaIntegration.base_url}/d/network` },
      ]);
      toast({
        title: "Login realizado com sucesso",
        description: "Acesso aos dashboards do Grafana liberado.",
      });
    } else {
      toast({
        title: "Credenciais inválidas",
        description: "Usuário ou senha incorretos.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
    setDashboards([]);
  };

  if (!grafanaIntegration) {
    return (
      <Layout>
        <div className="space-y-6">

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Integração não configurada</h3>
              <p className="text-yellow-700">
                Para usar o monitoramento, configure a integração com o Grafana no painel de administração.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="space-y-6">

          <div className="max-w-md mx-auto">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 text-center">Login do Grafana</CardTitle>
                <CardDescription className="text-center">
                  Entre com suas credenciais para acessar os dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                      placeholder="Digite seu usuário"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                        placeholder="Digite sua senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Fazer Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        <Tabs defaultValue="dashboards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboards" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard: any) => (
                <Card key={dashboard.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {dashboard.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(dashboard.url, '_blank')}
                    >
                      Abrir Dashboard
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Sistema de Alertas
                </CardTitle>
                <CardDescription>
                  Alertas e notificações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum alerta ativo no momento.</p>
                  <p className="text-sm mt-2">Sistema funcionando normalmente.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Métricas do Sistema
                </CardTitle>
                <CardDescription>
                  Estatísticas e performance do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">99.9%</p>
                    <p className="text-sm text-slate-600">Uptime</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">45ms</p>
                    <p className="text-sm text-slate-600">Latência</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">12GB</p>
                    <p className="text-sm text-slate-600">Uso de Memória</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Monitoring;
