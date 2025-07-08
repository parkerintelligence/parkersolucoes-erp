
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const Monitoring = () => {
  const { data: integrations = [] } = useIntegrations();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState('');

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
    setSelectedDashboard('');
  };

  const dashboards = [
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

  const selectedDashboardData = dashboards.find(d => d.id === selectedDashboard);

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
            <p className="text-gray-400">Selecione um painel de controle para visualizar</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-gray-600 text-gray-200 hover:bg-gray-800">
            Sair
          </Button>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Seleção de Painel</CardTitle>
            <CardDescription className="text-gray-400">
              Escolha um painel de controle do Grafana para visualizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dashboard-select" className="text-gray-200">Painel de Controle</Label>
                <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione um painel..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id} className="text-white hover:bg-gray-600">
                        {dashboard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedDashboardData && (
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">{selectedDashboardData.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{selectedDashboardData.description}</p>
                  
                  <div className="bg-gray-800 rounded-lg p-4 min-h-[400px] border border-gray-600">
                    <iframe
                      src={`${grafanaIntegration.base_url}${selectedDashboardData.path}?orgId=1&refresh=10s&from=now-1h&to=now&kiosk`}
                      width="100%"
                      height="400"
                      frameBorder="0"
                      className="rounded"
                      title={selectedDashboardData.name}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitoring;
