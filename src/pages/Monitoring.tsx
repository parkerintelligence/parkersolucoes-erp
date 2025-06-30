
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw, ExternalLink, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Monitoring = () => {
  const [selectedDashboard, setSelectedDashboard] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dados simulados dos dashboards do Grafana
  const dashboards = [
    { id: '1', name: 'Sistema Principal', url: 'https://grafana.example.com/d/system', status: 'online' },
    { id: '2', name: 'Servidores', url: 'https://grafana.example.com/d/servers', status: 'online' },
    { id: '3', name: 'Banco de Dados', url: 'https://grafana.example.com/d/database', status: 'warning' },
    { id: '4', name: 'Aplicações', url: 'https://grafana.example.com/d/apps', status: 'online' },
  ];

  // Métricas simuladas
  const metrics = [
    { name: 'CPU Usage', value: '45%', status: 'good', trend: 'up' },
    { name: 'Memory Usage', value: '67%', status: 'warning', trend: 'up' },
    { name: 'Disk Space', value: '23%', status: 'good', trend: 'stable' },
    { name: 'Network I/O', value: '1.2 GB/s', status: 'good', trend: 'down' },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Atualizado!",
        description: "Métricas atualizadas com sucesso.",
      });
    }, 1000);
  };

  const openDashboard = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'online': 'bg-green-100 text-green-800 border-green-200',
      'warning': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'offline': 'bg-red-100 text-red-800 border-red-200',
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>{status}</Badge>;
  };

  const getMetricStatusColor = (status: string) => {
    const colors = {
      'good': 'text-green-600',
      'warning': 'text-yellow-600',
      'critical': 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Monitoramento
            </h1>
            <p className="text-blue-600">Dashboards e métricas do Grafana</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Métricas em Tempo Real */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    <p className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                      {metric.value}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    {metric.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seletor de Dashboard */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Selecionar Dashboard</CardTitle>
            <CardDescription>Escolha um dashboard do Grafana para visualizar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione um dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {dashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDashboard && (
                <Button 
                  onClick={() => {
                    const dashboard = dashboards.find(d => d.id === selectedDashboard);
                    if (dashboard) openDashboard(dashboard.url);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Dashboards */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Dashboards Disponíveis</CardTitle>
            <CardDescription>Todos os dashboards configurados no Grafana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboards.map((dashboard) => (
                <Card key={dashboard.id} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-blue-900">{dashboard.name}</h4>
                      {getStatusBadge(dashboard.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1 mr-2">{dashboard.url}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDashboard(dashboard.url)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Iframe do Dashboard Selecionado */}
        {selectedDashboard && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">
                Dashboard: {dashboards.find(d => d.id === selectedDashboard)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 bg-gray-100 rounded border flex items-center justify-center">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Dashboard do Grafana será exibido aqui</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure a URL do Grafana no painel de administração
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Monitoring;
