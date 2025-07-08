
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Server, AlertTriangle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const Monitoring = () => {
  const { data: integrations = [] } = useIntegrations();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

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
  };

  const openGrafanaDashboard = (path?: string) => {
    if (!grafanaIntegration) return;
    
    const baseUrl = grafanaIntegration.base_url.replace(/\/$/, '');
    const fullUrl = path ? `${baseUrl}${path}` : baseUrl;
    window.open(fullUrl, '_blank');
  };

  const predefinedDashboards = [
    { 
      id: 'system-overview', 
      name: 'Visão Geral do Sistema', 
      path: '/d/system-overview',
      description: 'Dashboard principal com métricas gerais'
    },
    { 
      id: 'server-metrics', 
      name: 'Métricas de Servidores', 
      path: '/d/server-metrics',
      description: 'Monitoramento de CPU, RAM e Disco'
    },
    { 
      id: 'network-monitoring', 
      name: 'Monitoramento de Rede', 
      path: '/d/network-monitoring',
      description: 'Tráfego de rede e latência'
    },
    { 
      id: 'application-performance', 
      name: 'Performance de Aplicações', 
      path: '/d/application-performance',
      description: 'Monitoramento de aplicações e serviços'
    }
  ];

  if (!grafanaIntegration) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="space-y-6">
          <Card className="border-yellow-600 bg-yellow-900/20">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-lg font-semibold text-yellow-200 mb-2">Integração não configurada</h3>
              <p className="text-yellow-300">
                Para usar o monitoramento, configure a integração com o Grafana no painel de administração.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="space-y-6">
          <div className="max-w-md mx-auto">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-center">Login do Grafana</CardTitle>
                <CardDescription className="text-center text-gray-400">
                  Entre com suas credenciais para acessar os dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <p className="text-sm text-blue-200">
                    <strong>Servidor:</strong> {grafanaIntegration.base_url}
                  </p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-200">Usuário</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                      placeholder="Digite seu usuário"
                      required
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-200">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                        placeholder="Digite sua senha"
                        required
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-white"
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-400" />
              Monitoramento - Grafana
            </h1>
            <p className="text-gray-400">Acesse os dashboards do Grafana para monitoramento em tempo real</p>
            <div className="mt-2 text-sm text-gray-300">
              <span className="font-medium">Conectado a:</span> {grafanaIntegration.base_url}
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-gray-600 text-gray-200 hover:bg-gray-800">
            Sair
          </Button>
        </div>

        <Tabs defaultValue="dashboards" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger value="dashboards" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Dashboards</TabsTrigger>
            <TabsTrigger value="grafana" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Grafana Completo</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboards" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predefinedDashboards.map((dashboard) => (
                <Card key={dashboard.id} className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {dashboard.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {dashboard.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => openGrafanaDashboard(dashboard.path)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Dashboard
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Acesso Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-gray-200 hover:bg-gray-700"
                      onClick={() => openGrafanaDashboard('/explore')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Explorar Dados
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-gray-200 hover:bg-gray-700"
                      onClick={() => openGrafanaDashboard('/alerting')}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Alertas
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-gray-200 hover:bg-gray-700"
                      onClick={() => openGrafanaDashboard()}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Grafana Principal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="grafana" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Interface Completa do Grafana
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Acesse a interface completa do Grafana em uma nova aba
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="mb-6">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white mb-2">Grafana Dashboard</h3>
                    <p className="text-gray-400 mb-4">
                      Clique no botão abaixo para abrir a interface completa do Grafana
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => openGrafanaDashboard()}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Abrir Grafana Completo
                  </Button>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>URL: {grafanaIntegration.base_url}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Monitoring;
